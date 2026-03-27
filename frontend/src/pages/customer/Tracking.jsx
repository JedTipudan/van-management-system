import { useEffect, useState } from 'react';
import { bookings } from '../../api/services';
import TrackingMap from '../../components/TrackingMap';
import useSocket from '../../hooks/useSocket';

const HISTORY_KEY = 'tracking_cleared_ids';

const CustomerTracking = () => {
  const [myBookings, setMyBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [location, setLocation] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [clearedIds, setClearedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  });

  useEffect(() => {
    bookings.my().then((r) => {
      setMyBookings(r.data);
      const active = r.data.filter((b) => b.status === 'confirmed');
      if (active.length > 0) setSelected(active[0]);
    });
  }, []);

  const socketRef = useSocket((socket) => {
    socket.emit('join:tracking');
    socket.on('location:update', (data) => {
      setLocation((prev) => {
        if (!selected) return prev;
        return data;
      });
    });
  });

  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.off('location:update');
    socketRef.current.on('location:update', (data) => { setLocation(data); });
    setLocation(null);
  }, [selected]);

  const activeBookings = myBookings.filter((b) => b.status === 'confirmed');
  const historyBookings = myBookings.filter((b) => b.status === 'completed' && !clearedIds.includes(b.id));

  const clearHistory = () => {
    const ids = historyBookings.map((b) => b.id);
    const updated = [...clearedIds, ...ids];
    setClearedIds(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const mapVans = location && selected
    ? [{ van_id: location.van_id, plate_no: selected.plate_no, ...location }]
    : [];

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Track My Van 📍</div>
          <div className="page-subtitle">Real-time location of your booked van</div>
        </div>
        {historyBookings.length > 0 && (
          <button className={`btn ${showHistory ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setShowHistory((v) => !v)}>
            📋 History ({historyBookings.length})
          </button>
        )}
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="table-wrap" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>📋 Completed Trips</div>
            <button className="btn btn-sm btn-ghost" style={{ color: '#ef4444' }} onClick={clearHistory}>🗑️ Clear All</button>
          </div>
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Route</th><th>Van</th><th>Departure</th><th>Ref</th></tr></thead>
              <tbody>
                {historyBookings.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.route_name}</strong><br /><small style={{ color: 'var(--text-3)' }}>{b.origin} → {b.destination}</small></td>
                    <td>{b.plate_no}</td>
                    <td style={{ fontSize: '0.82rem' }}>{new Date(b.departure_time).toLocaleString()}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.8rem' }}>{b.booking_ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeBookings.length === 0 ? (
        <div className="table-wrap">
          <div className="empty-state" style={{ padding: '3rem' }}>
            <div className="empty-state-icon">🚐</div>
            <div className="empty-state-text">No active bookings to track.<br />
              <a href="/customer" style={{ color: 'var(--primary)' }}>Book a trip first!</a>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {activeBookings.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {activeBookings.map((b) => (
                <button key={b.id} className={`btn ${selected?.id === b.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelected(b)}>
                  {b.route_name} — {b.booking_ref}
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="card">
              <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'Booking Ref', value: selected.booking_ref, mono: true },
                  { label: 'Route', value: selected.route_name },
                  { label: 'Van', value: selected.plate_no },
                  { label: 'Departure', value: new Date(selected.departure_time).toLocaleString() },
                  { label: 'Status', value: selected.status, badge: true },
                ].map(({ label, value, mono, badge }) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                    {badge
                      ? <span className={`badge badge-${value}`}>{value}</span>
                      : <div style={{ fontWeight: 600, fontFamily: mono ? 'monospace' : 'inherit', color: mono ? 'var(--primary)' : 'var(--text)' }}>{value}</div>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: location ? '#10b981' : '#f59e0b', boxShadow: location ? '0 0 0 3px rgba(16,185,129,0.2)' : 'none' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-2)', fontWeight: 500 }}>
              {location ? `Live — Last updated ${new Date(location.timestamp).toLocaleTimeString()}` : 'Waiting for driver to share location...'}
            </span>
          </div>

          <TrackingMap vans={mapVans} />
        </div>
      )}
    </>
  );
};

export default CustomerTracking;
