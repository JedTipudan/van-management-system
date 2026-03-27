import { useEffect, useState, useRef } from 'react';
import { trips, drivers, bookings } from '../../api/services';
import useSocket from '../../hooks/useSocket';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';

const makeIcon = (color, emoji) => L.divIcon({
  className: '',
  html: `<div style="background:${color};color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:17px;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.25)">${emoji}</div>`,
  iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20],
});
const PICKUP_ICON  = makeIcon('#10b981', '🟢');
const DROPOFF_ICON = makeIcon('#ef4444', '🔴');

const PassengerMap = ({ passengers }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (mapInstanceRef.current) return;
    mapInstanceRef.current = L.map(mapRef.current).setView([14.5995, 120.9842], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19,
    }).addTo(mapInstanceRef.current);
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const bounds = [];
    passengers.forEach((p) => {
      const add = (pos, icon, label, addr) => {
        const m = L.marker(pos, { icon }).addTo(map).bindPopup(
          `<div style="font-family:Inter,sans-serif;min-width:160px">
            <div style="font-weight:700;margin-bottom:4px">${label}: ${p.name}</div>
            <div style="font-size:0.8rem;color:#475569">${addr || ''}</div>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${pos[0]},${pos[1]}&travelmode=driving"
              target="_blank" style="display:inline-block;margin-top:6px;background:${icon === PICKUP_ICON ? '#10b981' : '#ef4444'};color:#fff;padding:4px 10px;border-radius:6px;font-size:0.75rem;text-decoration:none;font-weight:600">
              🗺️ Navigate Here
            </a>
          </div>`
        );
        markersRef.current.push(m);
        bounds.push(pos);
      };
      if (p.pickup_lat && p.pickup_lng)   add([parseFloat(p.pickup_lat),  parseFloat(p.pickup_lng)],  PICKUP_ICON,  '🟢 Pickup',   p.pickup_address);
      if (p.dropoff_lat && p.dropoff_lng) add([parseFloat(p.dropoff_lat), parseFloat(p.dropoff_lng)], DROPOFF_ICON, '🔴 Drop-off', p.dropoff_address);
    });
    if (bounds.length > 0) map.fitBounds(bounds, { padding: [50, 50] });
  }, [passengers]);

  return <div ref={mapRef} style={{ height: 380, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }} />;
};

