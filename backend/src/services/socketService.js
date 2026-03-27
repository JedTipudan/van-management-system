const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;

    // Admin/customer joins tracking room to receive updates
    socket.on('join:tracking', () => socket.join('tracking'));
    socket.on('leave:tracking', () => socket.leave('tracking'));

    // Driver sends their GPS location
    socket.on('driver:location', async (data) => {
      if (user.role !== 'driver') return;
      const { van_id, lat, lng, speed, heading } = data;
      if (!van_id || !lat || !lng) return;

      try {
        const { pool } = require('../config/db');
        await pool.query(
          'INSERT INTO gps_logs (van_id, lat, lng, speed, heading) VALUES ($1, $2, $3, $4, $5)',
          [van_id, lat, lng, speed || null, heading || null]
        );
      } catch (e) { console.error('GPS log error', e.message); }

      // Broadcast to everyone in tracking room
      io.to('tracking').emit('location:update', {
        van_id, lat, lng, speed, heading,
        driver_id: user.id,
        timestamp: new Date(),
      });
    });

    socket.on('join:trip', (tripId) => socket.join(`trip_${tripId}`));
    socket.on('leave:trip', (tripId) => socket.leave(`trip_${tripId}`));
    socket.on('disconnect', () => {});
  });

  return io;
};

module.exports = initSocket;
