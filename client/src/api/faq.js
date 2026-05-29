import { api } from './client.js';

export async function listFaqs(category) {
  const { data } = await api.get('/faq', { params: category ? { category } : {} });
  return data.groups;
}

export async function searchFaqs(q) {
  const { data } = await api.get('/faq/search', { params: { q } });
  return data.results;
}

export async function promoteQuery(queryId) {
  const { data } = await api.post(`/faq/promote/${queryId}`);
  return data.entry;
}
