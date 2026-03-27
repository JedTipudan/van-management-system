import { useEffect, useState } from 'react';
import { driveRequests, vans } from '../../api/services';
import toast from 'react-hot-toast';

const statusColor = { pending: 'badge-pending', approved: 'badge-active', rejected: 'badge-cancelled' };

const AdminRequests = () => {
  const [list, setList] = useState([]);
  const [vanList, setVanList] = useState([]);
  const [status, setStatus] = useState('pending');
  const [approveModal, setApproveModal] = useState(null); // request object
  const [rejectModal, setRejectModal] = useState(null);
  const [vanId, setVanId] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => driveRequests.getAll(status ? { status } : {}).then((r) => setList(r.data));

  useEffect(() => {
    load();
    vans.getAll({ status: 'active' }).then((r) => setVanList(r.data.data));
  }, [status]);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!vanId) return toast.error('Please select a van');
    setLoading(true);
    try {
      await driveRequests.approve(approveModal.id, { van_id: vanId, admin_note: adminNote });
      toast.success('✅ Request approved! Schedule and trip created.');
      setApproveModal(null); setVanId(''); setAdminNote(''); load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error approving request');
    } finally { setLoading(false); }
  };

  const handleReject = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await driveRequests.reject(rejectModal.id, { admin_note: adminNote });
      toast.success('Request rejected');
      setRejectModal(null); setAdminNote(''); load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setLoading(false); }
  };

  const pendingCount = list.filter((r) => r.status === 'pending').length;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">
            Drive Requests
            {pendingCount > 0 && status === 'pending' && (
              <span style={{ marginLeft: '0.5rem', background: '#ef4444', color: '#fff', borderRadius: 999, padding: '0.1rem 0.55rem', fontSize: '0.75rem', fontWeight: 700 }}>
                {pendingCount}
              </span>
            )}
          </div>
          <div className="page-subtitle">Review and approve driver trip requests</div>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 'auto' }}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr><th>Driver</th><th>Route</th><th>Requested Departure</th><th>Note</th><th>Status</th><th>Submitted</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-text">No {status} requests</div>
                  </div>
                </td></tr>
              ) : list.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.driver_name}</strong>
                    <br /><small style={{ color: 'var(--text-3)' }}>{r.driver_phone}</small>
                  </td>
                  <td>
                    <strong>{r.route_name}</strong>
                    <br /><small style={{ color: 'var(--text-3)' }}>{r.origin} → {r.destination}</small>
                  </td>
                  <td>{new Date(r.requested_departure).toLocaleString()}</td>
                  <td>{r.note || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                  <td><span className={`badge ${statusColor[r.status]}`}>{r.status}</span></td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>
                    {r.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-success btn-sm" onClick={() => { setApproveModal(r); setAdminNote(''); setVanId(''); }}>
                          ✓ Approve
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => { setRejectModal(r); setAdminNote(''); }}>
                          ✕ Reject
                        </button>
                      </div>
                    )}
                    {r.status !== 'pending' && r.admin_note && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontStyle: 'italic' }}>{r.admin_note}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Modal */}
      {approveModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setApproveModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">✅ Approve Request</div>
              <button className="modal-close" onClick={() => setApproveModal(null)}>✕</button>
            </div>
            <form onSubmit={handleApprove}>
              <div className="modal-body">
                <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div><strong>{approveModal.driver_name}</strong> → <strong>{approveModal.route_name}</strong></div>
                  <div style={{ color: 'var(--text-2)', marginTop: 4 }}>
                    Departure: {new Date(approveModal.requested_departure).toLocaleString()}
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Assign Van <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <select value={vanId} onChange={(e) => setVanId(e.target.value)} required>
                      <option value="">Select a van</option>
                      {vanList.map((v) => (
                        <option key={v.id} value={v.id}>{v.plate_no} — {v.model} ({v.capacity} seats)</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Note to Driver <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
                    <textarea placeholder="e.g. Be at the terminal by 7am" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} style={{ resize: 'vertical' }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setApproveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={loading}>{loading ? 'Approving...' : '✓ Approve & Create Schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setRejectModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">✕ Reject Request</div>
              <button className="modal-close" onClick={() => setRejectModal(null)}>✕</button>
            </div>
            <form onSubmit={handleReject}>
              <div className="modal-body">
                <div style={{ background: '#fee2e2', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div><strong>{rejectModal.driver_name}</strong> → <strong>{rejectModal.route_name}</strong></div>
                  <div style={{ color: '#b91c1c', marginTop: 4 }}>This will notify the driver their request was rejected.</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
                  <textarea placeholder="e.g. No available van for that time" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setRejectModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={loading}>{loading ? 'Rejecting...' : '✕ Reject Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminRequests;
