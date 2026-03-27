const router = require('express').Router();
const c = require('../controllers/driverController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', c.getAll);
router.get('/my-schedule', authorize('driver'), c.getMySchedule);
router.get('/my-van', authorize('driver'), c.getMyVan);
router.get('/:id', c.getOne);
router.post('/', authorize('admin'), c.create);
router.patch('/:id/status', authorize('admin'), c.updateStatus);

module.exports = router;
