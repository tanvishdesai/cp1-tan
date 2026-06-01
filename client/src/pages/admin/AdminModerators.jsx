import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listModerators } from '../../api/admin.js';

// The full moderation roster: every moderator plus admins (who moderate too).
export default function AdminModerators() {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listModerators()
      .then(setMods)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;

  return (
    <div className="admin-moderators">
      <header className="overview-head">
        <h2>Moderators</h2>
        <p className="muted">
          Everyone with moderation powers. Grant or revoke moderator access from the Users tab.
        </p>
      </header>

      {mods.length === 0 ? (
        <p className="muted">No moderators yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {mods.map((m) => (
              <tr key={m.id}>
                <td>
                  <Link to={`/users/${m.id}`}>{m.name}</Link>
                </td>
                <td className="small">{m.email}</td>
                <td>
                  {m.is_admin ? (
                    <span className="badge">admin</span>
                  ) : (
                    <span className="badge">moderator</span>
                  )}
                </td>
                <td>{m.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
