const holidayService = require('../services/holiday.service');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const data = await holidayService.list(req.query);
  res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const data = await holidayService.create(req.body, req.user.id);
  res.status(201).json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
  const data = await holidayService.update(req.params.id, req.body);
  res.json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
  await holidayService.remove(req.params.id);
  res.json({ success: true, message: 'Feriado removido com sucesso' });
});

module.exports = { list, create, update, remove };
