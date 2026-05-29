import { useEffect, useState } from 'react';
import { listFaqs, searchFaqs } from '../api/faq.js';

export default function Faq() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listFaqs();
        if (active) setGroups(data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const onSearch = async (e) => {
    e.preventDefault();
    if (!term.trim()) {
      setResults(null);
      return;
    }
    setResults(await searchFaqs(term));
  };

  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  return (
    <div className="container">
      <h1>FAQ</h1>
      <p className="lead">Browse common questions, or search across the knowledge base.</p>

      <form className="search-bar" onSubmit={onSearch}>
        <input placeholder="Search the FAQ…" value={term} onChange={(e) => setTerm(e.target.value)} />
        <button className="btn-primary">Search</button>
        {results !== null && (
          <button
            type="button"
            className="btn-link"
            onClick={() => {
              setTerm('');
              setResults(null);
            }}
          >
            Clear
          </button>
        )}
      </form>

      {results !== null ? (
        <section>
          <h2>Search results</h2>
          {results.length === 0 ? (
            <p className="muted">No matching FAQ entries. Try the chatbot or ask the community.</p>
          ) : (
            <div className="faq-accordion">
              {results.map((r) => (
                <FaqItem key={r.id} entry={r} open={open[r.id]} onToggle={() => toggle(r.id)} />
              ))}
            </div>
          )}
        </section>
      ) : loading ? (
        <p>Loading…</p>
      ) : groups.length === 0 ? (
        <p className="muted">No FAQ entries yet.</p>
      ) : (
        groups.map((g) => (
          <section key={g.category}>
            <h2>{g.category}</h2>
            <div className="faq-accordion">
              {g.items.map((item) => (
                <FaqItem
                  key={item.id}
                  entry={item}
                  open={open[item.id]}
                  onToggle={() => toggle(item.id)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function FaqItem({ entry, open, onToggle }) {
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-q" onClick={onToggle}>
        <span>{entry.question}</span>
        <span className="chevron">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="faq-a">
          {entry.answer}
          {entry.source === 'qa' && <span className="faq-source">From the community</span>}
        </div>
      )}
    </div>
  );
}
