const { query } = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { status } = req.query;
    const { rows } = await query(
      `SELECT d.*, u.name, u.email, u.phone, u.is_active
       FROM drivers d JOIN users u ON u.id = d.user_id
       ${status ? 'WHERE d.status = $1' : ''}
       ORDER BY u.name`,
      status ? [status] : []
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT d.*, u.name, u.email, u.phone
       FROM drivers d JOIN users u ON u.id = d.user_id
       WHERE d.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Driver not found' });

    const trips = await query(
      `SELECT t.*, r.name as route_name, r.origin, r.destination
       FROM trips t
       JOIN schedules s ON s.id = t.schedule_id
       JOIN routes r ON r.id = s.route_id
       WHERE s.driver_id = $1
       ORDER BY t.created_at DESC LIMIT 10`,
      [req.params.id]
    );

    res.json({ ...rows[0], recent_trips: trips.rows });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  const client = await require('../config/db').getClient();
  try {
    await client.query('BEGIN');
    const { name, email, password, phone, license_no, license_expiry } = req.body;
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);

    const userRes = await client.query(
      `INSERT INTO users (name, email, password, phone, role)
       VALUES ($1, $2, $3, $4, 'driver') RETURNING id`,
      [name, email, hashed, phone]
    );

    const driverRes = await client.query(
      `INSERT INTO drivers (user_id, license_no, license_expiry)
       VALUES ($1, $2, $3) RETURNING *`,
      [userRes.rows[0].id, license_no, license_expiry]
    );

    await client.query('COMMIT');
    res.status(201).json({ ...driverRes.rows[0], name, email, phone });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { rows } = await query(
      'UPDATE drivers SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Driver not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.getMyVan = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT s.van_id, v.plate_no, v.model
       FROM drivers d
       JOIN schedules s ON s.driver_id = d.id AND s.is_active = true
       JOIN vans v ON v.id = s.van_id
       WHERE d.user_id = $1
       LIMIT 1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'No active van assigned' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.getMySchedule = async (req, res, next) => {
  try {
    const { rows: driverRows } = await query(
      'SELECT id FROM drivers WHERE user_id = $1', [req.user.id]
    );
    if (!driverRows[0]) return res.status(404).json({ error: 'Driver profile not found' });

    const { rows } = await query(
      `SELECT s.*, v.plate_no, v.model, v.capacity, r.name as route_name,
              r.origin, r.destination, r.estimated_minutes,
              t.id as trip_id, t.status as trip_status,
              t.start_time, t.end_time
       FROM schedules s
       JOIN vans v ON v.id = s.van_id
       JOIN routes r ON r.id = s.route_id
       LEFT JOIN trips t ON t.schedule_id = s.id
       WHERE s.driver_id = $1 AND s.is_active = true
       ORDER BY s.departure_time DESC`,
      [driverRows[0].id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
