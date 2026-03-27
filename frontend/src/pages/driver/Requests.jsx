import { useEffect, useState } from 'react';
import { driveRequests, routes } from '../../api/services';
import toast from 'react-hot-toast';

const statusColor = { pending: 'badge-pending', approved: 'badge-active', rejected: 'badge-cancelled' };

const empty = { route_id: '', requested_departure: '', note: '' };

const DriverRequests = () => {
  const [list, setList] = useState([]);
  const [routeList, setRouteList] = useState([]);
  const [form, setForm] = useState(empty);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => driveRequests.my().then((r) => setList(r.data));

  useEffect(() => {
    load();
    routes.getAll().then((r) => setRouteList(r.data));
  }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await driveRequests.create(form);
      toast.success('Request submitted! Waiting for admin approval.');
      setForm(empty); setShowModal(false); load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally { setLoading(false); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this request?')) return;
    try {
      await driveRequests.cancel(id);
      toast.success('Request cancelled'); load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Drive Requests</div>
          <div className="page-subtitle">Request to drive a route — admin will assign your van</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Request</button>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr><th>Route</th><th>Origin → Destination</th><th>Requested Departure</th><th>Note</th><th>Status</th><th>Admin Note</th><th></th></tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🙋</div>
                    <div className="empty-state-text">No requests yet. Submit one to get assigned a trip!</div>
                  </div>
                </td></tr>
              ) : list.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.route_name}</strong></td>
                  <td>{r.origin} → {r.destination}</td>
                  <td>{new Date(r.requested_departure).toLocaleString()}</td>
                  <td>{r.note || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                  <td><span className={`badge ${statusColor[r.status]}`}>{r.status}</span></td>
                  <td>{r.admin_note || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                  <td>
                    {r.status === 'pending' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(r.id)}>Cancel</button>
                    )}
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
              <div className="modal-title">Request to Drive</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Route</label>
                    <select value={form.route_id} onChange={set('route_id')} required>
                      <option value="">Select a route</option>
                      {routeList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} — {r.origin} → {r.destination} (₱{r.fare})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Preferred Departure Time</label>
                    <input type="datetime-local" value={form.requested_departure} onChange={set('requested_departure')} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Note <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
                    <textarea
                      placeholder="Any additional info for the admin..."
                      value={form.note}
                      onChange={set('note')}
                      rows={3}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--surface2)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-2)' }}>
                  ℹ️ Admin will review your request and assign a van. You'll see the status update here.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DriverRequests;
