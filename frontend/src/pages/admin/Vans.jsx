import { useEffect, useState } from 'react';
import { vans } from '../../api/services';
import toast from 'react-hot-toast';

const empty = { plate_no: '', model: '', capacity: '', year: '', status: 'active' };

const Vans = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => vans.getAll().then((r) => setList(r.data.data));
  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const openAdd = () => { setForm(empty); setEditing(null); setShowModal(true); };
  const openEdit = (v) => {
    setForm({ plate_no: v.plate_no, model: v.model || '', capacity: v.capacity, year: v.year || '', status: v.status });
    setEditing(v.id); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (editing) await vans.update(editing, form);
      else await vans.create(form);
      toast.success(editing ? 'Van updated!' : 'Van added!');
      setShowModal(false); load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving van');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this van?')) return;
    await vans.remove(id); toast.success('Van deleted'); load();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Vans</div>
          <div className="page-subtitle">Manage your fleet of vans</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Van</button>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr><th>Plate No</th><th>Model</th><th>Capacity</th><th>Year</th><th>Status</th><th>Driver</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">🚐</div><div className="empty-state-text">No vans found</div></div></td></tr>
              ) : list.map((v) => (
                <tr key={v.id}>
                  <td><strong>{v.plate_no}</strong></td>
                  <td>{v.model || '—'}</td>
                  <td>{v.capacity} seats</td>
                  <td>{v.year || '—'}</td>
                  <td><span className={`badge badge-${v.status}`}>{v.status}</span></td>
                  <td>{v.driver_name || <span style={{ color: 'var(--text-3)' }}>Unassigned</span>}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(v)}>✏️ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id)}>🗑️</button>
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
              <div className="modal-title">{editing ? 'Edit Van' : 'Add New Van'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Plate Number</label>
                    <input placeholder="ABC-1234" value={form.plate_no} onChange={set('plate_no')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Model</label>
                    <input placeholder="Toyota HiAce" value={form.model} onChange={set('model')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Capacity (seats)</label>
                    <input type="number" placeholder="15" value={form.capacity} onChange={set('capacity')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <input type="number" placeholder="2022" value={form.year} onChange={set('year')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select value={form.status} onChange={set('status')}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Van'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Vans;
