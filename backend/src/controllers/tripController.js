const { query } = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { status, driver_id } = req.query;
    const conditions = [];
    const params = [];

    if (status) { params.push(status); conditions.push(`t.status = $${params.length}`); }

    // Drivers can only see their own trips
    const effectiveDriverId = req.user.role === 'driver'
      ? (await require('../config/db').query('SELECT id FROM drivers WHERE user_id = $1', [req.user.id])).rows[0]?.id
      : driver_id;
    if (effectiveDriverId) { params.push(effectiveDriverId); conditions.push(`s.driver_id = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT t.*, s.departure_time, v.plate_no, v.model, v.capacity,
              d.id as driver_id, d.license_no, d.rating,
              u.name as driver_name, u.phone as driver_phone,
              r.name as route_name, r.origin, r.destination, r.estimated_minutes,
              COALESCE(SUM(b.pax), 0) as booking_count,
              CASE WHEN t.start_time IS NOT NULL AND t.start_time > s.departure_time
                THEN EXTRACT(EPOCH FROM (t.start_time - s.departure_time))/60
                ELSE 0 END as delay_minutes,
              CASE WHEN t.start_time IS NOT NULL AND t.end_time IS NOT NULL
                THEN EXTRACT(EPOCH FROM (t.end_time - t.start_time))/60
                ELSE NULL END as actual_duration_minutes,
              (SELECT MAX(g.speed) FROM gps_logs g
               JOIN schedules sc ON sc.van_id = g.van_id
               WHERE sc.id = t.schedule_id
               AND g.timestamp BETWEEN COALESCE(t.start_time, s.departure_time)
               AND COALESCE(t.end_time, NOW())) as max_speed,
              (SELECT AVG(g.speed) FROM gps_logs g
               JOIN schedules sc ON sc.van_id = g.van_id
               WHERE sc.id = t.schedule_id
               AND g.timestamp BETWEEN COALESCE(t.start_time, s.departure_time)
               AND COALESCE(t.end_time, NOW())) as avg_speed
       FROM trips t
       JOIN schedules s ON s.id = t.schedule_id
       JOIN vans v ON v.id = s.van_id
       JOIN drivers d ON d.id = s.driver_id
       JOIN users u ON u.id = d.user_id
       JOIN routes r ON r.id = s.route_id
       LEFT JOIN bookings b ON b.trip_id = t.id AND b.status != 'cancelled'
       ${where}
       GROUP BY t.id, s.departure_time, v.plate_no, v.model, v.capacity,
                d.id, d.license_no, d.rating, u.name, u.phone,
                r.name, r.origin, r.destination, r.estimated_minutes
       ORDER BY s.departure_time DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.startTrip = async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE trips SET status = 'in_progress', start_time = NOW()
       WHERE id = $1 AND status = 'scheduled' RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(400).json({ error: 'Trip cannot be started' });

    // Update driver status
    await query(
      `UPDATE drivers SET status = 'on_trip'
       WHERE id = (SELECT driver_id FROM schedules WHERE id = $1)`,
      [rows[0].schedule_id]
    );

    req.io?.to(`trip_${req.params.id}`).emit('trip:started', rows[0]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.endTrip = async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE trips SET status = 'completed', end_time = NOW()
       WHERE id = $1 AND status = 'in_progress' RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(400).json({ error: 'Trip cannot be ended' });

    // Update driver and bookings
    await query(
      `UPDATE drivers SET status = 'available'
       WHERE id = (SELECT driver_id FROM schedules WHERE id = $1)`,
      [rows[0].schedule_id]
    );
    await query(
      `UPDATE bookings SET status = 'completed' WHERE trip_id = $1 AND status IN ('confirmed', 'pending')`,
      [req.params.id]
    );

    req.io?.to(`trip_${req.params.id}`).emit('trip:completed', rows[0]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.getPassengers = async (req, res, next) => {
  try {
    const { history } = req.query;
    const statusFilter = history === 'true' ? `b.status = 'completed'` : `b.status = 'confirmed'`;
    const { rows } = await query(
      `SELECT
        MIN(b.id::text)::uuid as id,
        b.user_id,
        u.name, u.phone,
        STRING_AGG(b.seat_no::text, '/' ORDER BY b.seat_no) FILTER (WHERE b.seat_no IS NOT NULL) as seat_no,
        SUM(b.pax) as pax,
        BOOL_OR(b.driver_marked_paid) as driver_marked_paid,
        BOOL_OR(b.cancel_requested) as cancel_requested,
        MIN(b.cancel_reason) as cancel_reason,
        MIN(b.pickup_lat::text)::numeric as pickup_lat,
        MIN(b.pickup_lng::text)::numeric as pickup_lng,
        MIN(b.pickup_address) as pickup_address,
        MIN(b.dropoff_lat::text)::numeric as dropoff_lat,
        MIN(b.dropoff_lng::text)::numeric as dropoff_lng,
        MIN(b.dropoff_address) as dropoff_address,
        SUM(p.amount) as amount,
        MIN(p.method::text) as method,
        CASE WHEN BOOL_OR(b.driver_marked_paid) THEN 'paid' ELSE MIN(p.status::text) END as payment_status
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE b.trip_id = $1 AND ${statusFilter}
       GROUP BY b.user_id, u.name, u.phone
       ORDER BY MIN(b.seat_no) NULLS LAST`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.markPaid = async (req, res, next) => {
  try {
    const isPaid = req.body.paid !== false;
    // booking_id here is the MIN(b.id) from the grouped passenger row
    // We need to mark all bookings for the same user on this trip
    const { rows: target } = await query(
      `SELECT user_id FROM bookings WHERE id = $1`, [req.params.booking_id]
    );
    if (!target[0]) return res.status(404).json({ error: 'Booking not found' });

    await query(
      `UPDATE bookings SET driver_marked_paid = $1
       WHERE trip_id = $2 AND user_id = $3`,
      [isPaid, req.params.id, target[0].user_id]
    );
    await query(
      `UPDATE payments SET status = $1::text::payment_status,
        paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE NULL END
       WHERE booking_id IN (SELECT id FROM bookings WHERE trip_id = $2 AND user_id = $3)`,
      [isPaid ? 'paid' : 'pending', req.params.id, target[0].user_id]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.getDriverPerformance = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
        u.name as driver_name, u.phone, d.license_no, d.rating, d.status,
        COUNT(t.id) as total_trips,
        COUNT(t.id) FILTER (WHERE t.status = 'completed') as completed_trips,
        ROUND(AVG(
          CASE WHEN t.start_time IS NOT NULL AND t.start_time > s.departure_time
          THEN EXTRACT(EPOCH FROM (t.start_time - s.departure_time))/60
          ELSE 0 END
        )::numeric, 1) as avg_delay_minutes,
        ROUND(MAX((
          SELECT MAX(g.speed) FROM gps_logs g
          WHERE g.van_id = s.van_id
          AND g.timestamp BETWEEN COALESCE(t.start_time, s.departure_time)
          AND COALESCE(t.end_time, NOW())
        ))::numeric, 1) as highest_speed_ever,
        ROUND(AVG((
          SELECT AVG(g.speed) FROM gps_logs g
          WHERE g.van_id = s.van_id
          AND g.timestamp BETWEEN COALESCE(t.start_time, s.departure_time)
          AND COALESCE(t.end_time, NOW())
        ))::numeric, 1) as avg_speed_overall,
        COUNT(t.id) FILTER (WHERE (
          SELECT MAX(g.speed) FROM gps_logs g
          WHERE g.van_id = s.van_id
          AND g.timestamp BETWEEN COALESCE(t.start_time, s.departure_time)
          AND COALESCE(t.end_time, NOW())
        ) > 80) as reckless_trips
       FROM drivers d
       JOIN users u ON u.id = d.user_id
       LEFT JOIN schedules s ON s.driver_id = d.id
       LEFT JOIN trips t ON t.schedule_id = s.id
       GROUP BY d.id, u.name, u.phone, d.license_no, d.rating, d.status
       ORDER BY reckless_trips DESC, avg_delay_minutes DESC`,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
