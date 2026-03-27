import { useEffect, useState } from 'react';
import { drivers } from '../../api/services';
import toast from 'react-hot-toast';

const empty = { name: '', email: '', password: '', phone: '', license_no: '', license_expiry: '' };

const Drivers = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => drivers.getAll().then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await drivers.create(form);
      toast.success('Driver created!');
      setShowModal(false); setForm(empty); load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error creating driver');
    } finally { setLoading(false); }
  };

  const handleStatus = async (id, status) => {
    await drivers.updateStatus(id, status);
    toast.success('Status updated'); load();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Drivers</div>
          <div className="page-subtitle">Manage your driver roster</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Driver</button>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>License No</th><th>Expiry</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">👤</div><div className="empty-state-text">No drivers found</div></div></td></tr>
              ) : list.map((d) => (
                <tr key={d.id}>
                  <td><strong>{d.name}</strong></td>
                  <td>{d.email}</td>
                  <td>{d.phone || '—'}</td>
                  <td>{d.license_no}</td>
                  <td>{d.license_expiry?.slice(0, 10)}</td>
                  <td><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                  <td>
                    <select
                      value={d.status}
                      onChange={(e) => handleStatus(d.id, e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', width: 'auto' }}
                    >
                      <option value="available">Available</option>
                      <option value="on_trip">On Trip</option>
                      <option value="off_duty">Off Duty</option>
                    </select>
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
              <div className="modal-title">Add New Driver</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input placeholder="Juan Dela Cruz" value={form.name} onChange={set('name')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" placeholder="driver@email.com" value={form.email} onChange={set('email')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input placeholder="+63 900 000 0000" value={form.phone} onChange={set('phone')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">License No</label>
                    <input placeholder="N01-23-456789" value={form.license_no} onChange={set('license_no')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">License Expiry</label>
                    <input type="date" value={form.license_expiry} onChange={set('license_expiry')} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Driver'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Drivers;
