const { CheckoutForm, Reservation, ReservationItem, User } = require('../models');
const ApiError = require('../utils/ApiError');
const emailService = require('./email.service');

const listPending = async () => {
  return CheckoutForm.findAll({
    where: { status: 'PENDING' },
    include: [
      {
        model: Reservation,
        as: 'reservation',
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      },
      { model: User, as: 'submitter', attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'ASC']],
  });
};

const create = async ({ reservation_id, key_returned, notes, items }, userId) => {
  const reservation = await Reservation.findByPk(reservation_id);
  if (!reservation) throw ApiError.notFound('Reserva nao encontrada');
  if (reservation.status !== 'CONFIRMED')
    throw ApiError.unprocessable('Apenas reservas CONFIRMED podem ter conferencia');

  const existing = await CheckoutForm.findOne({ where: { reservation_id } });
  if (existing) throw ApiError.conflict('Ja existe um formulario para esta reserva');

  const form = await CheckoutForm.create({
    reservation_id, submitted_by: userId, key_returned, notes, status: 'PENDING',
  });

  for (const item of items) {
    await ReservationItem.update(
      { quantity_returned: item.quantity_returned },
      { where: { id: item.reservation_item_id } }
    );
  }

  return form;
};

const approve = async (id, approverId) => {
  const form = await CheckoutForm.findByPk(id, {
    include: [
      {
        model: Reservation,
        as: 'reservation',
        include: [{ model: User, as: 'user' }],
      },
    ],
  });
  if (!form) throw ApiError.notFound('Formulario nao encontrado');
  if (form.status !== 'PENDING') throw ApiError.unprocessable('Formulario ja processado');

  await form.update({ status: 'APPROVED', approved_by: approverId });
  await Reservation.update({ status: 'FINISHED' }, { where: { id: form.reservation_id } });

  const user = form.reservation.user;
  await emailService.sendCheckoutApproved(user, form.reservation);

  return form.reload();
};

const reject = async (id, approverId, observations) => {
  const form = await CheckoutForm.findByPk(id, {
    include: [
      {
        model: Reservation,
        as: 'reservation',
        include: [{ model: User, as: 'user' }],
      },
    ],
  });
  if (!form) throw ApiError.notFound('Formulario nao encontrado');
  if (form.status !== 'PENDING') throw ApiError.unprocessable('Formulario ja processado');

  await form.update({ status: 'REJECTED', approved_by: approverId, observations });

  const user = form.reservation.user;
  await emailService.sendCheckoutRejected(user, form.reservation, observations);

  return form.reload();
};

module.exports = { listPending, create, approve, reject };
