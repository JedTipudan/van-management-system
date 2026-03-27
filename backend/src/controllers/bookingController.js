const { query, getClient } = require('../config/db');

const generateRef = () => `BK-${Date.now().toString(36).toUpperCase()}`;

exports.create = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { trip_id, seat_no, seat_nos, payment_method, pax = 1,
      pickup_lat, pickup_lng, pickup_address,
      dropoff_lat, dropoff_lng, dropoff_address } = req.body;
    const numPax = Math.max(1, parseInt(pax) || 1);
    const allSeats = seat_nos && seat_nos.length > 0 ? seat_nos : (seat_no ? [seat_no] : []);

    // 5-minute cooldown between bookings
    const recent = await client.query(
      `SELECT created_at FROM bookings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (recent.rows[0]) {
      const secsSince = (Date.now() - new Date(recent.rows[0].created_at).getTime()) / 1000;
      if (secsSince < 300) {
        await client.query('ROLLBACK');
        const wait = Math.ceil((300 - secsSince) / 60);
        return res.status(429).json({ error: `Please wait ${wait} more minute${wait > 1 ? 's' : ''} before booking again.` });
      }
    }

    const tripInfo = await client.query(
      `SELECT t.id, v.capacity,
        COUNT(b.id) FILTER (WHERE b.status != 'cancelled') as booked
       FROM trips t
       JOIN schedules s ON s.id = t.schedule_id
       JOIN vans v ON v.id = s.van_id
       LEFT JOIN bookings b ON b.trip_id = t.id
       WHERE t.id = $1 AND t.status = 'scheduled'
       GROUP BY t.id, v.capacity`,
      [trip_id]
    );

    if (!tripInfo.rows[0]) return res.status(400).json({ error: 'Trip not available for booking' });
    const available = tripInfo.rows[0].capacity - parseInt(tripInfo.rows[0].booked);
    if (available < numPax) return res.status(409).json({ error: `Only ${available} seat(s) available` });

    const fareRes = await client.query(
      `SELECT r.fare FROM routes r
       JOIN schedules s ON s.route_id = r.id
       JOIN trips t ON t.schedule_id = s.id WHERE t.id = $1`,
      [trip_id]
    );
    const farePerPax = parseFloat(fareRes.rows[0].fare);
    const totalAmount = farePerPax * numPax;

    // Check if any of the selected seats are already taken
    if (allSeats.length > 0) {
      for (const seatNum of allSeats) {
        const taken = await client.query(
          `SELECT id FROM bookings WHERE trip_id=$1 AND seat_no=$2 AND status!='cancelled'`,
          [trip_id, seatNum]
        );
        if (taken.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(409).json({ error: `Seat ${seatNum} is already taken. Please choose another.` });
        }
      }
    }

    // Create one booking row per seat (or one row if no seats selected)
    const seatsToInsert = allSeats.length > 0 ? allSeats : [null];
    // If pax > seats selected, first row carries all pax; each extra seat row gets pax=1
    const bookingRows = [];
    for (let i = 0; i < seatsToInsert.length; i++) {
      const rowPax = i === 0 ? numPax : 1;
      const ref = generateRef();
      const b = await client.query(
        `INSERT INTO bookings (trip_id, user_id, seat_no, booking_ref, status, pax,
           pickup_lat, pickup_lng, pickup_address, dropoff_lat, dropoff_lng, dropoff_address)
         VALUES ($1, $2, $3, $4, 'confirmed', $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [trip_id, req.user.id, seatsToInsert[i], ref, rowPax,
         pickup_lat || null, pickup_lng || null, pickup_address || null,
         dropoff_lat || null, dropoff_lng || null, dropoff_address || null]
      );
      bookingRows.push(b.rows[0]);
    }

    const payment = await client.query(
      `INSERT INTO payments (booking_id, amount, method, status)
       VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [bookingRows[0].id, totalAmount, payment_method || 'cash']
    );

    await client.query('COMMIT');
    res.status(201).json({ ...bookingRows[0], payment: payment.rows[0], fare_per_pax: farePerPax, total_amount: totalAmount });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

exports.getMyBookings = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
        MIN(b.id::text)::uuid as id,
        b.trip_id, b.user_id,
        MIN(b.booking_ref) as booking_ref,
        MIN(b.status::text) as status,
        SUM(b.pax) as pax,
        STRING_AGG(b.seat_no::text, '/' ORDER BY b.seat_no) FILTER (WHERE b.seat_no IS NOT NULL) as seat_no,
        BOOL_OR(b.cancel_requested) as cancel_requested,
        MIN(b.cancel_reason) as cancel_reason,
        BOOL_OR(b.driver_marked_paid) as driver_marked_paid,
        MIN(b.pickup_lat::text)::numeric as pickup_lat,
        MIN(b.pickup_lng::text)::numeric as pickup_lng,
        MIN(b.pickup_address) as pickup_address,
        MIN(b.dropoff_lat::text)::numeric as dropoff_lat,
        MIN(b.dropoff_lng::text)::numeric as dropoff_lng,
        MIN(b.dropoff_address) as dropoff_address,
        r.name as route_name, r.origin, r.destination,
        s.departure_time, v.plate_no, v.model,
        u_driver.name as driver_name, u_driver.phone as driver_phone,
        d.license_no as driver_license,
        SUM(p.amount) as amount,
        MIN(p.method::text) as method,
        CASE WHEN BOOL_OR(b.driver_marked_paid) THEN 'paid' ELSE MIN(p.status::text) END as payment_status,
        t.status as trip_status, t.start_time, t.end_time
       FROM bookings b
       JOIN trips t ON t.id = b.trip_id
       JOIN schedules s ON s.id = t.schedule_id
       JOIN routes r ON r.id = s.route_id
       JOIN vans v ON v.id = s.van_id
       JOIN drivers d ON d.id = s.driver_id
       JOIN users u_driver ON u_driver.id = d.user_id
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE b.user_id = $1
       GROUP BY b.trip_id, b.user_id, r.name, r.origin, r.destination,
                s.departure_time, v.plate_no, v.model,
                u_driver.name, u_driver.phone, d.license_no,
                t.id, t.status, t.start_time, t.end_time
       ORDER BY s.departure_time DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getSeatMap = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT b.seat_no, b.status, b.pax, u.name
       FROM bookings b JOIN users u ON u.id = b.user_id
       WHERE b.trip_id = $1 AND b.status != 'cancelled' AND b.seat_no IS NOT NULL`,
      [req.params.id]
    );
    const cap = await query(
      `SELECT v.capacity FROM vans v
       JOIN schedules s ON s.van_id = v.id
       JOIN trips t ON t.schedule_id = s.id WHERE t.id = $1`,
      [req.params.id]
    );
    res.json({ seats: rows, capacity: cap.rows[0]?.capacity || 0 });
  } catch (err) { next(err); }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const { pickup_lat, pickup_lng, pickup_address, dropoff_lat, dropoff_lng, dropoff_address } = req.body;
    const ref = await query(`SELECT trip_id FROM bookings WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    if (!ref.rows[0]) return res.status(404).json({ error: 'Booking not found' });
    await query(
      `UPDATE bookings SET
         pickup_lat=$1, pickup_lng=$2, pickup_address=$3,
         dropoff_lat=$4, dropoff_lng=$5, dropoff_address=$6
       WHERE trip_id=$7 AND user_id=$8`,
      [pickup_lat, pickup_lng, pickup_address, dropoff_lat, dropoff_lng, dropoff_address, ref.rows[0].trip_id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.cancel = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const ref = await query(
      `SELECT trip_id FROM bookings WHERE id = $1 AND user_id = $2 AND status = 'confirmed'`,
      [req.params.id, req.user.id]
    );
    if (!ref.rows[0]) return res.status(400).json({ error: 'Booking not found or already cancelled' });
    await query(
      `UPDATE bookings SET cancel_requested = true, cancel_reason = $1
       WHERE trip_id = $2 AND user_id = $3 AND status = 'confirmed'`,
      [reason || null, ref.rows[0].trip_id, req.user.id]
    );
    res.json({ success: true, message: 'Cancellation request sent to driver.' });
  } catch (err) { next(err); }
};

exports.approveCancelRequest = async (req, res, next) => {
  try {
    const ref = await query(
      `SELECT trip_id, user_id FROM bookings WHERE id = $1 AND cancel_requested = true`,
      [req.params.id]
    );
    if (!ref.rows[0]) return res.status(404).json({ error: 'Cancel request not found' });
    await query(
      `UPDATE bookings SET status = 'cancelled', cancel_requested = false
       WHERE trip_id = $1 AND user_id = $2`,
      [ref.rows[0].trip_id, ref.rows[0].user_id]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.rejectCancelRequest = async (req, res, next) => {
  try {
    const ref = await query(
      `SELECT trip_id, user_id FROM bookings WHERE id = $1 AND cancel_requested = true`,
      [req.params.id]
    );
    if (!ref.rows[0]) return res.status(404).json({ error: 'Cancel request not found' });
    await query(
      `UPDATE bookings SET cancel_requested = false
       WHERE trip_id = $1 AND user_id = $2`,
      [ref.rows[0].trip_id, ref.rows[0].user_id]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.markPaid = async (req, res, next) => {
  try {
    const isPaid = req.body.paid !== false;
    // Update both driver_marked_paid flag AND payment status
    const { rows } = await query(
      `UPDATE bookings SET driver_marked_paid = $1 WHERE id = $2 RETURNING *`,
      [isPaid, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Booking not found' });

    // Also update payment record
    await query(
      `UPDATE payments SET status = $1, paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE NULL END
       WHERE booking_id = $2`,
      [isPaid ? 'paid' : 'pending', req.params.id]
    );

    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.confirmPayment = async (req, res, next) => {
  try {
    const { transaction_ref } = req.body;
    const { rows } = await query(
      `UPDATE payments SET status = 'paid', transaction_ref = $1, paid_at = NOW()
       WHERE booking_id = $2 RETURNING *`,
      [transaction_ref, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Payment not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};
