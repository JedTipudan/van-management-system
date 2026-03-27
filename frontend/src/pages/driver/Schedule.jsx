import { useEffect, useState } from 'react';
import { drivers } from '../../api/services';

const fmt = (d) => new Date(d).toLocaleString();
const fmtDate = (d) => new Date(d).toLocaleDateString();

const StatusBadge = ({ status }) => {
  const styles = {
    scheduled:   { bg: '#dbeafe', color: '#1d4ed8' },
    in_progress: { bg: '#fef9c3', color: '#a16207' },
    completed:   { bg: '#dcfce7', color: '#15803d' },
    cancelled:   { bg: '#fee2e2', color: '#b91c1c' },
  };
  const s = styles[status] || styles.scheduled;
  return (
    <span style={{ ...s, borderRadius: 999, padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: 700 }}>
      {status?.replace('_', ' ') || 'scheduled'}
    </span>
  );
};

const DriverSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [tab, setTab] = useState('active');

  useEffect(() => { drivers.mySchedule().then((r) => setSchedule(r.data)); }, []);

  const active  = schedule.filter((s) => !s.trip_status || ['scheduled', 'in_progress'].includes(s.trip_status));
  const history = schedule.filter((s) => ['completed', 'cancelled'].includes(s.trip_status));

  const ScheduleTable = ({ list, showTripStatus = false }) => (
    <div className="table-wrap">
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Origin → Destination</th>
              <th>Van</th>
              <th>Departure</th>
              <th>Est. Time</th>
              {showTripStatus && <th>Trip</th>}
              {showTripStatus && <th>Ended</th>}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={showTripStatus ? 7 : 5}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📅</div>
                    <div className="empty-state-text">
                      {showTripStatus ? 'No completed trips yet.' : 'No active schedules assigned to you.'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : list.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.route_name}</strong></td>
                <td style={{ fontSize: '0.85rem' }}>{s.origin} → {s.destination}</td>
                <td>
                  {s.plate_no}
                  <small style={{ color: 'var(--text-3)', marginLeft: 4 }}>({s.model})</small>
                </td>
                <td style={{ fontSize: '0.85rem' }}>{fmt(s.departure_time)}</td>
                <td>{s.estimated_minutes} min</td>
                {showTripStatus && <td><StatusBadge status={s.trip_status} /></td>}
                {showTripStatus && (
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>
                    {s.end_time ? fmt(s.end_time) : '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">My Schedule 📅</div>
          <div className="page-subtitle">Your assigned routes and departure times</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`btn ${tab === 'active' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('active')}>
            🟢 Active
            {active.length > 0 && (
              <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 999, padding: '0 6px', marginLeft: 4, fontSize: '0.75rem' }}>{active.length}</span>
            )}
          </button>
          <button className={`btn ${tab === 'history' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('history')}>
            📋 History
            {history.length > 0 && (
              <span style={{ background: tab === 'history' ? 'rgba(255,255,255,0.3)' : 'var(--border)', borderRadius: 999, padding: '0 6px', marginLeft: 4, fontSize: '0.75rem' }}>{history.length}</span>
            )}
          </button>
        </div>
      </div>

      {tab === 'active'  && <ScheduleTable list={active} />}
      {tab === 'history' && <ScheduleTable list={history} showTripStatus />}
    </>
  );
};

export default DriverSchedule;
