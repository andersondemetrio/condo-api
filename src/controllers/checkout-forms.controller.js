const checkoutService = require('../services/checkout.service');
const asyncHandler = require('../utils/asyncHandler');

const listPending = asyncHandler(async (req, res) => {
  const data = await checkoutService.listPending();
  res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const data = await checkoutService.create(req.body, req.user.id);
  res.status(201).json({ success: true, data });
});

const approve = asyncHandler(async (req, res) => {
  const data = await checkoutService.approve(req.params.id, req.user.id);
  res.json({ success: true, data });
});

const reject = asyncHandler(async (req, res) => {
  const data = await checkoutService.reject(req.params.id, req.user.id, req.body.observations);
  res.json({ success: true, data });
});

module.exports = { listPending, create, approve, reject };
