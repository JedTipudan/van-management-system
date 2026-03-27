import { useEffect, useState } from 'react';
import { bookings } from '../../api/services';
import toast from 'react-hot-toast';
import DropoffMapPicker from '../../components/DropoffMapPicker';

const STATUS_STYLE = {
  confirmed: { bg: '#dbeafe', color: '#1d4ed8' },
  completed: { bg: '#dcfce7', color: '#15803d' },
  cancelled:  { bg: '#fee2e2', color: '#b91c1c' },
  pending:    { bg: '#fef9c3', color: '#a16207' },
};
const PAY_STYLE = {
  paid:     { bg: '#dcfce7', color: '#15803d' },
  pending:  { bg: '#fef9c3', color: '#a16207' },
  refunded: { bg: '#e0e7ff', color: '#4338ca' },
};

const Badge = ({ text, style }) => (
  <span style={{ ...style, borderRadius: 999, padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: 700 }}>{text}</span>
);

const InfoBox = ({ label, value }) => (
  <div style={{ background: '#f8fafc', borderRadius: 8, padding: '0.5rem 0.65rem' }}>
    <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
    <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{value}</div>
  </div>
);

const BookingCard = ({ b, onSelect, onCancel }) => (
  <div onClick={() => onSelect(b)} style={{
    background: '#fff', borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: `1px solid ${b.cancel_requested ? '#fde047' : '#e2e8f0'}`,
    transition: 'transform 0.2s, box-shadow 0.2s',
  }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.15)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}
  >
    <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', padding: '1rem 1.25rem', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>{b.route_name}</div>
          <div style={{ opacity: 0.8, fontSize: '0.78rem', marginTop: 2 }}>{b.origin} → {b.destination}</div>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '0.2rem 0.5rem' }}>
          {b.booking_ref}
        </div>
      </div>
    </div>
    <div style={{ padding: '1rem 1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.85rem' }}>
        <InfoBox label="🕐 Departure" value={new Date(b.departure_time).toLocaleString()} />
        <InfoBox label="👤 Driver" value={b.driver_name} />
        <InfoBox label="🚐 Van" value={b.plate_no} />
        <InfoBox label="🪑 Seat(s)" value={b.seat_no ? `#${b.seat_no}` : `${b.pax || 1} pax`} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <Badge text={b.status} style={STATUS_STYLE[b.status] || STATUS_STYLE.pending} />
          <Badge
            text={`${b.driver_marked_paid ? '✓ Paid' : b.payment_status} · ₱${parseFloat(b.amount || 0).toLocaleString()}`}
            style={b.driver_marked_paid ? PAY_STYLE.paid : (PAY_STYLE[b.payment_status] || PAY_STYLE.pending)}
          />
        </div>
        {b.cancel_requested
          ? <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#a16207' }}>⏳ Cancel pending</span>
          : b.status === 'confirmed' && (
            <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); onCancel(b.id); }}>Cancel</button>
          )
        }
      </div>
    </div>
  </div>
);

