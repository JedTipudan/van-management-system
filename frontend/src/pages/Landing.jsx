import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ── Floating icon that follows mouse parallax ── */
const FloatIcon = ({ icon, x, y, size, delay, mouseX, mouseY, depth }) => {
  const tx = (mouseX * depth * 0.04).toFixed(1);
  const ty = (mouseY * depth * 0.04).toFixed(1);
  return (
    <div style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`,
      fontSize: size, userSelect: 'none', pointerEvents: 'none',
      transform: `translate(${tx}px, ${ty}px)`,
      transition: 'transform 0.15s ease-out',
      animation: `floatBob 4s ease-in-out ${delay}s infinite`,
      opacity: 0.18,
      filter: 'blur(0.5px)',
    }}>
      {icon}
    </div>
  );
};

/* ── Animated counter ── */
const Counter = ({ to, suffix = '' }) => {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = Math.ceil(to / 60);
        const t = setInterval(() => {
          start += step;
          if (start >= to) { setVal(to); clearInterval(t); }
          else setVal(start);
        }, 20);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
};

/* ── Feature card with hover tilt ── */
const FeatureCard = ({ icon, title, desc, color }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 16;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -16;
    setTilt({ x, y });
  };
  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        background: '#fff',
        borderRadius: 20,
        padding: '2rem 1.5rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        transform: `perspective(600px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: 'transform 0.15s ease, box-shadow 0.2s',
        cursor: 'default',
        border: '1px solid #f1f5f9',
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.15)'}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem',
        background: color, width: 60, height: 60, borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem', color: '#0f172a' }}>{title}</div>
      <div style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.7 }}>{desc}</div>
    </div>
  );
};

/* ── Step card ── */
const Step = ({ num, title, desc, icon }) => (
  <div style={{ textAlign: 'center', padding: '1rem' }}>
    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.5rem', margin: '0 auto 1rem', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
      {icon}
    </div>
    <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#6366f1', letterSpacing: '0.1em',
      textTransform: 'uppercase', marginBottom: '0.4rem' }}>Step {num}</div>
    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem', color: '#0f172a' }}>{title}</div>
    <div style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 }}>{desc}</div>
  </div>
);

