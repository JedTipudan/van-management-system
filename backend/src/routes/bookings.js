const router = require('express').Router();
const c = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.post('/', c.create);
router.get('/my', c.getMyBookings);
router.get('/seat-map/:id', c.getSeatMap);
router.patch('/:id/cancel', c.cancel);
router.patch('/:id/cancel-approve', authorize('driver'), c.approveCancelRequest);
router.patch('/:id/cancel-reject', authorize('driver'), c.rejectCancelRequest);
router.patch('/:id/location', c.updateLocation);
router.patch('/:id/mark-paid', authorize('driver'), c.markPaid);
router.patch('/:id/payment', authorize('admin'), c.confirmPayment);

module.exports = router;
