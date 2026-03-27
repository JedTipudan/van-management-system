const router = require('express').Router();
const c = require('../controllers/driveRequestController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Driver routes
router.post('/', authorize('driver'), c.create);
router.get('/my', authorize('driver'), c.getMyRequests);
router.patch('/:id/cancel', authorize('driver'), c.cancel);

// Admin routes
router.get('/', authorize('admin'), c.getAll);
router.patch('/:id/approve', authorize('admin'), c.approve);
router.patch('/:id/reject', authorize('admin'), c.reject);

module.exports = router;
