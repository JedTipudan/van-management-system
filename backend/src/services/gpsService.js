const { query } = require('../config/db');

const saveLocation = async (van_id, lat, lng, speed = null, heading = null) => {
  await query(
    'INSERT INTO gps_logs (van_id, lat, lng, speed, heading) VALUES ($1, $2, $3, $4, $5)',
    [van_id, lat, lng, speed, heading]
  );
};

const getLatestLocations = async () => {
  const { rows } = await query(
    `SELECT DISTINCT ON (van_id) van_id, lat, lng, speed, heading, timestamp
     FROM gps_logs ORDER BY van_id, timestamp DESC`
  );
  return rows;
};

module.exports = { saveLocation, getLatestLocations };
