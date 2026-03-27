const { query } = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { date } = req.query;
    const { rows } = await query(
      `SELECT s.*, v.plate_no, v.model, v.capacity,
              u.name as driver_name, r.name as route_name,
              r.origin, r.destination, r.estimated_minutes, r.fare,
              t.id as trip_id, t.status as trip_status
       FROM schedules s
       JOIN vans v ON v.id = s.van_id
       JOIN drivers d ON d.id = s.driver_id
       JOIN users u ON u.id = d.user_id
       JOIN routes r ON r.id = s.route_id
       LEFT JOIN trips t ON t.schedule_id = s.id AND t.status = 'scheduled'
       WHERE s.is_active = true
       AND NOT EXISTS (
         SELECT 1 FROM trips t2 WHERE t2.schedule_id = s.id
         AND t2.status IN ('completed', 'cancelled', 'in_progress')
       )
       ${date ? 'AND DATE(s.departure_time) = $1' : ''}
       ORDER BY s.departure_time`,
      date ? [date] : []
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { van_id, driver_id, route_id, departure_time, recurrence, days_of_week } = req.body;

    // Conflict detection: same van or driver at overlapping time
    const conflict = await query(
      `SELECT s.id FROM schedules s
       JOIN routes r ON r.id = s.route_id
       WHERE s.is_active = true
       AND (s.van_id = $1 OR s.driver_id = $2)
       AND ABS(EXTRACT(EPOCH FROM (s.departure_time - $3::timestamptz))) < r.estimated_minutes * 60`,
      [van_id, driver_id, departure_time]
    );

    if (conflict.rows.length > 0) {
      return res.status(409).json({ error: 'Schedule conflict detected for van or driver' });
    }

    const { rows } = await query(
      `INSERT INTO schedules (van_id, driver_id, route_id, departure_time, recurrence, days_of_week)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [van_id, driver_id, route_id, departure_time, recurrence || 'once', days_of_week]
    );

    // Auto-create trip record
    await query(
      'INSERT INTO trips (schedule_id, status) VALUES ($1, $2)',
      [rows[0].id, 'scheduled']
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { van_id, driver_id, route_id, departure_time, is_active } = req.body;
    const { rows } = await query(
      `UPDATE schedules SET van_id=$1, driver_id=$2, route_id=$3,
       departure_time=$4, is_active=$5 WHERE id=$6 RETURNING *`,
      [van_id, driver_id, route_id, departure_time, is_active, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Schedule not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await query('UPDATE schedules SET is_active = false WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
