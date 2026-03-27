import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Safely try to use GpsContext — only available inside GpsProvider (driver routes)
const tryUseGps = () => {
  try {
    const { useGps } = require('../context/GpsContext');
    return useGps();
  } catch {
    return null;
  }
};

const navItems = {
  admin: [
    { to: '/admin',           label: 'Dashboard',     icon: '📊', end: true },
    { to: '/admin/vans',      label: 'Vans',          icon: '🚐' },
    { to: '/admin/drivers',   label: 'Drivers',       icon: '👤' },
    { to: '/admin/routes',    label: 'Routes',        icon: '🗺️' },
    { to: '/admin/schedules', label: 'Schedules',     icon: '📅' },
    { to: '/admin/trips',     label: 'Trips',         icon: '🛣️' },
    { to: '/admin/tracking',  label: 'Live Tracking', icon: '📍' },
    { to: '/admin/requests',  label: 'Drive Requests',icon: '🙋' },
    { to: '/admin/reports',   label: 'Reports',       icon: '📈' },
    { to: '/settings',        label: 'Settings',      icon: '⚙️' },
  ],
  driver: [
    { to: '/driver',           label: 'Dashboard',      icon: '📊', end: true },
    { to: '/driver/schedule',   label: 'My Schedule',    icon: '📅' },
    { to: '/driver/passengers', label: 'Passengers',     icon: '👥' },
    { to: '/driver/tracking',   label: 'Share Location', icon: '📍' },
    { to: '/driver/requests',   label: 'My Requests',    icon: '🙋' },
    { to: '/settings',          label: 'Settings',       icon: '⚙️' },
  ],
  customer: [
    { to: '/customer',          label: 'Book a Trip',  icon: '🚐', end: true },
    { to: '/customer/bookings', label: 'My Bookings',  icon: '🎫' },
    { to: '/customer/tracking', label: 'Track My Van', icon: '📍' },
    { to: '/settings',          label: 'Settings',     icon: '⚙️' },
  ],
};

const pageTitles = {
  '/admin': 'Dashboard', '/admin/vans': 'Vans', '/admin/drivers': 'Drivers',
  '/admin/routes': 'Routes', '/admin/schedules': 'Schedules', '/admin/trips': 'Trips',
  '/admin/tracking': 'Live Tracking', '/admin/requests': 'Drive Requests', '/admin/reports': 'Reports',
  '/driver': 'Dashboard', '/driver/schedule': 'My Schedule',
  '/driver/passengers': 'Passengers',
  '/driver/tracking': 'Share Location', '/driver/requests': 'My Requests',
  '/customer': 'Book a Trip', '/customer/bookings': 'My Bookings', '/customer/tracking': 'Track My Van',
  '/settings': 'Settings',
};

// GPS indicator shown in sidebar when driver is sharing
const GpsIndicator = () => {
  const gps = tryUseGps();
  if (!gps?.sharing) return null;
  return (
    <div style={{
      margin: '0 0.75rem 0.5rem',
      background: 'rgba(16,185,129,0.15)',
      border: '1px solid rgba(16,185,129,0.3)',
      borderRadius: 8, padding: '0.6rem 0.75rem',
      display: 'flex', alignItems: 'center', gap: '0.5rem',
    }}>
      <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%', background: '#10b981',
          animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.4,
        }} />
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>GPS Live</div>
        <div style={{ fontSize: '0.65rem', color: '#6ee7b7' }}>Broadcasting location</div>
      </div>
    </div>
  );
};

const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };
  const items = navItems[user?.role] || [];

  return (
    <>
      <style>{`
        @keyframes ping {
          0%   { transform:scale(1); opacity:1; }
          75%  { transform:scale(2.2); opacity:0; }
          100% { transform:scale(2.2); opacity:0; }
        }
      `}</style>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <img src="/favicon.svg" alt="PNJ" style={{ width: 22, height: 22 }} />
          </div>
          <div className="sidebar-logo-text">PNJ<span> Transit</span></div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Menu</div>
          {items.map((item) => (
            <NavLink
              key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* GPS indicator — only visible for drivers when sharing */}
        <GpsIndicator />

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Parokya ni Jed';
  const gps = tryUseGps();

  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <header className="topbar">
          <button className="topbar-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <span className="topbar-title">{title}</span>
          <div className="topbar-right">
            {/* GPS live badge in topbar for drivers */}
            {gps?.sharing && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: '#dcfce7', borderRadius: 999,
                padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#059669',
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981',
                  animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
                GPS Live
              </div>
            )}
            <span className="topbar-badge">{user?.role}</span>
          </div>
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
};

export { Sidebar };
export default Layout;
