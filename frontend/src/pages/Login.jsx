import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(`/${user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-logo">
            <div className="auth-brand-icon">
              <img src="/favicon.svg" alt="PNJ" style={{ width: 28, height: 28 }} />
            </div>
            <div className="auth-brand-name">Parokya <span>ni Jed</span></div>
          </div>
          <div className="auth-tagline">Smart Van Fleet Management Platform</div>
          <div className="auth-desc">
            Manage your entire van fleet operations from one powerful dashboard.
          </div>
          <div className="auth-features">
            {['Real-time GPS tracking', 'Smart booking system', 'Driver management', 'Revenue analytics'].map((f) => (
              <div key={f} className="auth-feature">
                <div className="auth-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-title">Welcome back 👋</div>
          <div className="auth-form-sub">Sign in to your Parokya ni Jed account</div>

          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label className="auth-form-label">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="auth-form-group">
              <label className="auth-form-label">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-link-text">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
