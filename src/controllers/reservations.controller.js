const reservationService = require('../services/reservation.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const list = asyncHandler(async (req, res) => {
  const data = await reservationService.list(req.query);
  res.json({ success: true, ...data });
});

const myReservations = asyncHandler(async (req, res) => {
  const data = await reservationService.list({ ...req.query, user_id: req.user.id });
  res.json({ success: true, ...data });
});

const calendar = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  if (!month || !year) throw ApiError.badRequest('month e year sao obrigatorios');
  const data = await reservationService.getCalendar(Number(month), Number(year));
  res.json({ success: true, data });
});

const getById = asyncHandler(async (req, res) => {
  const reservation = await reservationService.getById(req.params.id);
  if (req.user.role === 'RESIDENT' && reservation.user_id !== req.user.id) throw ApiError.forbidden();
  res.json({ success: true, data: reservation });
});

const create = asyncHandler(async (req, res) => {
  const data = await reservationService.create(req.body, req.user.id);
  res.status(201).json({ success: true, data });
});

const approve = asyncHandler(async (req, res) => {
  const data = await reservationService.approve(req.params.id);
  res.json({ success: true, data });
});

const reject = asyncHandler(async (req, res) => {
  const data = await reservationService.reject(req.params.id, req.body.reason);
  res.json({ success: true, data });
});

const cancel = asyncHandler(async (req, res) => {
  const data = await reservationService.cancel(req.params.id, req.user);
  res.json({ success: true, data });
});

module.exports = { list, myReservations, calendar, getById, create, approve, reject, cancel };
