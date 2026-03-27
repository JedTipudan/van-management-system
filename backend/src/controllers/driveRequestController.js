const { query, getClient } = require('../config/db');

// Driver: submit a request
exports.create = async (req, res, next) => {
  try {
    const { route_id, requested_departure, note } = req.body;

    const { rows: driverRows } = await query(
      'SELECT id FROM drivers WHERE user_id = $1', [req.user.id]
    );
    if (!driverRows[0]) return res.status(404).json({ error: 'Driver profile not found' });

    const { rows } = await query(
      `INSERT INTO drive_requests (driver_id, route_id, requested_departure, note)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [driverRows[0].id, route_id, requested_departure, note || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

// Driver: get my requests
exports.getMyRequests = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT dr.*, r.name as route_name, r.origin, r.destination, r.fare
       FROM drive_requests dr
       JOIN routes r ON r.id = dr.route_id
       JOIN drivers d ON d.id = dr.driver_id
       WHERE d.user_id = $1
       ORDER BY dr.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

// Driver: cancel a pending request
exports.cancel = async (req, res, next) => {
  try {
    const { rows: driverRows } = await query(
      'SELECT id FROM drivers WHERE user_id = $1', [req.user.id]
    );
    const { rows } = await query(
      `UPDATE drive_requests SET status = 'rejected'
       WHERE id = $1 AND driver_id = $2 AND status = 'pending' RETURNING *`,
      [req.params.id, driverRows[0].id]
    );
    if (!rows[0]) return res.status(400).json({ error: 'Request not found or already reviewed' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

// Admin: get all requests
exports.getAll = async (req, res, next) => {
  try {
    const { status } = req.query;
    const { rows } = await query(
      `SELECT dr.*, r.name as route_name, r.origin, r.destination, r.fare,
              u.name as driver_name, u.phone as driver_phone
       FROM drive_requests dr
       JOIN routes r ON r.id = dr.route_id
       JOIN drivers d ON d.id = dr.driver_id
       JOIN users u ON u.id = d.user_id
       ${status ? 'WHERE dr.status = $1' : ''}
       ORDER BY dr.created_at DESC`,
      status ? [status] : []
    );
    res.json(rows);
  } catch (err) { next(err); }
};

// Admin: approve — creates a schedule + trip automatically
exports.approve = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { van_id, admin_note } = req.body;

    const { rows: reqRows } = await client.query(
      `UPDATE drive_requests SET status = 'approved', admin_note = $1,
       reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $3 AND status = 'pending' RETURNING *`,
      [admin_note || null, req.user.id, req.params.id]
    );
    if (!reqRows[0]) return res.status(400).json({ error: 'Request not found or already reviewed' });

    const dr = reqRows[0];

    // Create schedule
    const { rows: schedRows } = await client.query(
      `INSERT INTO schedules (van_id, driver_id, route_id, departure_time, recurrence)
       VALUES ($1, $2, $3, $4, 'once') RETURNING *`,
      [van_id, dr.driver_id, dr.route_id, dr.requested_departure]
    );

    // Create trip
    await client.query(
      'INSERT INTO trips (schedule_id, status) VALUES ($1, $2)',
      [schedRows[0].id, 'scheduled']
    );

    await client.query('COMMIT');
    res.json({ request: dr, schedule: schedRows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

// Admin: reject
exports.reject = async (req, res, next) => {
  try {
    const { admin_note } = req.body;
    const { rows } = await query(
      `UPDATE drive_requests SET status = 'rejected', admin_note = $1,
       reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $3 AND status = 'pending' RETURNING *`,
      [admin_note || null, req.user.id, req.params.id]
    );
    if (!rows[0]) return res.status(400).json({ error: 'Request not found or already reviewed' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};
