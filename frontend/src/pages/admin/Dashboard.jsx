import { useEffect, useState } from 'react';
import { reports } from '../../api/services';
import { useAuth } from '../../context/AuthContext';

const statDefs = [
  { key: 'vans',    status: 'active',      label: 'Active Vans',       icon: '🚐', color: '#6366f1', bg: 'linear-gradient(135deg,#6366f1,#818cf8)' },
  { key: 'vans',    status: 'maintenance', label: 'In Maintenance',    icon: '🔧', color: '#f59e0b', bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
  { key: 'drivers', status: 'available',   label: 'Available Drivers', icon: '👤', color: '#10b981', bg: 'linear-gradient(135deg,#10b981,#34d399)' },
  { key: 'drivers', status: 'on_trip',     label: 'On Trip',           icon: '🛣️', color: '#ec4899', bg: 'linear-gradient(135deg,#ec4899,#f472b6)' },
  { key: 'trips',   status: 'scheduled',   label: 'Scheduled Trips',   icon: '📅', color: '#3b82f6', bg: 'linear-gradient(135deg,#3b82f6,#60a5fa)' },
  { key: 'trips',   status: 'in_progress', label: 'In Progress',       icon: '🔴', color: '#ef4444', bg: 'linear-gradient(135deg,#ef4444,#f87171)' },
];

const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = parseInt(value) || 0;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 30));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setDisplay(target); clearInterval(timer); }
      else setDisplay(current);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
};

const quickLinks = [
  { label: 'Add Van',      icon: '🚐', href: '/admin/vans',      color: '#6366f1' },
  { label: 'Add Driver',   icon: '👤', href: '/admin/drivers',   color: '#10b981' },
  { label: 'New Schedule', icon: '📅', href: '/admin/schedules', color: '#3b82f6' },
  { label: 'View Reports', icon: '📈', href: '/admin/reports',   color: '#f59e0b' },
  { label: 'Live Tracking',icon: '📍', href: '/admin/tracking',  color: '#ec4899' },
  { label: 'Requests',     icon: '🙋', href: '/admin/requests',  color: '#8b5cf6' },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    reports.summary().then((r) => {
      setData(r.data);
      setTimeout(() => setVisible(true), 100);
    }).catch(() => {});
  }, []);

  const count = (arr, status) => arr?.find((r) => r.status === status)?.count || 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes popIn {
          0%   { opacity:0; transform:scale(0.85); }
          70%  { transform:scale(1.04); }
          100% { opacity:1; transform:scale(1); }
        }
        @keyframes pulse-dot {
          0%,100% { transform:scale(1); opacity:1; }
          50%     { transform:scale(1.4); opacity:0.6; }
        }
        .stat-anim { animation: popIn 0.5s ease both; }
        .link-anim { animation: slideUp 0.4s ease both; }
        .stat-card-new {
          border-radius:16px; padding:1.5rem; color:#fff; position:relative;
          overflow:hidden; cursor:default;
          transition:transform 0.2s, box-shadow 0.2s;
          box-shadow:0 4px 20px rgba(0,0,0,0.12);
        }
        .stat-card-new:hover { transform:translateY(-4px) scale(1.02); box-shadow:0 12px 32px rgba(0,0,0,0.18); }
        .stat-card-new::after {
          content:''; position:absolute; right:-20px; top:-20px;
          width:100px; height:100px; border-radius:50%;
          background:rgba(255,255,255,0.08);
        }
        .quick-link {
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:0.5rem; padding:1.25rem 1rem; border-radius:14px;
          background:#fff; border:1.5px solid #e2e8f0; cursor:pointer;
          text-decoration:none; transition:all 0.2s;
          box-shadow:0 2px 8px rgba(0,0,0,0.05);
        }
        .quick-link:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(99,102,241,0.15); border-color:#6366f1; }
      `}</style>

      {/* Greeting */}
      <div style={{ marginBottom:'1.5rem', animation:'slideUp 0.4s ease both' }}>
        <div style={{ fontSize:'1.5rem', fontWeight:800, color:'#0f172a' }}>
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </div>
        <div style={{ color:'var(--text-2)', marginTop:'0.25rem' }}>
          Here's your fleet overview for today — {new Date().toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>

      {/* Stat cards */}
      {data ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
          {statDefs.map((s, i) => (
            <div key={s.label} className="stat-card-new" style={{ background: s.bg, animationDelay:`${i*0.07}s` }}
              className="stat-card-new stat-anim" style={{ background:s.bg, animationDelay:`${i*0.07}s` }}>
              <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>{s.icon}</div>
              <div style={{ fontSize:'2.2rem', fontWeight:900, lineHeight:1 }}>
                <AnimatedNumber value={count(data[s.key], s.status)} />
              </div>
              <div style={{ fontSize:'0.78rem', opacity:0.85, marginTop:'0.3rem', fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
          <div className="stat-card-new stat-anim" style={{ background:'linear-gradient(135deg,#059669,#10b981)', animationDelay:'0.42s' }}>
            <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>💰</div>
            <div style={{ fontSize:'1.5rem', fontWeight:900, lineHeight:1 }}>
              ₱{Number(data.total_revenue).toLocaleString()}
            </div>
            <div style={{ fontSize:'0.78rem', opacity:0.85, marginTop:'0.3rem', fontWeight:500 }}>Total Revenue</div>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
          {[...Array(7)].map((_, i) => (
            <div key={i} style={{ borderRadius:16, height:130, background:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
              backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' }} />
          ))}
        </div>
      )}

      {/* Quick links */}
      <div style={{ marginBottom:'1rem', fontWeight:700, color:'#0f172a', fontSize:'0.95rem' }}>⚡ Quick Actions</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:'0.75rem' }}>
        {quickLinks.map((l, i) => (
          <a key={l.label} href={l.href} className="quick-link link-anim" style={{ animationDelay:`${0.3+i*0.06}s` }}>
            <div style={{ width:44, height:44, borderRadius:12, background:`${l.color}18`,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem' }}>
              {l.icon}
            </div>
            <span style={{ fontSize:'0.78rem', fontWeight:600, color:'#334155', textAlign:'center' }}>{l.label}</span>
          </a>
        ))}
      </div>
    </>
  );
};

export default AdminDashboard;
