const { query } = require('../config/db');

exports.updateLocation = async (req, res, next) => {
  try {
    const { van_id, lat, lng, speed, heading } = req.body;
    await query(
      'INSERT INTO gps_logs (van_id, lat, lng, speed, heading) VALUES ($1, $2, $3, $4, $5)',
      [van_id, lat, lng, speed, heading]
    );
    req.io?.emit('location:update', { van_id, lat, lng, speed, heading, timestamp: new Date() });
    res.status(201).json({ message: 'Location updated' });
  } catch (err) {
    next(err);
  }
};

exports.getVanLocation = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM gps_logs WHERE van_id = $1 ORDER BY timestamp DESC LIMIT 1',
      [req.params.van_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'No location data found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.getVanHistory = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { rows } = await query(
      `SELECT * FROM gps_logs WHERE van_id = $1
       AND timestamp BETWEEN COALESCE($2::timestamptz, NOW() - INTERVAL '1 day') AND COALESCE($3::timestamptz, NOW())
       ORDER BY timestamp`,
      [req.params.van_id, from || null, to || null]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