const CustomerBookings = () => {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('active');
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [showDropoffMap, setShowDropoffMap] = useState(false);
  const [dropoffVal, setDropoffVal] = useState(null);

  const load = () => bookings.my().then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const active  = list.filter((b) => ['confirmed', 'pending'].includes(b.status));
  const history = list.filter((b) => ['completed', 'cancelled'].includes(b.status));

  const handleCancel = async (id) => {
    const reason = prompt('Reason for cancellation (optional):');
    if (reason === null) return;
    try {
      await bookings.cancel(id, reason);
      toast.success('Cancellation request sent to driver for approval.');
      load(); setSelected(null);
    } catch (err) { toast.error(err.response?.data?.error || 'Cannot cancel'); }
  };

  const handleShareLocation = async (bookingId) => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setUpdatingLocation(true);
    toast('📍 Getting your location...', { duration: 1500 });
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        try {
          await bookings.updateLocation(bookingId, {
            pickup_lat: lat, pickup_lng: lng, pickup_address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            dropoff_lat: selected.dropoff_lat || null,
            dropoff_lng: selected.dropoff_lng || null,
            dropoff_address: selected.dropoff_address || null,
          });
          toast.success('📍 Pickup location shared!');
          load();
          setSelected((p) => p ? { ...p, pickup_lat: lat, pickup_lng: lng, pickup_address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` } : p);
        } catch { toast.error('Failed to update location'); }
        finally { setUpdatingLocation(false); }
      },
      () => { toast.error('Could not get location. Allow GPS access.'); setUpdatingLocation(false); },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveDropoff = async (bookingId) => {
    if (!dropoffVal?.lat) { toast.error('Please set a drop-off point first.'); return; }
    try {
      await bookings.updateLocation(bookingId, {
        pickup_lat: selected.pickup_lat || null,
        pickup_lng: selected.pickup_lng || null,
        pickup_address: selected.pickup_address || null,
        dropoff_lat: dropoffVal.lat,
        dropoff_lng: dropoffVal.lng,
        dropoff_address: dropoffVal.address,
      });
      toast.success('🔴 Drop-off location saved!');
      load();
      setSelected((p) => p ? { ...p, dropoff_lat: dropoffVal.lat, dropoff_lng: dropoffVal.lng, dropoff_address: dropoffVal.address } : p);
      setShowDropoffMap(false);
    } catch { toast.error('Failed to save drop-off'); }
  };

  const stats = [
    { label: 'Total', value: list.length, icon: '🎫', color: '#6366f1', bg: '#e0e7ff' },
    { label: 'Active', value: active.length, icon: '🟢', color: '#10b981', bg: '#dcfce7' },
    { label: 'Completed', value: history.filter((b) => b.status === 'completed').length, icon: '✅', color: '#3b82f6', bg: '#dbeafe' },
    { label: 'Total Spent', value: `₱${list.filter((b) => b.status !== 'cancelled').reduce((s, b) => s + parseFloat(b.amount || 0), 0).toLocaleString()}`, icon: '💰', color: '#f59e0b', bg: '#fef9c3' },
  ];

  return (
    <>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div className="page-header">
        <div>
          <div className="page-title">My Bookings 🎫</div>
          <div className="page-subtitle">Manage your rides and view travel history</div>
        </div>
        <a href="/customer" className="btn btn-primary">+ Book New Trip</a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '1rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button className={`btn ${tab === 'active' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('active')}>
          🟢 Active {active.length > 0 && <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 999, padding: '0 6px', marginLeft: 4, fontSize: '0.75rem' }}>{active.length}</span>}
        </button>
        <button className={`btn ${tab === 'history' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('history')}>
          📋 History {history.length > 0 && <span style={{ background: tab === 'history' ? 'rgba(255,255,255,0.3)' : 'var(--border)', borderRadius: 999, padding: '0 6px', marginLeft: 4, fontSize: '0.75rem' }}>{history.length}</span>}
        </button>
      </div>

      {tab === 'active' && (
        active.length === 0
          ? <div className="table-wrap"><div className="empty-state" style={{ padding: '3rem' }}><div className="empty-state-icon">🎫</div><div className="empty-state-text">No active bookings.<br /><a href="/customer" style={{ color: 'var(--primary)' }}>Book a trip now!</a></div></div></div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
              {active.map((b) => <BookingCard key={b.id} b={b} onSelect={setSelected} onCancel={handleCancel} />)}
            </div>
      )}

      {tab === 'history' && (
        history.length === 0
          ? <div className="table-wrap"><div className="empty-state" style={{ padding: '3rem' }}><div className="empty-state-icon">📋</div><div className="empty-state-text">No travel history yet.</div></div></div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
              {history.map((b) => <BookingCard key={b.id} b={b} onSelect={setSelected} onCancel={handleCancel} />)}
            </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="modal-title">Booking Details</div>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>{selected.booking_ref}</span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <Badge text={selected.status} style={STATUS_STYLE[selected.status] || STATUS_STYLE.pending} />
                  <Badge
                    text={selected.driver_marked_paid ? '✓ Paid' : selected.payment_status}
                    style={selected.driver_marked_paid ? PAY_STYLE.paid : (PAY_STYLE[selected.payment_status] || PAY_STYLE.pending)}
                  />
                </div>
              </div>

              {selected.cancel_requested && (
                <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>⏳</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#a16207', fontSize: '0.875rem' }}>Cancellation Requested</div>
                    <div style={{ fontSize: '0.78rem', color: '#92400e' }}>
                      Waiting for driver approval.{selected.cancel_reason ? ` Reason: "${selected.cancel_reason}"` : ''}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 12, padding: '1rem 1.25rem', color: '#fff' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.7, marginBottom: '0.5rem' }}>👤 Your Driver</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                    {selected.driver_name?.[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{selected.driver_name}</div>
                    <div style={{ opacity: 0.8, fontSize: '0.82rem' }}>📞 {selected.driver_phone || 'No phone'}</div>
                    <div style={{ opacity: 0.7, fontSize: '0.75rem' }}>🪪 {selected.driver_license}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                {[
                  { label: '🗺️ Route', value: selected.route_name },
                  { label: '🚐 Van', value: `${selected.plate_no} (${selected.model})` },
                  { label: '🕐 Departure', value: new Date(selected.departure_time).toLocaleString() },
                  { label: '🪑 Seat(s)', value: selected.seat_no ? `#${selected.seat_no}` : 'Any' },
                  { label: '👥 Pax', value: `${selected.pax || 1} person${(selected.pax || 1) > 1 ? 's' : ''}` },
                  { label: '💰 Total', value: `₱${parseFloat(selected.amount || 0).toLocaleString()}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '0.6rem 0.75rem' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{value}</div>
                  </div>
                ))}
              </div>

              {selected.status === 'confirmed' && (
                <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.3rem' }}>🟢 Pickup Location</div>
                    <div style={{ fontSize: '0.82rem', color: selected.pickup_lat ? '#059669' : 'var(--text-2)', marginBottom: '0.5rem' }}>
                      {selected.pickup_lat ? `✓ ${selected.pickup_address}` : 'Not shared yet'}
                    </div>
                    <button className="btn btn-success btn-sm" disabled={updatingLocation} onClick={() => handleShareLocation(selected.id)}>
                      {updatingLocation ? '⏳ Getting...' : '📍 Share My GPS Location'}
                    </button>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.3rem' }}>🔴 Drop-off Location</div>
                    <div style={{ fontSize: '0.82rem', color: selected.dropoff_lat ? '#dc2626' : 'var(--text-2)', marginBottom: '0.5rem' }}>
                      {selected.dropoff_lat ? `✓ ${selected.dropoff_address}` : 'Not set yet'}
                    </div>
                    <button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }}
                      onClick={() => {
                        setDropoffVal(selected.dropoff_lat ? { lat: selected.dropoff_lat, lng: selected.dropoff_lng, address: selected.dropoff_address } : null);
                        setShowDropoffMap(true);
                      }}>
                      🗺️ {selected.dropoff_lat ? 'Change Drop-off' : 'Set Drop-off on Map'}
                    </button>
                  </div>
                </div>
              )}

              {selected.trip_status === 'in_progress' && (
                <a href="/customer/tracking" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--primary)', color: '#fff', borderRadius: 8, padding: '0.75rem', textDecoration: 'none', fontWeight: 600 }}>
                  📍 Track This Van Live
                </a>
              )}

              {selected.status === 'completed' && (
                <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>✅</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.875rem' }}>Trip Completed!</div>
                    <div style={{ fontSize: '0.78rem', color: '#166534' }}>Thank you for riding with us. See you next time! 🙏</div>
                  </div>
                </div>
              )}

              {selected.status === 'confirmed' && !selected.cancel_requested && (
                <button className="btn btn-danger" onClick={() => handleCancel(selected.id)}>Request Cancellation</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drop-off map picker modal */}
      {showDropoffMap && selected && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDropoffMap(false)}>
          <div className="modal" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div className="modal-title">🔴 Set Drop-off Location</div>
              <button className="modal-close" onClick={() => setShowDropoffMap(false)}>✕</button>
            </div>
            <div className="modal-body">
              <DropoffMapPicker value={dropoffVal} onChange={setDropoffVal} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowDropoffMap(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleSaveDropoff(selected.id)}>Save Drop-off</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerBookings;
