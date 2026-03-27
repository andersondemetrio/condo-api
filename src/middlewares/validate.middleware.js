const ApiError = require('../utils/ApiError');

/**
 * validate(schema) — validates req.body against a Joi schema
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return next(ApiError.badRequest('Dados inválidos', errors));
  }

  req.body = value;
  next();
};

/**
 * validateQuery(schema) — validates req.query
 */
const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return next(ApiError.badRequest('Query params inválidos', errors));
  }

  req.query = value;
  next();
};

module.exports = { validate, validateQuery };
