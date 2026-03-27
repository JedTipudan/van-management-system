const router = require('express').Router();
const c = require('../controllers/tripController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', c.getAll);
router.get('/driver-performance', authorize('admin'), c.getDriverPerformance);
router.get('/:id/passengers', authorize('admin', 'driver'), c.getPassengers);
router.patch('/:id/start', authorize('driver'), c.startTrip);
router.patch('/:id/end', authorize('driver'), c.endTrip);
router.patch('/:id/passengers/:booking_id/mark-paid', authorize('driver'), c.markPaid);

module.exports = router;
