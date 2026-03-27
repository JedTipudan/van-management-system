const { query } = require('../config/db');

exports.summary = async (req, res, next) => {
  try {
    const [vans, drivers, trips, revenue] = await Promise.all([
      query(`SELECT status, COUNT(*) as count FROM vans GROUP BY status`),
      query(`SELECT status, COUNT(*) as count FROM drivers GROUP BY status`),
      query(`SELECT status, COUNT(*) as count FROM trips GROUP BY status`),
      query(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'paid'`),
    ]);

    res.json({
      vans: vans.rows,
      drivers: drivers.rows,
      trips: trips.rows,
      total_revenue: revenue.rows[0].total,
    });
  } catch (err) {
    next(err);
  }
};

exports.revenue = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { rows } = await query(
      `SELECT DATE(p.paid_at) as date, SUM(p.amount) as total, COUNT(*) as bookings
       FROM payments p
       WHERE p.status = 'paid'
       AND p.paid_at BETWEEN COALESCE($1::timestamptz, NOW() - INTERVAL '30 days') AND COALESCE($2::timestamptz, NOW())
       GROUP BY DATE(p.paid_at) ORDER BY date`,
      [from || null, to || null]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.tripReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { rows } = await query(
      `SELECT r.name as route, COUNT(t.id) as trips,
              COUNT(b.id) as bookings,
              SUM(p.amount) FILTER (WHERE p.status = 'paid') as revenue
       FROM trips t
       JOIN schedules s ON s.id = t.schedule_id
       JOIN routes r ON r.id = s.route_id
       LEFT JOIN bookings b ON b.trip_id = t.id AND b.status != 'cancelled'
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE t.created_at BETWEEN COALESCE($1::timestamptz, NOW() - INTERVAL '30 days') AND COALESCE($2::timestamptz, NOW())
       GROUP BY r.id, r.name ORDER BY trips DESC`,
      [from || null, to || null]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
