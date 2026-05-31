import { api } from './client.js';

export async function getProfile(id) {
  const { data } = await api.get(`/users/${id}`);
  return data.user;
}

// Update the current user's name + notification preferences.
export async function updateMe(payload) {
  const { data } = await api.patch('/users/me', payload);
  return data.user;
}

// The current user's recent activity feed (asked / answered / saved).
export async function getActivity(limit = 8) {
  const { data } = await api.get('/users/me/activity', { params: { limit } });
  return data.items;
}

// Request to become a moderator (Expert tier). Returns { moderator_requested }.
export async function requestModerator() {
  const { data } = await api.post('/users/me/request-moderator');
  return data;
}

export async function banUser(id, { hours, reason }) {
  const { data } = await api.post(`/admin/users/${id}/ban`, { hours, reason });
  return data;
}

export async function unbanUser(id) {
  const { data } = await api.post(`/admin/users/${id}/unban`);
  return data;
}

export async function issueNegativeBadge(id, key, reason) {
  const { data } = await api.post(`/admin/users/${id}/badge`, { key, reason });
  return data;
}

export async function revokeNegativeBadge(id, key) {
  const { data } = await api.delete(`/admin/users/${id}/badge/${key}`);
  return data;
}

export async function awardCustomBadge(id, payload) {
  const { data } = await api.post(`/admin/users/${id}/custom-badge`, payload);
  return data;
}

export async function revokeCustomBadge(id, key) {
  const { data } = await api.delete(`/admin/users/${id}/custom-badge/${key}`);
  return data;
}
