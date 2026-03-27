const userService = require('../services/user.service');
const uploadService = require('../services/upload.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const list = asyncHandler(async (req, res) => {
  const data = await userService.list(req.query);
  res.json({ success: true, ...data });
});

const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.user.role === 'RESIDENT' && req.user.id !== id) throw ApiError.forbidden();
  const data = await userService.getById(id);
  res.json({ success: true, data });
});

const createResident = asyncHandler(async (req, res) => {
  const data = await userService.create(req.body, 'RESIDENT');
  res.status(201).json({ success: true, data });
});

const createOperator = asyncHandler(async (req, res) => {
  const data = await userService.create(req.body, 'OPERATOR');
  res.status(201).json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.user.role === 'RESIDENT' && req.user.id !== id) throw ApiError.forbidden();
  const data = await userService.update(id, req.body);
  res.json({ success: true, data });
});

const deactivate = asyncHandler(async (req, res) => {
  await userService.deactivate(req.params.id);
  res.json({ success: true, message: 'Usuario desativado com sucesso' });
});

const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Nenhuma imagem enviada');
  const { id } = req.params;
  if (req.user.role === 'RESIDENT' && req.user.id !== id) throw ApiError.forbidden();
  const photoUrl = await uploadService.uploadPhoto(req.file.buffer, id);
  const data = await userService.updatePhoto(id, photoUrl);
  res.json({ success: true, data });
});

module.exports = { list, getById, createResident, createOperator, update, deactivate, uploadPhoto };
