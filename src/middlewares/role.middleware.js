const ApiError = require('../utils/ApiError');

/**
 * requireRole('ADMIN', 'OPERATOR') — accepts one or more roles
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized());
  }
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`Acesso restrito. Roles permitidas: ${roles.join(', ')}`));
  }
  next();
};

module.exports = { requireRole };
