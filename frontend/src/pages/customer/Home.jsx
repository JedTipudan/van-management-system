import { useEffect, useState } from 'react';
import { schedules, bookings } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import SeatMap from '../../components/SeatMap';
import DropoffMapPicker from '../../components/DropoffMapPicker';
import toast from 'react-hot-toast';

const TripCard = ({ trip, onBook, index }) => (
  <div style={{
    background:'#fff', borderRadius:16, overflow:'hidden',
    boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #e2e8f0',
    transition:'transform 0.2s, box-shadow 0.2s',
    animation:`slideUp 0.4s ease ${index * 0.06}s both`,
  }}
    onMouseEnter={(e) => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(99,102,241,0.15)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.07)'; }}
  >
    <div style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', padding:'1rem 1.25rem', color:'#fff' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontWeight:800, fontSize:'1rem' }}>{trip.route_name}</div>
          <div style={{ opacity:0.8, fontSize:'0.8rem', marginTop:2 }}>{trip.origin} → {trip.destination}</div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:999, padding:'0.25rem 0.75rem', fontSize:'0.85rem', fontWeight:700 }}>
          ₱{trip.fare}/pax
        </div>
      </div>
    </div>
    <div style={{ padding:'1rem 1.25rem' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.65rem', marginBottom:'1rem' }}>
        {[
          { icon:'🕐', label:'Departure', value: new Date(trip.departure_time).toLocaleString() },
          { icon:'🚐', label:'Van', value: trip.plate_no },
          { icon:'👤', label:'Driver', value: trip.driver_name || 'Assigned' },
          { icon:'⏱️', label:'Est. Time', value: trip.estimated_minutes ? `${trip.estimated_minutes} min` : '—' },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{ background:'#f8fafc', borderRadius:8, padding:'0.5rem 0.65rem' }}>
            <div style={{ fontSize:'0.68rem', color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', marginBottom:2 }}>{icon} {label}</div>
            <div style={{ fontWeight:600, fontSize:'0.82rem', color:'#0f172a' }}>{value}</div>
          </div>
        ))}
      </div>
      {trip.trip_id ? (
        <button onClick={() => onBook(trip)} style={{
          width:'100%', padding:'0.7rem', borderRadius:10, border:'none',
          background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff',
          fontWeight:700, fontSize:'0.9rem', cursor:'pointer',
          transition:'all 0.2s', boxShadow:'0 4px 12px rgba(99,102,241,0.3)',
        }}>
          🎫 Book This Trip
        </button>
      ) : (
        <div style={{ textAlign:'center', color:'var(--text-3)', fontSize:'0.82rem', padding:'0.5rem' }}>
          Not available for booking
        </div>
      )}
    </div>
  </div>
);

const CustomerHome = () => {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [date, setDate] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('cards');

  const load = () => schedules.getAll(date ? { date } : {}).then((r) => setList(r.data));
  useEffect(() => { load(); }, [date]);

  const openBooking = (trip) => setBooking({
    trip_id: trip.trip_id,
    fare: parseFloat(trip.fare),
    route_name: trip.route_name,
    departure_time: trip.departure_time,
    seat_nos: [],        // array of selected seats
    payment_method: 'cash',
    pax: 1,
    pickup_address: '',
    pickup_lat: null, pickup_lng: null,
    dropoff_address: '',
    dropoff_lat: null, dropoff_lng: null,
  });

  const getMyLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    toast('📍 Getting your location...', { duration: 1500 });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setBooking((b) => ({ ...b, pickup_lat: lat, pickup_lng: lng, pickup_address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
        toast.success('📍 Pickup location set!');
      },
      () => toast.error('Could not get location. Please allow GPS access.'),
      { enableHighAccuracy: true }
    );
  };

  const handleBook = async (e) => {
    e.preventDefault();
    // Validate: if seats were selected, must match pax count
    if (booking.seat_nos.length > 0 && booking.seat_nos.length !== booking.pax) {
      toast.error(`Please select exactly ${booking.pax} seat${booking.pax > 1 ? 's' : ''} — you've selected ${booking.seat_nos.length}`);
      return;
    }
    setLoading(true);
    try {
      // Create one booking per seat if multiple seats selected, else one booking
      const seatsToBook = booking.seat_nos.length > 0 ? booking.seat_nos : [null];
      // For multi-pax with seats: book first seat with full pax, rest as individual
      await bookings.create({
        trip_id: booking.trip_id,
        seat_no: booking.seat_nos[0] || null,
        seat_nos: booking.seat_nos,
        payment_method: booking.payment_method,
        pax: booking.pax,
        pickup_lat: booking.pickup_lat,
        pickup_lng: booking.pickup_lng,
        pickup_address: booking.pickup_address,
        dropoff_lat: booking.dropoff_lat,
        dropoff_lng: booking.dropoff_lng,
        dropoff_address: booking.dropoff_address,
      });
      const total = (booking.fare * booking.pax).toFixed(2);
      toast.success(`🎉 Booking confirmed! ${booking.seat_nos.length > 0 ? `Seats: ${booking.seat_nos.join(', ')}. ` : ''}Total: ₱${total}. Have a safe trip!`);
      setBooking(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally { setLoading(false); }
  };

  const totalFare = booking ? (booking.fare * booking.pax).toFixed(2) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ marginBottom:'1.5rem', animation:'slideUp 0.4s ease both' }}>
        <div style={{ fontSize:'1.5rem', fontWeight:800, color:'#0f172a' }}>
          {greeting}, {user?.name?.split(' ')[0]}! 🙏
        </div>
        <div style={{ color:'var(--text-2)', marginTop:'0.25rem' }}>
          Where are you headed today? Book your safe ride with Parokya ni Jed.
        </div>
      </div>

      <div style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:16,
        padding:'1.25rem 1.5rem', marginBottom:'1.5rem', color:'#fff',
        display:'flex', alignItems:'center', gap:'1rem', animation:'slideUp 0.4s ease 0.05s both' }}>
        <div style={{ fontSize:'2.5rem' }}>🚐</div>
        <div>
          <div style={{ fontWeight:800, fontSize:'1rem' }}>Ride Now to Your Destination</div>
          <div style={{ opacity:0.85, fontSize:'0.85rem', marginTop:2 }}>
            Safe, peaceful, and on time — every single trip. We've got you covered. 💜
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', animation:'slideUp 0.4s ease 0.1s both' }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width:'auto' }} />
        {date && <button className="btn btn-ghost btn-sm" onClick={() => setDate('')}>✕ Clear</button>}
        <div style={{ marginLeft:'auto', display:'flex', gap:'0.4rem' }}>
          <button className={`btn btn-sm ${view==='cards'?'btn-primary':'btn-ghost'}`} onClick={() => setView('cards')}>⊞ Cards</button>
          <button className={`btn btn-sm ${view==='table'?'btn-primary':'btn-ghost'}`} onClick={() => setView('table')}>☰ Table</button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="table-wrap">
          <div className="empty-state" style={{ padding:'3rem' }}>
            <div className="empty-state-icon">🚐</div>
            <div className="empty-state-text">No available trips{date ? ' on this date' : ''}.<br />Try a different date!</div>
          </div>
        </div>
      ) : view === 'cards' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1rem' }}>
          {list.map((s, i) => <TripCard key={s.id} trip={s} onBook={openBooking} index={i} />)}
        </div>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Route</th><th>Origin → Destination</th><th>Departure</th><th>Van</th><th>Fare/pax</th><th></th></tr></thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.route_name}</strong></td>
                    <td>{s.origin} → {s.destination}</td>
                    <td>{new Date(s.departure_time).toLocaleString()}</td>
                    <td>{s.plate_no}</td>
                    <td><strong style={{ color:'var(--success)' }}>₱{s.fare}</strong></td>
                    <td>
                      {s.trip_id
                        ? <button className="btn btn-primary btn-sm" onClick={() => openBooking(s)}>Book Now</button>
                        : <span style={{ color:'var(--text-3)', fontSize:'0.8rem' }}>Unavailable</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking modal */}
      {booking && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setBooking(null)}>
          <div className="modal" style={{ maxWidth:560 }}>
            <div className="modal-header">
              <div className="modal-title">🎫 Confirm Your Booking</div>
              <button className="modal-close" onClick={() => setBooking(null)}>✕</button>
            </div>
            <form onSubmit={handleBook}>
              <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

                {/* Trip summary */}
                <div style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:12, padding:'1rem 1.25rem', color:'#fff' }}>
                  <div style={{ fontWeight:700, fontSize:'1rem' }}>{booking.route_name}</div>
                  <div style={{ opacity:0.8, fontSize:'0.82rem', marginTop:2 }}>
                    🕐 {new Date(booking.departure_time).toLocaleString()}
                  </div>
                </div>

                {/* Seat map */}
                <div>
                  <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-2)', marginBottom:'0.5rem' }}>
                    🪑 Choose Your Seat{booking.pax > 1 ? 's' : ''}
                    <span style={{ color:'var(--text-3)', fontWeight:400 }}> (optional)</span>
                  </div>
                  <SeatMap
                    tripId={booking.trip_id}
                    selectedSeats={booking.seat_nos}
                    pax={booking.pax}
                    onSelect={(seats) => setBooking((b) => ({ ...b, seat_nos: seats }))}
                  />
                </div>

                {/* Pax selector */}
                <div className="form-group">
                  <label className="form-label">👥 Number of Passengers</label>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <button type="button"
                      onClick={() => setBooking((b) => ({ ...b, pax: Math.max(1, b.pax - 1), seat_nos: [] }))}
                      style={{ width:36, height:36, borderRadius:8, border:'1.5px solid var(--border)', background:'#fff', fontSize:'1.2rem', cursor:'pointer', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                    <div style={{ flex:1, textAlign:'center', fontSize:'1.5rem', fontWeight:800, color:'var(--primary)' }}>{booking.pax}</div>
                    <button type="button"
                      onClick={() => setBooking((b) => ({ ...b, pax: Math.min(15, b.pax + 1), seat_nos: [] }))}
                      style={{ width:36, height:36, borderRadius:8, border:'1.5px solid var(--border)', background:'#fff', fontSize:'1.2rem', cursor:'pointer', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                  </div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-3)', marginTop:'0.25rem' }}>Including yourself — seat selection will reset when you change this</div>
                </div>

                {/* Location sharing */}
                <div style={{ background:'#f8fafc', borderRadius:10, padding:'1rem', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-2)', marginBottom:'0.75rem' }}>
                    📍 Share Your Location <span style={{ color:'var(--text-3)', fontWeight:400 }}>(optional — helps driver find you)</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                    <div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-3)', fontWeight:600, marginBottom:'0.3rem' }}>🟢 PICKUP LOCATION</div>
                      <div style={{ display:'flex', gap:'0.5rem' }}>
                        <input placeholder="Enter pickup address" value={booking.pickup_address}
                          onChange={(e) => setBooking((b) => ({ ...b, pickup_address: e.target.value }))}
                          style={{ flex:1 }} />
                        <button type="button" className="btn btn-ghost btn-sm" onClick={getMyLocation}>📍 GPS</button>
                      </div>
                      {booking.pickup_lat && (
                        <div style={{ fontSize:'0.7rem', color:'#059669', marginTop:3 }}>✓ {booking.pickup_lat.toFixed(5)}, {booking.pickup_lng.toFixed(5)}</div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-3)', fontWeight:600, marginBottom:'0.3rem' }}>🔴 DROP-OFF LOCATION</div>
                      <DropoffMapPicker
                        value={booking.dropoff_lat ? { lat: booking.dropoff_lat, lng: booking.dropoff_lng, address: booking.dropoff_address } : null}
                        onChange={(v) => setBooking((b) => ({ ...b, dropoff_lat: v.lat, dropoff_lng: v.lng, dropoff_address: v.address }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Fare breakdown */}
                <div style={{ background:'#f8fafc', borderRadius:10, padding:'1rem', border:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.875rem', marginBottom:'0.5rem' }}>
                    <span style={{ color:'var(--text-2)' }}>Fare per passenger</span>
                    <span style={{ fontWeight:600 }}>₱{booking.fare.toFixed(2)}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.875rem', marginBottom:'0.75rem' }}>
                    <span style={{ color:'var(--text-2)' }}>Passengers</span>
                    <span style={{ fontWeight:600 }}>× {booking.pax}</span>
                  </div>
                  <div style={{ height:1, background:'var(--border)', marginBottom:'0.75rem' }} />
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontWeight:700 }}>Total Amount</span>
                    <span style={{ fontWeight:900, fontSize:'1.4rem', color:'var(--primary)' }}>₱{totalFare}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">💳 Payment Method</label>
                  <select value={booking.payment_method} onChange={(e) => setBooking((b) => ({ ...b, payment_method: e.target.value }))}>
                    <option value="cash">💵 Cash</option>
                    <option value="gcash">📱 GCash</option>
                    <option value="card">💳 Card</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setBooking(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '⏳ Booking...' : `🎫 Book for ₱${totalFare}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerHome;
