const condoItemService = require('../services/condo-item.service');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const data = await condoItemService.list(req.query.date || null);
  res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const data = await condoItemService.create(req.body, req.user.id);
  res.status(201).json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
  const data = await condoItemService.update(req.params.id, req.body);
  res.json({ success: true, data });
});

module.exports = { list, create, update };
