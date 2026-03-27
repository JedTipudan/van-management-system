import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = {
    admin: [
      { to: '/admin', label: 'Dashboard' },
      { to: '/admin/vans', label: 'Vans' },
      { to: '/admin/drivers', label: 'Drivers' },
      { to: '/admin/routes', label: 'Routes' },
      { to: '/admin/schedules', label: 'Schedules' },
      { to: '/admin/trips', label: 'Trips' },
      { to: '/admin/reports', label: 'Reports' },
      { to: '/admin/tracking', label: 'Tracking' },
    ],
    driver: [
      { to: '/driver', label: 'Dashboard' },
      { to: '/driver/schedule', label: 'My Schedule' },
    ],
    customer: [
      { to: '/customer', label: 'Home' },
      { to: '/customer/bookings', label: 'My Bookings' },
    ],
  };

  return (
    <nav style={{ background: '#1e40af', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <span style={{ color: '#fff', fontWeight: 700, marginRight: '1rem' }}>VanMS</span>
      {user && links[user.role]?.map((l) => (
        <Link key={l.to} to={l.to} style={{ color: '#bfdbfe', textDecoration: 'none', fontSize: '0.9rem' }}>{l.label}</Link>
      ))}
      <span style={{ marginLeft: 'auto', color: '#bfdbfe', fontSize: '0.85rem' }}>{user?.name}</span>
      <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.3rem 0.8rem', borderRadius: 4, cursor: 'pointer' }}>
        Logout
      </button>
    </nav>
  );
};

export default Navbar;
