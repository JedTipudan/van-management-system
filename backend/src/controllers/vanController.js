const { query } = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = status ? `WHERE v.status = $3` : '';
    const params = status ? [limit, offset, status] : [limit, offset];

    const { rows } = await query(
      `SELECT v.*, d.id as driver_id, u.name as driver_name
       FROM vans v
       LEFT JOIN schedules s ON s.van_id = v.id AND s.is_active = true
       LEFT JOIN drivers d ON d.id = s.driver_id
       LEFT JOIN users u ON u.id = d.user_id
       ${conditions}
       ORDER BY v.created_at DESC LIMIT $1 OFFSET $2`,
      params
    );

    const count = await query(
      `SELECT COUNT(*) FROM vans ${status ? 'WHERE status = $1' : ''}`,
      status ? [status] : []
    );

    res.json({ data: rows, total: parseInt(count.rows[0].count), page: +page, limit: +limit });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM vans WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Van not found' });

    const logs = await query(
      'SELECT * FROM maintenance_logs WHERE van_id = $1 ORDER BY maintenance_date DESC LIMIT 10',
      [req.params.id]
    );

    res.json({ ...rows[0], maintenance_logs: logs.rows });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { plate_no, model, capacity, status, year } = req.body;
    const { rows } = await query(
      `INSERT INTO vans (plate_no, model, capacity, status, year)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [plate_no, model, capacity, status || 'active', year]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { plate_no, model, capacity, status, year, last_maintenance } = req.body;
    const { rows } = await query(
      `UPDATE vans SET plate_no=$1, model=$2, capacity=$3, status=$4, year=$5, last_maintenance=$6
       WHERE id=$7 RETURNING *`,
      [plate_no, model, capacity, status, year, last_maintenance, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Van not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM vans WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Van not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

exports.addMaintenanceLog = async (req, res, next) => {
  try {
    const { description, cost, maintenance_date, next_due } = req.body;
    const { rows } = await query(
      `INSERT INTO maintenance_logs (van_id, description, cost, maintenance_date, next_due)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, description, cost, maintenance_date, next_due]
    );

    await query(
      'UPDATE vans SET status = $1, last_maintenance = $2 WHERE id = $3',
      ['maintenance', maintenance_date, req.params.id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};
