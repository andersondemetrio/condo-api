const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.login(email, password);
  res.json({ success: true, data });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const data = authService.refresh(refreshToken);
  res.json({ success: true, data });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) authService.logout(token);
  res.json({ success: true, message: 'Logout realizado com sucesso' });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = { login, refresh, logout, me };
