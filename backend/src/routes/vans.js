const router = require('express').Router();
const c = require('../controllers/vanController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', c.getAll);
router.get('/:id', c.getOne);
router.post('/', authorize('admin'), c.create);
router.put('/:id', authorize('admin'), c.update);
router.delete('/:id', authorize('admin'), c.remove);
router.post('/:id/maintenance', authorize('admin'), c.addMaintenanceLog);

module.exports = router;
