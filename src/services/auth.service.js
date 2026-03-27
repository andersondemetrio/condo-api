const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

// In-memory refresh token blacklist (use Redis in production)
const blacklist = new Set();

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

const login = async (email, password) => {
  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user) throw ApiError.unauthorized('Credenciais inválidas');
  if (!user.active) throw ApiError.forbidden('Conta desativada. Contate o administrador.');

  const valid = await user.checkPassword(password);
  if (!valid) throw ApiError.unauthorized('Credenciais inválidas');

  const tokens = generateTokens(user);
  const { password_hash, ...userData } = user.toJSON();
  return { user: userData, ...tokens };
};

const refresh = (token) => {
  if (blacklist.has(token)) throw ApiError.unauthorized('Token revogado');
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const accessToken = jwt.sign(
      { id: decoded.id, email: decoded.email, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
    return { accessToken };
  } catch {
    throw ApiError.unauthorized('Refresh token inválido ou expirado');
  }
};

const logout = (token) => {
  blacklist.add(token);
};

module.exports = { login, refresh, logout, generateTokens };
