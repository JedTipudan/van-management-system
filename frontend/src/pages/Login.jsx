import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 🙏`);
      navigate(`/${user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .auth-input {
          width:100%; padding:0.85rem 1rem; border-radius:12px;
          border:1.5px solid rgba(255,255,255,0.15);
          background:rgba(255,255,255,0.08);
          color:#fff; font-size:1rem; font-family:inherit;
          outline:none; transition:all 0.2s;
          -webkit-appearance:none;
        }
        .auth-input::placeholder { color:rgba(255,255,255,0.35); }
        .auth-input:focus { border-color:#818cf8; background:rgba(255,255,255,0.12); box-shadow:0 0 0 3px rgba(129,140,248,0.2); }
        .auth-btn {
          width:100%; padding:0.95rem; border-radius:12px; border:none;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          color:#fff; font-size:1rem; font-weight:700; cursor:pointer;
          transition:all 0.2s; font-family:inherit;
          box-shadow:0 4px 20px rgba(99,102,241,0.4);
        }
        .auth-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(99,102,241,0.5); }
        .auth-btn:active { transform:scale(0.98); }
        .auth-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .pw-toggle { position:absolute; right:1rem; top:50%; transform:translateY(-50%); background:none; border:none; color:rgba(255,255,255,0.5); cursor:pointer; font-size:1.1rem; padding:0.25rem; }
      `}</style>

      {/* Logo */}
      <div style={{ animation:'fadeUp 0.5s ease both', marginBottom:'2rem', textAlign:'center' }}>
        <div style={{ animation:'floatBob 3s ease-in-out infinite' }}>
          <img src="/favicon.svg" alt="PNJ" style={{ width:64, height:64, marginBottom:'0.75rem' }} />
        </div>
        <div style={{ color:'#fff', fontWeight:800, fontSize:'1.5rem', letterSpacing:'-0.5px' }}>
          Parokya <span style={{ color:'#a5b4fc' }}>ni Jed</span>
        </div>
        <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.82rem', marginTop:4 }}>
          Safe rides, every trip 🚐
        </div>
      </div>

      {/* Card */}
      <div style={{
        width:'100%', maxWidth:420,
        background:'rgba(255,255,255,0.07)',
        backdropFilter:'blur(20px)',
        borderRadius:24, padding:'2rem',
        border:'1px solid rgba(255,255,255,0.12)',
        boxShadow:'0 20px 60px rgba(0,0,0,0.4)',
        animation:'fadeUp 0.5s ease 0.1s both',
      }}>
        <div style={{ marginBottom:'1.75rem' }}>
          <div style={{ color:'#fff', fontWeight:800, fontSize:'1.4rem' }}>Welcome back 👋</div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.875rem', marginTop:4 }}>
            Sign in to your account
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div>
            <label style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.8rem', fontWeight:600, display:'block', marginBottom:'0.4rem' }}>
              Email Address
            </label>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.8rem', fontWeight:600, display:'block', marginBottom:'0.4rem' }}>
              Password
            </label>
            <div style={{ position:'relative' }}>
              <input
                className="auth-input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                style={{ paddingRight:'3rem' }}
                required
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading} style={{ marginTop:'0.5rem' }}>
            {loading ? '⏳ Signing in...' : '🚀 Sign In'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:'1.5rem', color:'rgba(255,255,255,0.5)', fontSize:'0.875rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'#a5b4fc', fontWeight:700, textDecoration:'none' }}>
            Create one free
          </Link>
        </div>
      </div>

      {/* Features */}
      <div style={{
        display:'flex', gap:'1.25rem', marginTop:'2rem', flexWrap:'wrap', justifyContent:'center',
        animation:'fadeUp 0.5s ease 0.2s both',
      }}>
        {['📍 Live Tracking', '🎫 Easy Booking', '🛡️ Safe Rides', '🚐 Verified Drivers'].map((f) => (
          <span key={f} style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:'0.25rem' }}>
            {f}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Login;
