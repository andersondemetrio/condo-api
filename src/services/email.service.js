const transporter = require('../config/mailer');
const templates = require('../utils/emailTemplates');
const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');

const AREA_LABELS = {
  COURT: 'Quadra Esportiva',
  KIOSK: 'Quiosque',
  PARTY_ROOM: 'Salao de Festas',
};

const formatDate = (date) => {
  try {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return String(date);
  }
};

const sendEmail = async ({ to, subject, html }) => {
  if (process.env.NODE_ENV === 'test') return;
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
  } catch (err) {
    console.error('[email.service] Falha ao enviar e-mail:', err.message);
  }
};

const sendReservationConfirmed = (user, reservation) =>
  sendEmail({
    to: user.email,
    subject: 'Reserva confirmada',
    html: templates.reservationConfirmed({
      userName: user.name,
      area: AREA_LABELS[reservation.area_type],
      date: formatDate(reservation.date),
      startTime: reservation.start_time || '--',
      endTime: reservation.end_time || '--',
    }),
  });

const sendReservationPending = (user, reservation) =>
  sendEmail({
    to: user.email,
    subject: 'Pre-reserva recebida',
    html: templates.reservationPending({
      userName: user.name,
      area: AREA_LABELS[reservation.area_type],
      date: formatDate(reservation.date),
    }),
  });

const sendReservationApproved = (user, reservation) =>
  sendEmail({
    to: user.email,
    subject: 'Reserva aprovada!',
    html: templates.reservationApproved({
      userName: user.name,
      area: AREA_LABELS[reservation.area_type],
      date: formatDate(reservation.date),
      startTime: reservation.start_time || '--',
      endTime: reservation.end_time || '--',
    }),
  });

const sendReservationRejected = (user, reservation, reason) =>
  sendEmail({
    to: user.email,
    subject: 'Pre-reserva recusada',
    html: templates.reservationRejected({
      userName: user.name,
      area: AREA_LABELS[reservation.area_type],
      date: formatDate(reservation.date),
      reason,
    }),
  });

const sendReservationCancelled = (user, reservation) =>
  sendEmail({
    to: user.email,
    subject: 'Reserva cancelada',
    html: templates.reservationCancelled({
      userName: user.name,
      area: AREA_LABELS[reservation.area_type],
      date: formatDate(reservation.date),
    }),
  });

const sendReservationReminder = (user, reservation) =>
  sendEmail({
    to: user.email,
    subject: 'Lembrete: reserva amanha',
    html: templates.reservationReminder({
      userName: user.name,
      area: AREA_LABELS[reservation.area_type],
      date: formatDate(reservation.date),
      startTime: reservation.start_time || '--',
    }),
  });

const sendCheckoutApproved = (user, reservation) =>
  sendEmail({
    to: user.email,
    subject: 'Conferencia aprovada',
    html: templates.checkoutApproved({
      userName: user.name,
      area: AREA_LABELS[reservation.area_type],
      date: formatDate(reservation.date),
    }),
  });

const sendCheckoutRejected = (user, reservation, observations) =>
  sendEmail({
    to: user.email,
    subject: 'Conferencia rejeitada',
    html: templates.checkoutRejected({
      userName: user.name,
      area: AREA_LABELS[reservation.area_type],
      date: formatDate(reservation.date),
      observations,
    }),
  });

module.exports = {
  sendEmail,
  sendReservationConfirmed,
  sendReservationPending,
  sendReservationApproved,
  sendReservationRejected,
  sendReservationCancelled,
  sendReservationReminder,
  sendCheckoutApproved,
  sendCheckoutRejected,
};
