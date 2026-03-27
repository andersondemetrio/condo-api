const Joi = require('joi');

// ── Auth ──────────────────────────────────────────────────────────
const login = Joi.object({
  email: Joi.string().email().required().messages({ 'string.email': 'E-mail inválido' }),
  password: Joi.string().min(6).required(),
});

const refresh = Joi.object({
  refreshToken: Joi.string().required(),
});

// ── Users ─────────────────────────────────────────────────────────
const createResident = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().allow('', null),
  sex: Joi.string().valid('M', 'F', 'OTHER').allow(null),
  age: Joi.number().integer().min(0).max(120).allow(null),
  block: Joi.string().allow('', null),
  apartment: Joi.string().allow('', null),
  is_syndic: Joi.boolean().default(false),
  mandate_date: Joi.date().iso().allow(null),
});

const createOperator = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().allow('', null),
  sex: Joi.string().valid('M', 'F', 'OTHER').allow(null),
  company: Joi.string().allow('', null),
});

const updateUser = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  password: Joi.string().min(8).allow('', null),
  phone: Joi.string().allow('', null),
  sex: Joi.string().valid('M', 'F', 'OTHER').allow(null),
  age: Joi.number().integer().min(0).max(120).allow(null),
  block: Joi.string().allow('', null),
  apartment: Joi.string().allow('', null),
  company: Joi.string().allow('', null),
  is_syndic: Joi.boolean(),
  mandate_date: Joi.date().iso().allow(null),
}).min(1);

// ── Reservations ──────────────────────────────────────────────────
const createReservation = Joi.object({
  area_type: Joi.string().valid('COURT', 'KIOSK', 'PARTY_ROOM').required(),
  date: Joi.date().iso().required(),
  start_time: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .allow(null),
  end_time: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .allow(null),
  guests: Joi.number().integer().min(0).default(0),
  notes: Joi.string().max(500).allow('', null),
  items: Joi.array()
    .items(
      Joi.object({
        condo_item_id: Joi.string().uuid().required(),
        quantity_requested: Joi.number().integer().min(1).required(),
      })
    )
    .default([]),
});

const rejectReservation = Joi.object({
  reason: Joi.string().min(5).max(500).required(),
});

// ── Holidays ──────────────────────────────────────────────────────
const createHoliday = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  date: Joi.date().iso().required(),
  type: Joi.string().valid('NATIONAL', 'LOCAL', 'CUSTOM').default('CUSTOM'),
  recurring: Joi.boolean().default(false),
});

const updateHoliday = Joi.object({
  name: Joi.string().min(2).max(100),
  type: Joi.string().valid('NATIONAL', 'LOCAL', 'CUSTOM'),
  recurring: Joi.boolean(),
}).min(1);

// ── CondoItems ────────────────────────────────────────────────────
const createCondoItem = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  total_quantity: Joi.number().integer().min(1).required(),
});

const updateCondoItem = Joi.object({
  name: Joi.string().min(2).max(100),
  total_quantity: Joi.number().integer().min(0),
}).min(1);

// ── CheckoutForms ─────────────────────────────────────────────────
const createCheckoutForm = Joi.object({
  reservation_id: Joi.string().uuid().required(),
  key_returned: Joi.boolean().required(),
  notes: Joi.string().max(1000).allow('', null),
  items: Joi.array()
    .items(
      Joi.object({
        reservation_item_id: Joi.string().uuid().required(),
        quantity_returned: Joi.number().integer().min(0).required(),
      })
    )
    .default([]),
});

const rejectCheckout = Joi.object({
  observations: Joi.string().min(5).max(500).required(),
});

module.exports = {
  auth: { login, refresh },
  users: { createResident, createOperator, updateUser },
  reservations: { createReservation, rejectReservation },
  holidays: { createHoliday, updateHoliday },
  condoItems: { createCondoItem, updateCondoItem },
  checkoutForms: { createCheckoutForm, rejectCheckout },
};
