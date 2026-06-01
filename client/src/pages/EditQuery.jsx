import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuery, updateQuery } from '../api/queries.js';
import { getTaxonomy } from '../api/taxonomy.js';

const OTHERS_TAG = { slug: 'others', name: 'Others (no relevant tag)' };

// Render a stored Date/ISO value as the yyyy-mm-dd a <input type="date"> wants.
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

export default function EditQuery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [taxonomy, setTaxonomy] = useState({ categories: [], tags: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [q, tax] = await Promise.all([getQuery(id), getTaxonomy()]);
        if (!q.is_owner) {
          navigate(`/queries/${id}`);
          return;
        }
        if (active) {
          setTaxonomy(tax);
          setSelectedTags(q.tags ?? []);
          setForm({
            title: q.title,
            body: q.body,
            category: q.category ?? tax.categories[0]?.slug ?? '',
            contact_email: q.contact_email ?? '',
            joining_date: toDateInput(q.joining_date),
          });
        }
      } catch {
        if (active) setError('Failed to load the question.');
      }
    })();
    return () => {
      active = false;
    };
  }, [id, navigate]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const toggleTag = (slug) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug],
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await updateQuery(id, { ...form, tags: selectedTags.join(',') });
      navigate(`/queries/${id}`);
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 422 && data?.details?.gibberish) {
        setError('This edit looks like gibberish and was blocked.');
      } else {
        setError(data?.error ?? 'Could not save your changes.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (error && !form) return <div className="container"><p className="muted">{error}</p></div>;
  if (!form) return <div className="container">Loading…</div>;

  return (
    <div className="container narrow-wide">
      <h1>Edit question</h1>
      <form onSubmit={onSubmit} className="form">
        {error && <div className="alert">{error}</div>}
        <label>
          Title
          <input name="title" value={form.title} onChange={onChange} required minLength={8} />
        </label>
        <label>
          Details
          <textarea name="body" value={form.body} onChange={onChange} rows={8} required />
        </label>
        <div className="grid-2">
          <label>
            Contact email
            <input
              name="contact_email"
              type="email"
              value={form.contact_email}
              onChange={onChange}
              required
            />
          </label>
          <label>
            Joining date
            <input
              name="joining_date"
              type="date"
              value={form.joining_date}
              onChange={onChange}
              required
            />
          </label>
        </div>
        <label>
          Category
          <select name="category" value={form.category} onChange={onChange} required>
            <option value="" disabled>
              Select a category…
            </option>
            {taxonomy.categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="tag-picker">
          <legend>Tags</legend>
          <div className="tag-options">
            {[...taxonomy.tags, OTHERS_TAG].map((t) => (
              <label key={t.slug} className="checkbox tag-option">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(t.slug)}
                  onChange={() => toggleTag(t.slug)}
                />
                {t.name}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="row">
          <button className="btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" className="btn-link" onClick={() => navigate(`/queries/${id}`)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
