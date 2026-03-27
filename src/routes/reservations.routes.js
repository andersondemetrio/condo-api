const router = require('express').Router();
const ctrl = require('../controllers/reservations.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const validators = require('../validators');

router.use(authenticate);

router.get('/calendar', ctrl.calendar);
router.get('/my', requireRole('RESIDENT'), ctrl.myReservations);
router.get('/', requireRole('ADMIN', 'OPERATOR'), ctrl.list);
router.post('/', validate(validators.reservations.createReservation), ctrl.create);
router.get('/:id', ctrl.getById);
router.patch('/:id/approve', requireRole('ADMIN', 'OPERATOR'), ctrl.approve);
router.patch('/:id/reject', requireRole('ADMIN', 'OPERATOR'), validate(validators.reservations.rejectReservation), ctrl.reject);
router.patch('/:id/cancel', ctrl.cancel);

module.exports = router;
