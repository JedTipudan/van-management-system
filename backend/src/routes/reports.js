const router = require('express').Router();
const c = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));
router.get('/summary', c.summary);
router.get('/revenue', c.revenue);
router.get('/trips', c.tripReport);

module.exports = router;
