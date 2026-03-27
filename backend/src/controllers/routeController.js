const { query } = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT r.*, 
        json_agg(rs ORDER BY rs.stop_order) FILTER (WHERE rs.id IS NOT NULL) as stops
       FROM routes r
       LEFT JOIN route_stops rs ON rs.route_id = r.id
       WHERE r.is_active = true
       GROUP BY r.id ORDER BY r.name`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM routes WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Route not found' });

    const stops = await query(
      'SELECT * FROM route_stops WHERE route_id = $1 ORDER BY stop_order',
      [req.params.id]
    );
    res.json({ ...rows[0], stops: stops.rows });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  const client = await require('../config/db').getClient();
  try {
    await client.query('BEGIN');
    const { name, origin, destination, distance_km, estimated_minutes, fare, stops = [] } = req.body;

    const routeRes = await client.query(
      `INSERT INTO routes (name, origin, destination, distance_km, estimated_minutes, fare)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, origin, destination, distance_km, estimated_minutes, fare]
    );

    if (stops.length > 0) {
      const stopValues = stops.map((s, i) =>
        `('${routeRes.rows[0].id}', '${s.stop_name}', ${i + 1}, ${s.lat || null}, ${s.lng || null})`
      ).join(',');
      await client.query(
        `INSERT INTO route_stops (route_id, stop_name, stop_order, lat, lng) VALUES ${stopValues}`
      );
    }

    await client.query('COMMIT');
    res.status(201).json(routeRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, origin, destination, distance_km, estimated_minutes, fare, is_active = true } = req.body;
    const { rows } = await query(
      `UPDATE routes SET name=$1, origin=$2, destination=$3, distance_km=$4,
       estimated_minutes=$5, fare=$6, is_active=$7 WHERE id=$8 RETURNING *`,
      [name, origin, destination, distance_km, estimated_minutes, fare, is_active, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Route not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await query('UPDATE routes SET is_active = false WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
