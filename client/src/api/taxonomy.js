import { api } from './client.js';

// The admin-curated categories + tags the question form offers. The built-in
// "others" tag is added client-side and is always available.
export async function getTaxonomy() {
  const { data } = await api.get('/taxonomy');
  return data; // { categories: [{id,name,slug}], tags: [{id,name,slug}] }
}

// Admin: add a category or tag. kind is 'category' | 'tag'.
export async function createTerm(kind, name) {
  const { data } = await api.post('/admin/taxonomy', { kind, name });
  return data;
}

// Admin: remove a category or tag.
export async function deleteTerm(id) {
  const { data } = await api.delete(`/admin/taxonomy/${id}`);
  return data;
}
