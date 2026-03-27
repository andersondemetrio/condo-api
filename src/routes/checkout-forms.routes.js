const router = require('express').Router();
const ctrl = require('../controllers/checkout-forms.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const validators = require('../validators');

router.use(authenticate);

router.get('/pending', requireRole('ADMIN', 'OPERATOR'), ctrl.listPending);
router.post('/', validate(validators.checkoutForms.createCheckoutForm), ctrl.create);
router.patch('/:id/approve', requireRole('ADMIN', 'OPERATOR'), ctrl.approve);
router.patch('/:id/reject', requireRole('ADMIN', 'OPERATOR'), validate(validators.checkoutForms.rejectCheckout), ctrl.reject);

module.exports = router;
