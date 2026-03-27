import { useEffect, useState } from 'react';
import { trips } from '../../api/services';

const RECKLESS_SPEED = 80; // km/h threshold

const SpeedBadge = ({ speed }) => {
  if (!speed) return <span style={{ color: 'var(--text-3)' }}>—</span>;
  const s = parseFloat(speed);
  const color = s > RECKLESS_SPEED ? '#ef4444' : s > 60 ? '#f59e0b' : '#10b981';
  const bg = s > RECKLESS_SPEED ? '#fee2e2' : s > 60 ? '#fef9c3' : '#dcfce7';
  return (
    <span style={{ background: bg, color, borderRadius: 999, padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}>
      {s > RECKLESS_SPEED ? '⚠️ ' : ''}{s.toFixed(0)} km/h
    </span>
  );
};

const DelayBadge = ({ minutes }) => {
  const m = parseFloat(minutes || 0);
  if (m <= 0) return <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.8rem' }}>✓ On time</span>;
  const color = m > 30 ? '#ef4444' : m > 10 ? '#f59e0b' : '#64748b';
  return <span style={{ color, fontWeight: 600, fontSize: '0.8rem' }}>+{m.toFixed(0)} min late</span>;
};

const Trips = () => {
  const [list, setList] = useState([]);
  const [status, setStatus] = useState('');
  const [performance, setPerformance] = useState([]);
  const [tab, setTab] = useState('trips');
  const [selected, setSelected] = useState(null);

  const load = () => trips.getAll(status ? { status } : {}).then((r) => setList(r.data));
  const loadPerf = () => trips.driverPerformance().then((r) => setPerformance(r.data));

  useEffect(() => { load(); }, [status]);
  useEffect(() => { if (tab === 'performance') loadPerf(); }, [tab]);

  const recklessCount = list.filter((t) => parseFloat(t.max_speed) > RECKLESS_SPEED).length;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">
            Trips
            {recklessCount > 0 && (
              <span style={{ marginLeft: '0.5rem', background: '#ef4444', color: '#fff',
                borderRadius: 999, padding: '0.1rem 0.55rem', fontSize: '0.75rem', fontWeight: 700 }}>
                ⚠️ {recklessCount} reckless
              </span>
            )}
          </div>
          <div className="page-subtitle">Monitor trip activity and driver behavior</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {tab === 'trips' && (
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 'auto' }}>
              <option value="">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}
          <button className={`btn ${tab === 'trips' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('trips')}>🛣️ Trips</button>
          <button className={`btn ${tab === 'performance' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('performance')}>👤 Driver Report</button>
        </div>
      </div>

      {tab === 'trips' && (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Route</th><th>Driver</th><th>Van</th>
                  <th>Scheduled</th><th>Actual Start</th><th>Arrival</th>
                  <th>Delay</th><th>Max Speed</th><th>Status</th><th>Pax</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={10}><div className="empty-state"><div className="empty-state-icon">🛣️</div><div className="empty-state-text">No trips found</div></div></td></tr>
                ) : list.map((t) => {
                  const isReckless = parseFloat(t.max_speed) > RECKLESS_SPEED;
                  return (
                    <tr key={t.id}
                      style={{ background: isReckless ? '#fff5f5' : undefined, cursor: 'pointer' }}
                      onClick={() => setSelected(t)}
                    >
                      <td>
                        <strong>{t.route_name}</strong>
                        <br /><small style={{ color: 'var(--text-3)' }}>{t.origin} → {t.destination}</small>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.driver_name}</div>
                        <small style={{ color: 'var(--text-3)' }}>{t.driver_phone}</small>
                      </td>
                      <td>{t.plate_no}</td>
                      <td style={{ fontSize: '0.82rem' }}>{new Date(t.departure_time).toLocaleString()}</td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {t.start_time
                          ? <span style={{ color: '#0f172a' }}>{new Date(t.start_time).toLocaleString()}</span>
                          : <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {t.end_time
                          ? <span style={{ color: '#10b981', fontWeight: 600 }}>{new Date(t.end_time).toLocaleString()}</span>
                          : <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                      <td><DelayBadge minutes={t.delay_minutes} /></td>
                      <td><SpeedBadge speed={t.max_speed} /></td>
                      <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                      <td><strong>{t.booking_count}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'performance' && (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Driver</th><th>Total Trips</th><th>Completed</th>
                  <th>Avg Delay</th><th>Avg Speed</th><th>Top Speed</th>
                  <th>⚠️ Reckless Trips</th><th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {performance.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">👤</div><div className="empty-state-text">No performance data yet</div></div></td></tr>
                ) : performance.map((d) => {
                  const isReckless = parseInt(d.reckless_trips) > 0;
                  return (
                    <tr key={d.license_no} style={{ background: isReckless ? '#fff5f5' : undefined }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isReckless && <span title="Reckless driver">⚠️</span>}
                          <div>
                            <div style={{ fontWeight: 700 }}>{d.driver_name}</div>
                            <small style={{ color: 'var(--text-3)' }}>{d.phone} · {d.license_no}</small>
                          </div>
                        </div>
                      </td>
                      <td>{d.total_trips}</td>
                      <td>{d.completed_trips}</td>
                      <td><DelayBadge minutes={d.avg_delay_minutes} /></td>
                      <td><SpeedBadge speed={d.avg_speed_overall} /></td>
                      <td><SpeedBadge speed={d.highest_speed_ever} /></td>
                      <td>
                        {parseInt(d.reckless_trips) > 0
                          ? <span style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 999,
                              padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 700 }}>
                              ⚠️ {d.reckless_trips} trips over {RECKLESS_SPEED} km/h
                            </span>
                          : <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.8rem' }}>✓ Safe driver</span>
                        }
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#f59e0b' }}>★ {d.rating}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trip detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Trip Details</div>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {parseFloat(selected.max_speed) > RECKLESS_SPEED && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8,
                  padding: '0.75rem 1rem', color: '#b91c1c', fontWeight: 600, fontSize: '0.875rem' }}>
                  ⚠️ Reckless driving detected! Max speed reached {parseFloat(selected.max_speed).toFixed(0)} km/h on this trip.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                {[
                  { label: '🗺️ Route', value: selected.route_name },
                  { label: '👤 Driver', value: `${selected.driver_name} (${selected.driver_phone})` },
                  { label: '🚐 Van', value: `${selected.plate_no} — ${selected.model}` },
                  { label: '🪑 Passengers', value: `${selected.booking_count} / ${selected.capacity}` },
                  { label: '📅 Scheduled Departure', value: new Date(selected.departure_time).toLocaleString() },
                  { label: '▶ Actual Start', value: selected.start_time ? new Date(selected.start_time).toLocaleString() : 'Not started' },
                  { label: '🏁 Arrival / End', value: selected.end_time ? new Date(selected.end_time).toLocaleString() : 'Not completed' },
                  { label: '⏱️ Actual Duration', value: selected.actual_duration_minutes ? `${parseFloat(selected.actual_duration_minutes).toFixed(0)} min` : '—' },
                  { label: '⏰ Est. Duration', value: selected.estimated_minutes ? `${selected.estimated_minutes} min` : '—' },
                  { label: '🕐 Delay', value: parseFloat(selected.delay_minutes) > 0 ? `+${parseFloat(selected.delay_minutes).toFixed(0)} min` : 'On time' },
                  { label: '🚀 Max Speed', value: selected.max_speed ? `${parseFloat(selected.max_speed).toFixed(0)} km/h` : '—' },
                  { label: '📊 Avg Speed', value: selected.avg_speed ? `${parseFloat(selected.avg_speed).toFixed(0)} km/h` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '0.6rem 0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Trips;
