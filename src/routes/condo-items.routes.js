const router = require('express').Router();
const ctrl = require('../controllers/condo-items.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const validators = require('../validators');

router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', requireRole('ADMIN', 'OPERATOR'), validate(validators.condoItems.createCondoItem), ctrl.create);
router.put('/:id', requireRole('ADMIN', 'OPERATOR'), validate(validators.condoItems.updateCondoItem), ctrl.update);

module.exports = router;
