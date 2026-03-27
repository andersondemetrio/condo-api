require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const cron = require('node-cron');
const { Op } = require('sequelize');

const PORT = process.env.PORT || 3001;

// Cron: daily reminder at 08:00 for reservations tomorrow
cron.schedule('0 8 * * *', async () => {
  try {
    const { Reservation, User } = require('./models');
    const emailService = require('./services/email.service');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const reservations = await Reservation.findAll({
      where: { date: tomorrowStr, status: 'CONFIRMED' },
      include: [{ model: User, as: 'user' }],
    });

    for (const r of reservations) {
      await emailService.sendReservationReminder(r.user, r);
    }
    console.log(`[cron] Lembretes enviados: ${reservations.length}`);
  } catch (err) {
    console.error('[cron] Erro ao enviar lembretes:', err.message);
  }
});

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('[db] Conexao estabelecida com sucesso');

    if (process.env.NODE_ENV === 'development') {
      // In development, sync without altering (use migrations for schema changes)
    }

    app.listen(PORT, () => {
      console.log(`[server] API rodando em http://localhost:${PORT}`);
      console.log(`[server] Ambiente: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('[server] Falha ao iniciar:', err);
    process.exit(1);
  }
};

start();
