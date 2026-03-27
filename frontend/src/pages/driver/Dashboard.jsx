import { useEffect, useState } from 'react';
import { drivers, trips } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const DriverDashboard = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [myTrips, setMyTrips] = useState([]);
  const [driverInfo, setDriverInfo] = useState(null);

  const loadTrips = () => trips.getAll().then((r) => setMyTrips(r.data));

  useEffect(() => {
    drivers.mySchedule().then((r) => setSchedule(r.data)).catch(() => {});
    drivers.myVan().then((r) => setDriverInfo(r.data)).catch(() => {});
    loadTrips();
  }, []);

  const handleStart = async (id) => {
    try { await trips.start(id); toast.success('🚀 Trip started! Drive safe!'); loadTrips(); }
    catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleEnd = async (id) => {
    try { await trips.end(id); toast.success('✅ Trip completed! Great job!'); loadTrips(); }
    catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const activeTrip = myTrips.find((t) => t.status === 'in_progress');
  const nextTrip = myTrips.find((t) => t.status === 'scheduled');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn { 0%{opacity:0;transform:scale(0.9)} 70%{transform:scale(1.02)} 100%{opacity:1;transform:scale(1)} }
        @keyframes pulse-glow {
          0%,100% { box-shadow:0 0 0 0 rgba(16,185,129,0.4); }
          50%      { box-shadow:0 0 0 12px rgba(16,185,129,0); }
        }
        .anim-up { animation:slideUp 0.5s ease both; }
        .anim-pop { animation:popIn 0.5s ease both; }
        .trip-card {
          border-radius:16px; padding:1.5rem; color:#fff;
          transition:transform 0.2s, box-shadow 0.2s;
        }
        .trip-card:hover { transform:translateY(-3px); }
        .action-btn {
          width:100%; padding:0.85rem; border-radius:12px; border:none;
          font-size:1rem; font-weight:700; cursor:pointer;
          transition:all 0.2s; display:flex; align-items:center;
          justify-content:center; gap:0.5rem;
        }
        .action-btn:hover { transform:translateY(-2px); }
        .action-btn:active { transform:scale(0.97); }
      `}</style>

      {/* Greeting */}
      <div className="anim-up" style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'1.5rem', fontWeight:800, color:'#0f172a' }}>
          {greeting}, {user?.name?.split(' ')[0]}! 🚐
        </div>
        <div style={{ color:'var(--text-2)', marginTop:'0.25rem' }}>
          Drive safe, drive proud — every passenger trusts you today.
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>

        {/* Van card */}
        <div className="trip-card anim-pop" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', animationDelay:'0.05s' }}>
          <div style={{ fontSize:'0.72rem', fontWeight:600, textTransform:'uppercase', opacity:0.7, letterSpacing:'0.08em', marginBottom:'0.75rem' }}>
            🚐 Your Assigned Van
          </div>
          {driverInfo ? (
            <>
              <div style={{ fontSize:'2rem', fontWeight:900 }}>{driverInfo.plate_no}</div>
              <div style={{ opacity:0.8, marginTop:'0.25rem' }}>{driverInfo.model}</div>
            </>
          ) : (
            <div style={{ opacity:0.7 }}>No van assigned yet</div>
          )}
        </div>

        {/* Active trip card */}
        {activeTrip ? (
          <div className="trip-card anim-pop" style={{ background:'linear-gradient(135deg,#ef4444,#f97316)', animationDelay:'0.1s' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:600, textTransform:'uppercase', opacity:0.7, letterSpacing:'0.08em', marginBottom:'0.75rem' }}>
              🔴 Active Trip
            </div>
            <div style={{ fontWeight:700, fontSize:'1.1rem', marginBottom:'0.25rem' }}>{activeTrip.route_name}</div>
            <div style={{ opacity:0.8, fontSize:'0.875rem', marginBottom:'1rem' }}>
              {activeTrip.origin} → {activeTrip.destination}
            </div>
            <button className="action-btn" onClick={() => handleEnd(activeTrip.id)}
              style={{ background:'rgba(255,255,255,0.2)', color:'#fff', backdropFilter:'blur(8px)' }}>
              ✅ End Trip
            </button>
          </div>
        ) : nextTrip ? (
          <div className="trip-card anim-pop" style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)', animationDelay:'0.1s' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:600, textTransform:'uppercase', opacity:0.7, letterSpacing:'0.08em', marginBottom:'0.75rem' }}>
              📅 Next Trip
            </div>
            <div style={{ fontWeight:700, fontSize:'1.1rem', marginBottom:'0.25rem' }}>{nextTrip.route_name}</div>
            <div style={{ opacity:0.8, fontSize:'0.875rem', marginBottom:'0.5rem' }}>
              {new Date(nextTrip.departure_time).toLocaleString()}
            </div>
            <div style={{ opacity:0.7, fontSize:'0.8rem', marginBottom:'1rem' }}>
              {nextTrip.origin} → {nextTrip.destination}
            </div>
            <button className="action-btn" onClick={() => handleStart(nextTrip.id)}
              style={{ background:'rgba(255,255,255,0.2)', color:'#fff', backdropFilter:'blur(8px)', animation:'pulse-glow 2s infinite' }}>
              ▶ Start Trip
            </button>
          </div>
        ) : (
          <div className="trip-card anim-pop" style={{ background:'linear-gradient(135deg,#10b981,#059669)', animationDelay:'0.1s' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:600, textTransform:'uppercase', opacity:0.7, letterSpacing:'0.08em', marginBottom:'0.75rem' }}>
              ✅ Status
            </div>
            <div style={{ fontSize:'1.5rem', fontWeight:800 }}>All Clear!</div>
            <div style={{ opacity:0.8, marginTop:'0.5rem', fontSize:'0.875rem' }}>No upcoming trips right now. Rest up! 😊</div>
          </div>
        )}

        {/* Quick stats */}
        <div className="trip-card anim-pop" style={{ background:'linear-gradient(135deg,#f59e0b,#f97316)', animationDelay:'0.15s' }}>
          <div style={{ fontSize:'0.72rem', fontWeight:600, textTransform:'uppercase', opacity:0.7, letterSpacing:'0.08em', marginBottom:'0.75rem' }}>
            📊 My Stats Today
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            {[
              { label:'Schedules', value: schedule.length },
              { label:'Total Trips', value: myTrips.length },
              { label:'Completed', value: myTrips.filter(t=>t.status==='completed').length },
              { label:'In Progress', value: myTrips.filter(t=>t.status==='in_progress').length },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.15)', borderRadius:10, padding:'0.6rem 0.75rem' }}>
                <div style={{ fontSize:'1.4rem', fontWeight:900 }}>{s.value}</div>
                <div style={{ fontSize:'0.72rem', opacity:0.85 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule table */}
      <div className="table-wrap anim-up" style={{ animationDelay:'0.2s', marginBottom:'1.5rem' }}>
        <div className="card-header"><div className="card-title">📅 My Active Schedules</div></div>
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>Route</th><th>Van</th><th>Departure</th><th>Est. Time</th></tr></thead>
            <tbody>
              {schedule.filter((s) => !s.trip_status || ['scheduled', 'in_progress'].includes(s.trip_status)).length === 0 ? (
                <tr><td colSpan={4}><div className="empty-state"><div className="empty-state-icon">📅</div><div className="empty-state-text">No active schedules assigned</div></div></td></tr>
              ) : schedule.filter((s) => !s.trip_status || ['scheduled', 'in_progress'].includes(s.trip_status)).map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.route_name}</strong><br /><small style={{ color:'var(--text-3)' }}>{s.origin} → {s.destination}</small></td>
                  <td>{s.plate_no}<br /><small style={{ color:'var(--text-3)' }}>{s.model}</small></td>
                  <td>{new Date(s.departure_time).toLocaleString()}</td>
                  <td>{s.estimated_minutes} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent trips */}
      <div className="table-wrap anim-up" style={{ animationDelay:'0.25s' }}>
        <div className="card-header"><div className="card-title">🛣️ Recent Trips</div></div>
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>Route</th><th>Departure</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {myTrips.length === 0 ? (
                <tr><td colSpan={4}><div className="empty-state"><div className="empty-state-icon">🛣️</div><div className="empty-state-text">No trips yet</div></div></td></tr>
              ) : myTrips.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.route_name}</strong></td>
                  <td>{new Date(t.departure_time).toLocaleString()}</td>
                  <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                  <td>
                    {t.status === 'scheduled' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleStart(t.id)}>▶ Start</button>
                    )}
                    {t.status === 'in_progress' && (
                      <button className="btn btn-success btn-sm" onClick={() => handleEnd(t.id)}>✓ End Trip</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default DriverDashboard;
