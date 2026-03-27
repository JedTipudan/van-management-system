const router = require('express').Router();
const { register, login, getProfile, changePassword, updateProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);
router.patch('/change-password', authenticate, changePassword);

module.exports = router;
