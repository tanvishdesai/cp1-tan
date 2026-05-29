import { api } from './client.js';

export async function listNotifications() {
  const { data } = await api.get('/notifications');
  return data.items;
}

export async function getUnreadCount() {
  const { data } = await api.get('/notifications/unread-count');
  return data.count;
}

export async function markRead(id) {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllRead() {
  await api.post('/notifications/read-all');
}
