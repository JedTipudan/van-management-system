import { useEffect, useState } from 'react';
import { routes } from '../../api/services';
import toast from 'react-hot-toast';

const empty = { name: '', origin: '', destination: '', distance_km: '', estimated_minutes: '', fare: '' };

const Routes = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => routes.getAll().then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const openEdit = (r) => {
    setForm({ name: r.name, origin: r.origin, destination: r.destination, distance_km: r.distance_km || '', estimated_minutes: r.estimated_minutes || '', fare: r.fare });
    setEditing(r.id); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (editing) await routes.update(editing, form);
      else await routes.create(form);
      toast.success(editing ? 'Route updated!' : 'Route created!');
      setShowModal(false); setEditing(null); load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Routes</div>
          <div className="page-subtitle">Manage van routes and fares</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(empty); setEditing(null); setShowModal(true); }}>+ Add Route</button>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr><th>Route Name</th><th>Origin</th><th>Destination</th><th>Distance</th><th>Est. Time</th><th>Fare</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">🗺️</div><div className="empty-state-text">No routes found</div></div></td></tr>
              ) : list.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td>{r.origin}</td>
                  <td>{r.destination}</td>
                  <td>{r.distance_km ? `${r.distance_km} km` : '—'}</td>
                  <td>{r.estimated_minutes ? `${r.estimated_minutes} min` : '—'}</td>
                  <td><strong style={{ color: 'var(--success)' }}>₱{r.fare}</strong></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>✏️ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={async () => { await routes.remove(r.id); toast.success('Route deactivated'); load(); }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit Route' : 'Add New Route'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Route Name</label>
                    <input placeholder="Route 1 - North" value={form.name} onChange={set('name')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Origin</label>
                    <input placeholder="Cubao, QC" value={form.origin} onChange={set('origin')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination</label>
                    <input placeholder="Fairview, QC" value={form.destination} onChange={set('destination')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Distance (km)</label>
                    <input type="number" placeholder="12.5" value={form.distance_km} onChange={set('distance_km')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Est. Minutes</label>
                    <input type="number" placeholder="45" value={form.estimated_minutes} onChange={set('estimated_minutes')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fare (₱)</label>
                    <input type="number" placeholder="35" value={form.fare} onChange={set('fare')} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Route'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Routes;
