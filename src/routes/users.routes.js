const router = require('express').Router();
const ctrl = require('../controllers/users.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware');
const validators = require('../validators');

router.use(authenticate);

router.get('/', requireRole('ADMIN'), ctrl.list);
router.post('/resident', requireRole('ADMIN'), validate(validators.users.createResident), ctrl.createResident);
router.post('/operator', requireRole('ADMIN'), validate(validators.users.createOperator), ctrl.createOperator);
router.get('/:id', ctrl.getById);
router.put('/:id', validate(validators.users.updateUser), ctrl.update);
router.delete('/:id', requireRole('ADMIN'), ctrl.deactivate);
router.post('/:id/photo', upload.single('photo'), ctrl.uploadPhoto);

module.exports = router;
