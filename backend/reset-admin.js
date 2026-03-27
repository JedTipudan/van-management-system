require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/db');

const NEW_PASSWORD = process.argv[2];
const EMAIL = process.argv[3] || 'admin@vanms.com';

if (!NEW_PASSWORD) {
  console.log('Usage: node reset-admin.js <new_password> [email]');
  process.exit(1);
}

bcrypt.hash(NEW_PASSWORD, 10).then(async (hash) => {
  const result = await pool.query(
    'UPDATE users SET password = $1 WHERE email = $2 RETURNING email, role',
    [hash, EMAIL]
  );
  if (result.rowCount === 0) {
    console.log('User not found:', EMAIL);
  } else {
    console.log('Password updated for:', result.rows[0].email, '| Role:', result.rows[0].role);
  }
  pool.end();
});
