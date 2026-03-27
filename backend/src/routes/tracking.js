const router = require('express').Router();
const c = require('../controllers/trackingController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.post('/', authorize('driver'), c.updateLocation);
router.get('/van/:van_id', c.getVanLocation);
router.get('/van/:van_id/history', authorize('admin'), c.getVanHistory);

module.exports = router;