/* ── Testimonial ── */
const Testimonial = ({ name, role, text, emoji }) => (
  <div style={{ background: '#fff', borderRadius: 20, padding: '1.75rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
    <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{emoji}</div>
    <div style={{ color: '#334155', fontSize: '0.9rem', lineHeight: 1.75, marginBottom: '1rem', fontStyle: 'italic' }}>
      "{text}"
    </div>
    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{name}</div>
    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{role}</div>
  </div>
);

const floaters = [
  { icon: '🚐', x: 8,  y: 15, size: '3.5rem', delay: 0,   depth: 3 },
  { icon: '📍', x: 85, y: 10, size: '2.5rem', delay: 0.5, depth: 5 },
  { icon: '🎫', x: 75, y: 70, size: '2rem',   delay: 1,   depth: 2 },
  { icon: '⭐', x: 15, y: 75, size: '2rem',   delay: 1.5, depth: 4 },
  { icon: '🛡️', x: 50, y: 5,  size: '2rem',   delay: 0.8, depth: 3 },
  { icon: '✝️', x: 92, y: 45, size: '2rem',   delay: 1.2, depth: 2 },
  { icon: '🚀', x: 5,  y: 50, size: '2rem',   delay: 0.3, depth: 4 },
  { icon: '💨', x: 60, y: 85, size: '2.5rem', delay: 0.7, depth: 3 },
];

const Landing = () => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [vanPos, setVanPos] = useState(-120);

  useEffect(() => {
    // Van drives in on load
    setTimeout(() => setVanPos(0), 100);

    const onMove = (e) => setMouse({
      x: e.clientX - window.innerWidth / 2,
      y: e.clientY - window.innerHeight / 2,
    });
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", overflowX: 'hidden', background: '#f8fafc' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes floatBob {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(30px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity:0; transform:translateX(-60px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes pulse-ring {
          0% { transform:scale(1); opacity:0.6; }
          100% { transform:scale(1.8); opacity:0; }
        }
        @keyframes vanDrive {
          from { transform: translateX(${vanPos}px); }
          to   { transform: translateX(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .btn-cta {
          display:inline-flex; align-items:center; gap:0.5rem;
          padding:0.9rem 2rem; border-radius:50px; font-weight:700;
          font-size:1rem; cursor:pointer; border:none; text-decoration:none;
          transition:all 0.2s; position:relative; overflow:hidden;
        }
        .btn-cta-primary {
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          color:#fff; box-shadow:0 8px 24px rgba(99,102,241,0.4);
        }
        .btn-cta-primary:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(99,102,241,0.5); }
        .btn-cta-outline {
          background:rgba(255,255,255,0.1); color:#fff;
          border:2px solid rgba(255,255,255,0.4); backdrop-filter:blur(8px);
        }
        .btn-cta-outline:hover { background:rgba(255,255,255,0.2); transform:translateY(-2px); }
        .nav-link { color:rgba(255,255,255,0.8); text-decoration:none; font-weight:500; font-size:0.9rem; transition:color 0.2s; }
        .nav-link:hover { color:#fff; }
        .section-fade { animation: fadeUp 0.7s ease both; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '1rem 2rem',
        background: scrollY > 50 ? 'rgba(15,23,42,0.95)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(12px)' : 'none',
        transition: 'all 0.3s',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img src="/favicon.svg" alt="PNJ" style={{ width: 32, height: 32 }} />
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>
            Parokya <span style={{ color: '#a5b4fc' }}>ni Jed</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <a href="#features" className="nav-link">Features</a>
          <a href="#how" className="nav-link">How it works</a>
          <a href="#testimonials" className="nav-link">Reviews</a>
          <Link to="/login" className="btn-cta btn-cta-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', padding: '6rem 2rem 4rem',
      }}>
        {/* Floating background icons */}
        {floaters.map((f, i) => (
          <FloatIcon key={i} {...f} mouseX={mouse.x} mouseY={mouse.y} />
        ))}

        {/* Glowing orbs */}
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          top:'10%', left:'10%', pointerEvents:'none' }} />
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          bottom:'10%', right:'10%', pointerEvents:'none' }} />

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: 780 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: 999, padding: '0.4rem 1rem', marginBottom: '1.5rem',
            animation: 'fadeUp 0.5s ease both',
          }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#10b981', display:'inline-block',
              boxShadow:'0 0 0 3px rgba(16,185,129,0.3)' }} />
            <span style={{ color:'#a5b4fc', fontSize:'0.8rem', fontWeight:600 }}>
              🇵🇭 Proudly Filipino · Parokya ni Jed Transit
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 900, color: '#fff', lineHeight: 1.1,
            marginBottom: '1.25rem',
            animation: 'fadeUp 0.6s ease 0.1s both',
          }}>
            Your Ride,{' '}
            <span style={{
              background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd, #f9a8d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Safe & Blessed
            </span>
            <br />Every Single Trip 🙏
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#94a3b8',
            lineHeight: 1.8, marginBottom: '2.5rem', maxWidth: 580, margin: '0 auto 2.5rem',
            animation: 'fadeUp 0.6s ease 0.2s both',
          }}>
            No more waiting in the dark. Book your van ride in seconds, track it live,
            and arrive with a smile — because every journey with us is a safe one. 😊
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
            animation: 'fadeUp 0.6s ease 0.3s both',
          }}>
            <Link to="/register" className="btn-cta btn-cta-primary">
              🚀 Join Now — It's Free
            </Link>
            <Link to="/login" className="btn-cta btn-cta-outline">
              Sign In →
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{
            display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap',
            marginTop: '3rem', animation: 'fadeUp 0.6s ease 0.4s both',
          }}>
            {['✅ Free to use', '📍 Live GPS tracking', '🔒 Secure booking', '🚐 Verified drivers'].map((t) => (
              <span key={t} style={{ color: '#94a3b8', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {t}
              </span>
            ))}
          </div>

          {/* Animated van */}
          <div style={{
            marginTop: '4rem',
            fontSize: '5rem',
            transform: `translateX(${vanPos}px)`,
            transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'inline-block',
            filter: 'drop-shadow(0 8px 24px rgba(99,102,241,0.4))',
          }}>
            🚐
          </div>
          <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            ···· road to your destination ····
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        padding: '3rem 2rem',
      }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '2rem', textAlign: 'center',
        }}>
          {[
            { value: 500, suffix: '+', label: 'Happy Passengers', icon: '😊' },
            { value: 50,  suffix: '+', label: 'Daily Trips',      icon: '🛣️' },
            { value: 15,  suffix: '',  label: 'Active Vans',      icon: '🚐' },
            { value: 99,  suffix: '%', label: 'On-Time Rate',     icon: '⏱️' },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{s.icon}</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <div style={{ color: '#c7d2fe', fontSize: '0.875rem', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '5rem 2rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ color: '#6366f1', fontWeight: 700, fontSize: '0.85rem',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
              Why choose us
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: '#0f172a', marginBottom: '1rem' }}>
              Everything you need for a<br />
              <span style={{ color: '#6366f1' }}>stress-free ride 😌</span>
            </h2>
            <p style={{ color: '#64748b', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
              We built Parokya ni Jed so you never have to worry about your commute again.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <FeatureCard icon="📍" title="Live GPS Tracking" color="#e0e7ff"
              desc="Watch your van move in real-time on the map. Know exactly when it arrives — no more guessing!" />
            <FeatureCard icon="🎫" title="Instant Booking" color="#dcfce7"
              desc="Book your seat in seconds. Choose your payment method and get a booking reference instantly." />
            <FeatureCard icon="🛡️" title="Safe & Verified Drivers" color="#fce7f3"
              desc="All our drivers are verified, licensed, and trained. Your safety is our top priority — always." />
            <FeatureCard icon="⚡" title="Real-Time Updates" color="#fef9c3"
              desc="Get live trip status updates. Know if your van is on the way, running late, or already there." />
            <FeatureCard icon="💳" title="Multiple Payments" color="#dbeafe"
              desc="Pay with cash, GCash, or card. Whatever is convenient for you — we've got it covered." />
            <FeatureCard icon="🙏" title="Community-Driven" color="#f3e8ff"
              desc="Built for the community, by the community. Parokya ni Jed — together we ride, together we thrive." />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: '5rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ color: '#6366f1', fontWeight: 700, fontSize: '0.85rem',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
              Super simple
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: '#0f172a' }}>
              Ride in 3 easy steps 🚀
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', position: 'relative' }}>
            <Step num={1} icon="📝" title="Create Account" desc="Sign up for free in under a minute. No complicated forms, just your name and email." />
            <Step num={2} icon="🎫" title="Book Your Seat" desc="Browse available trips, pick your route and departure time, then confirm your booking." />
            <Step num={3} icon="🚐" title="Ride & Relax" desc="Track your van live, hop on when it arrives, and enjoy a safe and comfortable ride!" />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ padding: '5rem 2rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ color: '#6366f1', fontWeight: 700, fontSize: '0.85rem',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
              Real passengers, real smiles
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: '#0f172a' }}>
              What our riders say 💬
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <Testimonial emoji="😄" name="Maria Santos" role="Daily Commuter"
              text="Dati palagi akong late sa trabaho kasi hindi ko alam kung saan na yung van. Ngayon, live tracking na! Game changer talaga!" />
            <Testimonial emoji="🥰" name="Juan dela Cruz" role="Student, UST"
              text="Super convenient! I booked my seat while eating breakfast and the van was already tracked on my phone. 10/10 would recommend!" />
            <Testimonial emoji="😌" name="Ana Reyes" role="Working Mom"
              text="As a mom, safety is everything. Knowing the driver is verified and I can track the van gives me so much peace of mind. Salamat PNJ!" />
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{
        padding: '5rem 2rem',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #4c1d95 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          {['🚐','📍','🎫','⭐','🛡️'].map((icon, i) => (
            <div key={i} style={{
              position:'absolute',
              left:`${15 + i * 18}%`, top:`${20 + (i % 2) * 40}%`,
              fontSize:'2rem', opacity:0.08,
              animation:`floatBob ${3 + i * 0.5}s ease-in-out ${i * 0.4}s infinite`,
            }}>{icon}</div>
          ))}
        </div>

        <div style={{ position:'relative', zIndex:1, maxWidth:600, margin:'0 auto' }}>
          <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>🚐✨</div>
          <h2 style={{ fontSize:'clamp(1.75rem, 4vw, 2.75rem)', fontWeight:900, color:'#fff', marginBottom:'1rem', lineHeight:1.2 }}>
            Ready to ride safe?<br />
            <span style={{ color:'#a5b4fc' }}>Let's go together! 🙌</span>
          </h2>
          <p style={{ color:'#94a3b8', marginBottom:'2rem', lineHeight:1.7, fontSize:'1rem' }}>
            Join hundreds of happy passengers who already trust Parokya ni Jed for their daily commute.
            Safe rides, happy hearts — that's our promise. 💜
          </p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/register" className="btn-cta btn-cta-primary" style={{ fontSize:'1.05rem', padding:'1rem 2.5rem' }}>
              🚀 Join Now — It's Free!
            </Link>
            <Link to="/login" className="btn-cta btn-cta-outline">
              Already have an account →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:'#0f172a', padding:'2rem', textAlign:'center' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', marginBottom:'0.75rem' }}>
          <img src="/favicon.svg" alt="PNJ" style={{ width:28, height:28 }} />
          <span style={{ color:'#fff', fontWeight:800 }}>Parokya <span style={{ color:'#a5b4fc' }}>ni Jed</span></span>
        </div>
        <p style={{ color:'#475569', fontSize:'0.8rem' }}>
          © {new Date().getFullYear()} Parokya ni Jed Transit. Made with 💜 for the community.
        </p>
        <div style={{ marginTop:'0.75rem', display:'flex', gap:'1.5rem', justifyContent:'center' }}>
          <Link to="/login" style={{ color:'#64748b', fontSize:'0.8rem', textDecoration:'none' }}>Sign In</Link>
          <Link to="/register" style={{ color:'#64748b', fontSize:'0.8rem', textDecoration:'none' }}>Register</Link>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
