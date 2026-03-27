const { Op } = require('sequelize');
const { Reservation, Holiday, ReservationItem, CondoItem, User } = require('../models');
const ApiError = require('../utils/ApiError');
const emailService = require('./email.service');

const AREA_LABELS = { COURT: 'Quadra Esportiva', KIOSK: 'Quiosque', PARTY_ROOM: 'Salão de Festas' };

// ── Validation helpers ────────────────────────────────────────────

const assertNotHoliday = async (date) => {
  const d = new Date(date);
  const mmdd = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const holiday = await Holiday.findOne({ where: { date } });
  if (holiday) throw ApiError.unprocessable(`Data bloqueada: feriado "${holiday.name}"`);
};

const assertFutureDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(date) <= today) throw ApiError.unprocessable('Não é possível reservar em datas passadas');
};

const assertAreaAvailable = async (area_type, date, excludeId = null) => {
  const where = { area_type, date, status: { [Op.notIn]: ['REJECTED', 'CANCELLED'] } };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const existing = await Reservation.findOne({ where });
  if (existing) throw ApiError.conflict(`${AREA_LABELS[area_type]} já reservada para esta data`);
};

const assertUserNoDoubleBooking = async (userId, date, excludeId = null) => {
  const where = {
    user_id: userId,
    date,
    status: { [Op.notIn]: ['REJECTED', 'CANCELLED'] },
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const existing = await Reservation.findOne({ where });
  if (existing) throw ApiError.conflict('Você já possui uma reserva nesta data');
};

const assertItemsAvailable = async (items, date) => {
  for (const item of items) {
    const condoItem = await CondoItem.findByPk(item.condo_item_id);
    if (!condoItem) throw ApiError.notFound(`Item ${item.condo_item_id} não encontrado`);

    const used = await ReservationItem.sum('quantity_requested', {
      where: { condo_item_id: item.condo_item_id },
      include: [
        {
          model: Reservation,
          as: 'reservation',
          where: { date, status: { [Op.notIn]: ['REJECTED', 'CANCELLED'] } },
          required: true,
        },
      ],
    });

    const available = condoItem.total_quantity - (used || 0);
    if (item.quantity_requested > available) {
      throw ApiError.conflict(
        `Item "${condoItem.name}": solicitado ${item.quantity_requested}, disponível ${available}`
      );
    }
  }
};

// ── CRUD ──────────────────────────────────────────────────────────

const list = async ({ area_type, status, date, user_id, page = 1, limit = 20 }) => {
  const where = {};
  if (area_type) where.area_type = area_type;
  if (status) where.status = status;
  if (date) where.date = date;
  if (user_id) where.user_id = user_id;

  const offset = (page - 1) * limit;
  const { count, rows } = await Reservation.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'block', 'apartment'] }],
    limit: Number(limit),
    offset,
    order: [['date', 'ASC'], ['start_time', 'ASC']],
  });
  return { total: count, page: Number(page), pages: Math.ceil(count / limit), data: rows };
};

const getCalendar = async (month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  const [reservations, holidays] = await Promise.all([
    Reservation.findAll({
      where: {
        date: { [Op.between]: [start, end] },
        status: { [Op.notIn]: ['REJECTED', 'CANCELLED'] },
      },
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
    }),
    Holiday.findAll({ where: { date: { [Op.between]: [start, end] } } }),
  ]);

  return { reservations, holidays };
};

const getById = async (id) => {
  const reservation = await Reservation.findByPk(id, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'name', 'email', 'block', 'apartment'] },
      { model: ReservationItem, as: 'items', include: [{ model: CondoItem, as: 'condoItem' }] },
    ],
  });
  if (!reservation) throw ApiError.notFound('Reserva não encontrada');
  return reservation;
};

const create = async ({ area_type, date, start_time, end_time, guests, notes, items = [] }, userId) => {
  assertFutureDate(date);
  await assertNotHoliday(date);
  await assertAreaAvailable(area_type, date);
  await assertUserNoDoubleBooking(userId, date);
  if (items.length) await assertItemsAvailable(items, date);

  const status = area_type === 'PARTY_ROOM' ? 'PENDING' : 'CONFIRMED';

  const reservation = await Reservation.create({
    user_id: userId, area_type, date, start_time, end_time, guests, notes, status,
  });

  if (items.length) {
    await ReservationItem.bulkCreate(
      items.map((i) => ({ reservation_id: reservation.id, ...i }))
    );
  }

  const user = await User.findByPk(userId);
  if (status === 'CONFIRMED') {
    await emailService.sendReservationConfirmed(user, reservation);
  } else {
    await emailService.sendReservationPending(user, reservation);
  }

  return getById(reservation.id);
};

const approve = async (id) => {
  const reservation = await getById(id);
  if (reservation.status !== 'PENDING')
    throw ApiError.unprocessable('Apenas reservas PENDING podem ser aprovadas');
  await reservation.update({ status: 'CONFIRMED' });
  const user = await User.findByPk(reservation.user_id);
  await emailService.sendReservationApproved(user, reservation);
  return reservation.reload();
};

const reject = async (id, reason) => {
  const reservation = await getById(id);
  if (reservation.status !== 'PENDING')
    throw ApiError.unprocessable('Apenas reservas PENDING podem ser rejeitadas');
  await reservation.update({ status: 'REJECTED', rejection_reason: reason });
  const user = await User.findByPk(reservation.user_id);
  await emailService.sendReservationRejected(user, reservation, reason);
  return reservation.reload();
};

const cancel = async (id, requestingUser) => {
  const reservation = await getById(id);

  if (requestingUser.role === 'RESIDENT') {
    if (reservation.user_id !== requestingUser.id)
      throw ApiError.forbidden('Você só pode cancelar suas próprias reservas');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(reservation.date) <= today)
      throw ApiError.unprocessable('Não é possível cancelar reservas passadas ou do dia atual');
  }

  if (['FINISHED', 'CANCELLED'].includes(reservation.status))
    throw ApiError.unprocessable(`Reserva já está ${reservation.status}`);

  await reservation.update({ status: 'CANCELLED' });
  const user = await User.findByPk(reservation.user_id);
  await emailService.sendReservationCancelled(user, reservation);
  return reservation.reload();
};

module.exports = {
  list, getCalendar, getById, create, approve, reject, cancel,
  assertNotHoliday, assertFutureDate, assertAreaAvailable,
  assertUserNoDoubleBooking, assertItemsAvailable,
};
