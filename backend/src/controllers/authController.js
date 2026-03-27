const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role = 'customer' } = req.body;
    if (['admin'].includes(role) && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot self-assign admin role' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (name, email, password, phone, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
      [name, email, hashed, phone, role]
    );

    res.status(201).json({ token: signToken(rows[0]), user: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { rows } = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password: _, ...safeUser } = user;
    res.json({ token: signToken(user), user: safeUser });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const { rows } = await query(
      `UPDATE users SET name=$1, phone=$2 WHERE id=$3
       RETURNING id, name, email, role, phone, created_at`,
      [name, phone, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { rows } = await query('SELECT password FROM users WHERE id = $1', [req.user.id]);

    if (!(await bcrypt.compare(currentPassword, rows[0].password))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};