const StatCard = ({ icon, label, value, color, bg }) => (
  <div style={{ background: '#fff', borderRadius: 12, padding: '0.85rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
    <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', marginBottom: '0.4rem' }}>{icon}</div>
    <div style={{ fontSize: '1.25rem', fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', fontWeight: 500 }}>{label}</div>
  </div>
);

const DriverPassengers = () => {
  const [activeTrips, setActiveTrips]           = useState([]);
  const [completedTrips, setCompletedTrips]     = useState([]);
  const [selectedTrip, setSelectedTrip]         = useState(null);
  const [selectedHistTrip, setSelectedHistTrip] = useState(null);
  const [passengers, setPassengers]             = useState([]);
  const [histPassengers, setHistPassengers]     = useState([]);
  const [loadingPaid, setLoadingPaid]           = useState(null);
  const [mainTab, setMainTab]                   = useState('active');
  const [subTab, setSubTab]                     = useState('map');

  useSocket((socket) => {
    socket.emit('join:tracking');
    socket.on('location:update', () => {
      if (selectedTrip) trips.passengers(selectedTrip.id).then((r) => setPassengers(r.data));
    });
  });

  useEffect(() => {
    // Use mySchedule which reliably returns all driver schedules with trip info
    drivers.mySchedule().then((r) => {
      const active = r.data.filter((s) =>
        s.trip_id && ['scheduled', 'in_progress'].includes(s.trip_status)
      );
      // Shape to match what the rest of the page expects from trips.getAll
      const shaped = active.map((s) => ({
        id: s.trip_id,
        schedule_id: s.id,
        status: s.trip_status,
        departure_time: s.departure_time,
        route_name: s.route_name,
        origin: s.origin,
        destination: s.destination,
        plate_no: s.plate_no,
        model: s.model,
        capacity: s.capacity,
      }));
      setActiveTrips(shaped);
      if (shaped.length > 0) loadPassengers(shaped[0]);
    });
    trips.getAll({ status: 'completed' }).then((r) => setCompletedTrips(r.data));
  }, []);

  const loadPassengers = (trip) => {
    setSelectedTrip(trip);
    trips.passengers(trip.id).then((r) => setPassengers(r.data));
  };

  const loadHistPassengers = (trip) => {
    setSelectedHistTrip(trip);
    trips.passengers(trip.id, true).then((r) => setHistPassengers(r.data));
  };

  const handleMarkPaid = async (tripId, bookingId, currentPaid) => {
    setLoadingPaid(bookingId);
    try {
      await trips.markPaid(tripId, bookingId, !currentPaid);
      toast.success(!currentPaid ? '✅ Marked as paid!' : 'Marked as unpaid');
      trips.passengers(tripId).then((r) => setPassengers(r.data));
    } catch { toast.error('Error updating payment'); }
    finally { setLoadingPaid(null); }
  };

  const handleApproveCancel = async (bookingId) => {
    try {
      await bookings.approveCancelRequest(bookingId);
      toast.success('Cancellation approved.');
      trips.passengers(selectedTrip.id).then((r) => setPassengers(r.data));
    } catch { toast.error('Error approving cancellation'); }
  };

  const handleRejectCancel = async (bookingId) => {
    try {
      await bookings.rejectCancelRequest(bookingId);
      toast.success('Cancellation rejected.');
      trips.passengers(selectedTrip.id).then((r) => setPassengers(r.data));
    } catch { toast.error('Error rejecting cancellation'); }
  };

  const navigate = (lat, lng, label) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
    toast.success(`📍 Navigating to ${label}`);
  };

  const totalPax    = passengers.reduce((s, p) => s + (parseInt(p.pax) || 1), 0);
  const paidCount   = passengers.filter((p) => p.driver_marked_paid).length;
  const revenue     = passengers.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const hasLocations = passengers.some((p) => p.pickup_lat || p.dropoff_lat);

  const PassengerRow = ({ p, showPay, tripId }) => (
    <tr style={{ background: p.driver_marked_paid ? '#f0fdf4' : undefined }}>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
            {p.name?.[0]}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{p.name}{p.cancel_requested && <span style={{ marginLeft: 6, fontSize: '0.65rem', background: '#fef9c3', color: '#a16207', borderRadius: 999, padding: '0.1rem 0.4rem', fontWeight: 700 }}>⏳ Cancel req.</span>}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{p.phone || 'No phone'}</div>
          </div>
        </div>
      </td>
      <td>{p.seat_no ? <strong style={{ color: 'var(--primary)' }}>#{p.seat_no}</strong> : <span style={{ color: 'var(--text-3)' }}>Any</span>}</td>
      <td><strong>{p.pax || 1}</strong></td>
      <td style={{ fontSize: '0.78rem' }}>{p.pickup_address  ? <span style={{ color: '#059669' }}>📍 {p.pickup_address}</span>  : <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
      <td style={{ fontSize: '0.78rem' }}>{p.dropoff_address ? <span style={{ color: '#dc2626' }}>📍 {p.dropoff_address}</span> : <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
      <td>
        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>₱{parseFloat(p.amount || 0).toLocaleString()}</div>
        <span className={`badge ${p.driver_marked_paid ? 'badge-active' : 'badge-pending'}`} style={{ fontSize: '0.65rem' }}>
          {p.driver_marked_paid ? '✓ paid' : p.payment_status}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {p.pickup_lat  && <button className="btn btn-sm" style={{ background: '#10b981', color: '#fff', fontSize: '0.7rem', padding: '0.25rem 0.5rem' }} onClick={() => navigate(p.pickup_lat,  p.pickup_lng,  `${p.name}'s pickup`)}>🟢 Pickup</button>}
          {p.dropoff_lat && <button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '0.25rem 0.5rem' }} onClick={() => navigate(p.dropoff_lat, p.dropoff_lng, `${p.name}'s drop-off`)}>🔴 Drop-off</button>}
          {!p.pickup_lat && !p.dropoff_lat && <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>No location</span>}
        </div>
      </td>
      {showPay && (
        <td>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {p.cancel_requested && (
              <>
                <button className="btn btn-sm btn-danger" onClick={() => handleApproveCancel(p.id)}>✓ Approve Cancel</button>
                <button className="btn btn-sm btn-ghost" onClick={() => handleRejectCancel(p.id)}>✕ Reject</button>
              </>
            )}
            {!p.cancel_requested && (
              <button className={`btn btn-sm ${p.driver_marked_paid ? 'btn-ghost' : 'btn-success'}`}
                disabled={loadingPaid === p.id}
                onClick={() => handleMarkPaid(tripId, p.id, p.driver_marked_paid)}>
                {loadingPaid === p.id ? '...' : p.driver_marked_paid ? '✓ Paid' : 'Mark Paid'}
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );

  const PassengerTable = ({ list, showPay = false, tripId }) => (
    <div className="table-scroll">
      <table className="table">
        <thead>
          <tr><th>Passenger</th><th>Seat</th><th>Pax</th><th>Pickup</th><th>Drop-off</th><th>Amount</th><th>Navigate</th>{showPay && <th>Mark Paid</th>}</tr>
        </thead>
        <tbody>
          {list.length === 0
            ? <tr><td colSpan={showPay ? 8 : 7}><div className="empty-state"><div className="empty-state-icon">👥</div><div className="empty-state-text">No passengers</div></div></td></tr>
            : list.map((p) => <PassengerRow key={p.id} p={p} showPay={showPay} tripId={tripId} />)
          }
        </tbody>
      </table>
    </div>
  );

  const TripSelector = ({ list, selected, onSelect }) => list.length > 1 && (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
      {list.map((t) => (
        <button key={t.id} className={`btn btn-sm ${selected?.id === t.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => onSelect(t)}>
          {t.route_name} — {new Date(t.departure_time).toLocaleDateString()}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div className="page-header">
        <div>
          <div className="page-title">Passengers 👥</div>
          <div className="page-subtitle">Manage passengers, locations, and payments</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`btn ${mainTab === 'active' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMainTab('active')}>🟢 Active</button>
          <button className={`btn ${mainTab === 'history' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setMainTab('history'); if (completedTrips.length > 0 && !selectedHistTrip) loadHistPassengers(completedTrips[0]); }}>
            📋 History
            {completedTrips.length > 0 && <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 999, padding: '0 6px', marginLeft: 4, fontSize: '0.75rem' }}>{completedTrips.length}</span>}
          </button>
        </div>
      </div>

      {/* ── ACTIVE ── */}
      {mainTab === 'active' && (
        <>
          <TripSelector list={activeTrips} selected={selectedTrip} onSelect={loadPassengers} />

          {activeTrips.length === 0 ? (
            <div className="table-wrap">
              <div className="empty-state" style={{ padding: '3rem' }}>
                <div className="empty-state-icon">👥</div>
                <div className="empty-state-text">No active or scheduled trips assigned to you.</div>
              </div>
            </div>
          ) : selectedTrip && (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <StatCard icon="👥" label="Total Pax"  value={totalPax}  color="#6366f1" bg="#e0e7ff" />
                <StatCard icon="✅" label="Paid"       value={paidCount} color="#10b981" bg="#dcfce7" />
                <StatCard icon="⏳" label="Unpaid"     value={passengers.length - paidCount} color="#f59e0b" bg="#fef9c3" />
                <StatCard icon="💰" label="Revenue"    value={`₱${revenue.toLocaleString()}`} color="#059669" bg="#dcfce7" />
                <StatCard icon="📍" label="w/ Location" value={passengers.filter((p) => p.pickup_lat).length} color="#3b82f6" bg="#dbeafe" />
              </div>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {[['map', '🗺️ Map'], ['seats', '🪑 Seats'], ['list', '👥 List']].map(([key, label]) => (
                  <button key={key} className={`btn btn-sm ${subTab === key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSubTab(key)}>{label}</button>
                ))}
              </div>

              {/* Map */}
              {subTab === 'map' && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">📍 Pickup & Drop-off Map</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>🟢 Pickup · 🔴 Drop-off · Click to navigate</div>
                  </div>
                  <div className="card-body" style={{ padding: '0.75rem' }}>
                    {hasLocations ? <PassengerMap passengers={passengers} /> : (
                      <div className="empty-state" style={{ padding: '2.5rem' }}>
                        <div className="empty-state-icon">📍</div>
                        <div className="empty-state-text">No passengers have shared their location yet.</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Seats */}
              {subTab === 'seats' && (
                <div className="card">
                  <div className="card-header"><div className="card-title">🪑 Seat Occupancy</div></div>
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.78rem', flexWrap: 'wrap' }}>
                      {[['#f8fafc','#e2e8f0','#94a3b8','Available'], ['#fee2e2','#fca5a5','#991b1b','Occupied'], ['#dcfce7','#86efac','#166534','Paid']].map(([bg, border, color, label]) => (
                        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ width: 12, height: 12, borderRadius: 3, background: bg, border: `1.5px solid ${border}`, display: 'inline-block' }} />
                          <span style={{ color }}>{label}</span>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.4rem', maxWidth: 220 }}>
                      <div style={{ background: '#1e1b4b', borderRadius: 6, padding: '0.4rem', textAlign: 'center', fontSize: '0.6rem', color: '#a5b4fc', fontWeight: 600 }}>🚐<br />Driver</div>
                      <div style={{ gridColumn: '2/5' }} />
                      {Array.from({ length: selectedTrip.capacity || 15 }, (_, i) => i + 1).map((num) => {
                        const occ  = passengers.find((p) => p.seat_no && p.seat_no.split('/').map(Number).includes(num));
                        const paid = occ?.driver_marked_paid;
                        return (
                          <div key={num} title={occ ? `${occ.name}${paid ? ' ✓ Paid' : ''}` : `Seat ${num} — Available`}
                            style={{
                              background: occ ? (paid ? '#dcfce7' : '#fee2e2') : '#f8fafc',
                              border: `1.5px solid ${occ ? (paid ? '#86efac' : '#fca5a5') : '#e2e8f0'}`,
                              borderRadius: 6, padding: '0.4rem 0.2rem', textAlign: 'center',
                              fontSize: '0.7rem', fontWeight: 700,
                              color: occ ? (paid ? '#166534' : '#991b1b') : '#94a3b8',
                            }}>
                            {num}
                            {occ && <div style={{ fontSize: '0.55rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{occ.name?.split(' ')[0]}</div>}
                            {paid && <div style={{ fontSize: '0.5rem' }}>✓</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* List */}
              {subTab === 'list' && (
                <div className="table-wrap">
                  <div className="card-header"><div className="card-title">👥 Passenger List</div></div>
                  <PassengerTable list={passengers} showPay tripId={selectedTrip.id} />
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── HISTORY ── */}
      {mainTab === 'history' && (
        completedTrips.length === 0 ? (
          <div className="table-wrap">
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">No completed trips yet.</div>
            </div>
          </div>
        ) : (
          <>
            <TripSelector list={completedTrips} selected={selectedHistTrip} onSelect={loadHistPassengers} />
            {selectedHistTrip && (
              <div className="table-wrap">
                <div className="card-header">
                  <div className="card-title">📋 {selectedHistTrip.route_name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>
                    {new Date(selectedHistTrip.departure_time).toLocaleString()} · {histPassengers.length} passenger(s)
                  </div>
                </div>
                <PassengerTable list={histPassengers} />
              </div>
            )}
          </>
        )
      )}
    </>
  );
};

export default DriverPassengers;
