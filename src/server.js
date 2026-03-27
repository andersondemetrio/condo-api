require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const cron = require('node-cron');

const PORT = process.env.PORT || 3001;

// Cron: Lembrete diário (Nota: No Vercel Free, crons internos não rodam 24h)
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

/**
 * Lógica de Inicialização
 * Na Vercel, o 'sequelize.authenticate' deve ser feito sob demanda ou
 * apenas exportamos o app. O listen é exclusivo para Local/Dev.
 */
if (process.env.NODE_ENV !== 'production') {
  sequelize.authenticate()
    .then(() => {
      console.log('[db] Conexao estabelecida com sucesso');
      app.listen(PORT, () => {
        console.log(`[server] API rodando em http://localhost:${PORT}`);
      });
    })
    .catch(err => {
      console.error('[server] Falha ao iniciar banco local:', err);
    });
}

// Essencial para a Vercel funcionar
module.exports = app;