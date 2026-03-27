import { useEffect, useState } from 'react';
import { schedules, vans, drivers, routes } from '../../api/services';
import toast from 'react-hot-toast';

const empty = { van_id: '', driver_id: '', route_id: '', departure_time: '', recurrence: 'once' };

const Schedules = () => {
  const [list, setList] = useState([]);
  const [vanList, setVanList] = useState([]);
  const [driverList, setDriverList] = useState([]);
  const [routeList, setRouteList] = useState([]);
  const [form, setForm] = useState(empty);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => schedules.getAll().then((r) => setList(r.data));

  useEffect(() => {
    load();
    vans.getAll({ status: 'active' }).then((r) => setVanList(r.data.data));
    drivers.getAll({ status: 'available' }).then((r) => setDriverList(r.data));
    routes.getAll().then((r) => setRouteList(r.data));
  }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await schedules.create(form);
      toast.success('Schedule created!');
      setShowModal(false); setForm(empty); load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error creating schedule');
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Schedules</div>
          <div className="page-subtitle">Assign vans and drivers to routes</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Schedule</button>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr><th>Route</th><th>Van</th><th>Driver</th><th>Departure</th><th>Recurrence</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">📅</div><div className="empty-state-text">No schedules found</div></div></td></tr>
              ) : list.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.route_name}</strong><br /><small style={{ color: 'var(--text-3)' }}>{s.origin} → {s.destination}</small></td>
                  <td>{s.plate_no}<br /><small style={{ color: 'var(--text-3)' }}>{s.model}</small></td>
                  <td>{s.driver_name}</td>
                  <td>{new Date(s.departure_time).toLocaleString()}</td>
                  <td><span className="badge badge-scheduled">{s.recurrence}</span></td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={async () => { await schedules.remove(s.id); toast.success('Removed'); load(); }}>🗑️ Remove</button>
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
              <div className="modal-title">Create Schedule</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Van</label>
                    <select value={form.van_id} onChange={set('van_id')} required>
                      <option value="">Select Van</option>
                      {vanList.map((v) => <option key={v.id} value={v.id}>{v.plate_no} — {v.model}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Driver</label>
                    <select value={form.driver_id} onChange={set('driver_id')} required>
                      <option value="">Select Driver</option>
                      {driverList.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Route</label>
                    <select value={form.route_id} onChange={set('route_id')} required>
                      <option value="">Select Route</option>
                      {routeList.map((r) => <option key={r.id} value={r.id}>{r.name} — ₱{r.fare}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Departure Time</label>
                    <input type="datetime-local" value={form.departure_time} onChange={set('departure_time')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Recurrence</label>
                    <select value={form.recurrence} onChange={set('recurrence')}>
                      <option value="once">Once</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Schedules;
