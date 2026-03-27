import { useGps } from '../../context/GpsContext';
import toast from 'react-hot-toast';

const DriverTracking = () => {
  const { sharing, position, myVan, error, startSharing, stopSharing } = useGps();

  const handleStart = () => { startSharing(); toast.success('📍 Location sharing started!'); };
  const handleStop = () => { stopSharing(); toast('📍 Location sharing stopped'); };

  return (
    <>
      <style>{`
        @keyframes ping {
          0%   { transform:scale(1); opacity:1; }
          75%  { transform:scale(2); opacity:0; }
          100% { transform:scale(2); opacity:0; }
        }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .gps-pulse { animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite; }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">Share My Location 📍</div>
          <div className="page-subtitle">
            {sharing
              ? '🟢 Broadcasting live — your location stays active even when you navigate away'
              : 'Start sharing your GPS so admin and passengers can track you'}
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gap:'1rem', maxWidth:500 }}>

        {/* Van card */}
        <div className="card" style={{ animation:'slideUp 0.4s ease both' }}>
          <div className="card-header"><div className="card-title">🚐 Assigned Van</div></div>
          <div className="card-body">
            {myVan ? (
              <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>🚐</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:'1.25rem' }}>{myVan.plate_no}</div>
                  <div style={{ color:'var(--text-2)' }}>{myVan.model}</div>
                </div>
              </div>
            ) : error ? (
              <div style={{ color:'var(--danger)', fontSize:'0.875rem' }}>⚠️ {error}</div>
            ) : (
              <div style={{ color:'var(--text-3)' }}>Loading van info...</div>
            )}
          </div>
        </div>

        {/* GPS status card */}
        <div className="card" style={{ animation:'slideUp 0.4s ease 0.08s both' }}>
          <div className="card-header"><div className="card-title">📡 GPS Status</div></div>
          <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

            {/* Live indicator */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem',
              background: sharing ? '#f0fdf4' : 'var(--surface2)',
              borderRadius:10, padding:'0.85rem 1rem',
              border: sharing ? '1.5px solid #86efac' : '1.5px solid var(--border)',
              transition:'all 0.3s',
            }}>
              <div style={{ position:'relative', width:16, height:16, flexShrink:0 }}>
                <div style={{ width:16, height:16, borderRadius:'50%',
                  background: sharing ? '#10b981' : '#94a3b8' }} />
                {sharing && (
                  <div className="gps-pulse" style={{ position:'absolute', inset:0, borderRadius:'50%',
                    background:'#10b981', opacity:0.4 }} />
                )}
              </div>
              <div>
                <div style={{ fontWeight:700, color: sharing ? '#059669' : 'var(--text-2)', fontSize:'0.9rem' }}>
                  {sharing ? '🟢 Broadcasting Live Location' : '⚫ Not Sharing'}
                </div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-3)', marginTop:2 }}>
                  {sharing
                    ? 'Admin & passengers can see you in real-time. Stays active while you navigate.'
                    : 'Tap Start to begin broadcasting your GPS position.'}
                </div>
              </div>
            </div>

            {/* Coordinates */}
            {position && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                {[
                  { label:'Latitude',  value: position.lat.toFixed(6) },
                  { label:'Longitude', value: position.lng.toFixed(6) },
                  { label:'Speed',     value: `${position.speed || 0} km/h` },
                  { label:'Heading',   value: position.heading ? `${position.heading.toFixed(0)}°` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background:'var(--surface2)', borderRadius:8, padding:'0.6rem 0.75rem' }}>
                    <div style={{ fontSize:'0.68rem', color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', marginBottom:2 }}>{label}</div>
                    <div style={{ fontWeight:700, fontFamily:'monospace', fontSize:'0.9rem' }}>{value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Action button */}
            {myVan && (
              <button
                onClick={sharing ? handleStop : handleStart}
                style={{
                  width:'100%', padding:'0.9rem', borderRadius:12, border:'none',
                  background: sharing
                    ? 'linear-gradient(135deg,#ef4444,#f97316)'
                    : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color:'#fff', fontWeight:700, fontSize:'1rem', cursor:'pointer',
                  boxShadow: sharing
                    ? '0 4px 16px rgba(239,68,68,0.35)'
                    : '0 4px 16px rgba(99,102,241,0.35)',
                  transition:'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform='translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform=''}
              >
                {sharing ? '⏹ Stop Sharing Location' : '▶ Start Sharing Location'}
              </button>
            )}

            {sharing && (
              <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8,
                padding:'0.65rem 0.85rem', fontSize:'0.78rem', color:'#92400e', display:'flex', gap:'0.5rem' }}>
                <span>💡</span>
                <span>You can navigate to other pages — your location will keep broadcasting until you tap Stop.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DriverTracking;
