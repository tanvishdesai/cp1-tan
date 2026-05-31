import request from 'supertest';
import { createApp } from '../app.js';
import { setupTestDB, teardownTestDB, clearDB } from './helpers.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { awardPoints } from '../services/badgeService.js';
import { expireBans } from '../jobs/expireBans.js';

const app = createApp();

beforeAll(async () => {
  await setupTestDB();
});
afterAll(async () => {
  await teardownTestDB();
});
afterEach(async () => {
  await clearDB();
});

async function makeUser(overrides = {}) {
  const payload = {
    name: 'User',
    email: `u${Math.random().toString(36).slice(2)}@example.com`,
    password: 'supersecret1',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return { token: res.body.accessToken, user: res.body.user };
}

async function makeAdmin() {
  const { token, user } = await makeUser({ name: 'Admin' });
  await User.updateOne({ _id: user.id }, { role: 'admin' });
  return { token, user };
}

const authed = (req, token) => req.set('Authorization', `Bearer ${token}`);

describe('positive badges', () => {
  test('awardPoints unlocks tiered badges and notifies', async () => {
    const { user } = await makeUser();

    await awardPoints(user.id, 29);
    let dbUser = await User.findById(user.id);
    expect(dbUser.badges).toEqual([]); // below the first threshold (30)

    await awardPoints(user.id, 101); // total 130 → helper (30) + contributor (100)
    dbUser = await User.findById(user.id);
    expect(dbUser.badges).toEqual(['helper', 'contributor']);

    const badgeNotifs = await Notification.find({ recipient_id: user.id, type: 'badge' });
    expect(badgeNotifs).toHaveLength(2);
  });

  test('losing points removes badges no longer earned', async () => {
    const { user } = await makeUser();
    await awardPoints(user.id, 60); // helper
    await awardPoints(user.id, -40); // back to 20
    const dbUser = await User.findById(user.id);
    expect(dbUser.points).toBe(20);
    expect(dbUser.badges).toEqual([]);
  });

  test('profile exposes points, badges and activity counts', async () => {
    const { user } = await makeUser({ name: 'Ada' });
    await awardPoints(user.id, 50);
    const res = await request(app).get(`/api/users/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Ada');
    expect(res.body.user.points).toBe(50);
    expect(res.body.user.badges[0].key).toBe('helper');
    expect(res.body.user.query_count).toBe(0);
  });
});

describe('bans & governance', () => {
  test('admin can ban a user, blocking their writes; unban restores access', async () => {
    const admin = await makeAdmin();
    const target = await makeUser();

    const banned = await authed(
      request(app).post(`/api/admin/users/${target.user.id}/ban`),
      admin.token,
    ).send({ hours: 24, reason: 'Spamming' });
    expect(banned.status).toBe(200);
    expect(banned.body.ban_expires_at).toBeTruthy();

    const blocked = await authed(request(app).post('/api/queries'), target.token).send({
      title: 'A perfectly valid question title here',
      body: 'This body is long enough and clearly readable as a real question.',
    });
    expect(blocked.status).toBe(403);

    await authed(request(app).post(`/api/admin/users/${target.user.id}/unban`), admin.token).send();
    const dbUser = await User.findById(target.user.id);
    expect(dbUser.is_banned).toBe(false);
  });

  test('non-admins cannot ban', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const res = await authed(request(app).post(`/api/admin/users/${b.user.id}/ban`), a.token).send({});
    expect(res.status).toBe(403);
  });

  test('issuing a Restricted negative badge sets approval requirement', async () => {
    const admin = await makeAdmin();
    const target = await makeUser();

    const res = await authed(
      request(app).post(`/api/admin/users/${target.user.id}/badge`),
      admin.token,
    ).send({ key: 'restricted', reason: 'Repeated low-quality posts' });
    expect(res.status).toBe(200);

    const dbUser = await User.findById(target.user.id);
    expect(dbUser.requires_approval).toBe(true);
    expect(dbUser.negative_badges.some((b) => b.key === 'restricted')).toBe(true);
  });

  test('expire-bans job lifts only elapsed time-limited bans', async () => {
    const permanent = await makeUser();
    const temporary = await makeUser();

    await User.updateOne({ _id: permanent.user.id }, { is_banned: true, ban_expires_at: null });
    await User.updateOne(
      { _id: temporary.user.id },
      { is_banned: true, ban_expires_at: new Date(Date.now() - 60_000) },
    );

    const result = await expireBans();
    expect(result.lifted).toBe(1);

    const permDoc = await User.findById(permanent.user.id);
    const tempDoc = await User.findById(temporary.user.id);
    expect(permDoc.is_banned).toBe(true); // permanent untouched
    expect(tempDoc.is_banned).toBe(false); // elapsed → lifted
  });
});
