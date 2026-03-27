const router = require('express').Router();
const ctrl = require('../controllers/holidays.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const validators = require('../validators');

router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', requireRole('ADMIN', 'OPERATOR'), validate(validators.holidays.createHoliday), ctrl.create);
router.put('/:id', requireRole('ADMIN', 'OPERATOR'), validate(validators.holidays.updateHoliday), ctrl.update);
router.delete('/:id', requireRole('ADMIN', 'OPERATOR'), ctrl.remove);

module.exports = router;
