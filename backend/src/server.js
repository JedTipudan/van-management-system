require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const initSocket = require('./services/socketService');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

// Attach io to every request
app.use((req, _res, next) => { req.io = io; next(); });

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vans', require('./routes/vans'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/drive-requests', require('./routes/driveRequests'));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // Fix stale confirmed bookings that belong to completed trips
  try {
    const { query } = require('./config/db');
    const r = await query(
      `UPDATE bookings SET status = 'completed'
       WHERE status = 'confirmed'
       AND trip_id IN (SELECT id FROM trips WHERE status = 'completed')`
    );
    if (r.rowCount > 0) console.log(`Fixed ${r.rowCount} stale confirmed booking(s).`);
    // Fix routes that got is_active = NULL from a bad update
    const r2 = await query(`UPDATE routes SET is_active = true WHERE is_active IS NULL`);
    if (r2.rowCount > 0) console.log(`Fixed ${r2.rowCount} route(s) with NULL is_active.`);
    // Ensure cancel_requested columns exist
    await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_requested BOOLEAN DEFAULT false`);
    await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_reason TEXT`);
  } catch (e) { console.error('Stale booking fix failed:', e.message); }
});

module.exports = { app, server };
