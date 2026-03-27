import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../api/services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await auth.register(form);
      // Use login so AuthContext user state is set properly
      const user = await login({ email: form.email, password: form.password });
      toast.success('Account created! Welcome 🎉');
      navigate(`/${user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

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
          <div className="auth-tagline">Join the Parokya ni Jed Community</div>
          <div className="auth-desc">
            Book van rides easily, track your trips in real-time, and manage your travel history all in one place.
          </div>
          <div className="auth-features">
            {['Easy seat booking', 'Real-time van tracking', 'Booking history', 'Multiple payment options'].map((f) => (
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
          <div className="auth-form-title">Create account ✨</div>
          <div className="auth-form-sub">Start using Parokya ni Jed today — it's free</div>

          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label className="auth-form-label">Full Name</label>
              <input placeholder="Juan Dela Cruz" value={form.name} onChange={set('name')} required />
            </div>
            <div className="auth-form-group">
              <label className="auth-form-label">Email Address</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="auth-form-group">
              <label className="auth-form-label">Phone Number</label>
              <input placeholder="+63 900 000 0000" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="auth-form-group">
              <label className="auth-form-label">Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-link-text">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
