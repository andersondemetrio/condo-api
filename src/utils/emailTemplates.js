const BASE_STYLE = `
  font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;
  background: #f9f9f9; border-radius: 8px; overflow: hidden;
`;
const HEADER_STYLE = `
  background: #1a56db; color: white; padding: 24px 32px;
  font-size: 20px; font-weight: bold;
`;
const BODY_STYLE = `padding: 24px 32px; background: white;`;
const FOOTER_STYLE = `padding: 16px 32px; font-size: 12px; color: #888;`;

const wrap = (title, body) => `
<div style="${BASE_STYLE}">
  <div style="${HEADER_STYLE}">🏢 Condomínio — ${title}</div>
  <div style="${BODY_STYLE}">${body}</div>
  <div style="${FOOTER_STYLE}">Este é um e-mail automático. Por favor, não responda.</div>
</div>`;

const templates = {
  reservationConfirmed: ({ userName, area, date, startTime, endTime }) =>
    wrap('Reserva Confirmada', `
      <p>Olá, <strong>${userName}</strong>!</p>
      <p>Sua reserva foi <strong style="color:#1a56db">confirmada</strong> com sucesso.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Área</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${area}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Data</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${date}</td></tr>
        <tr><td style="padding:8px;color:#555">Horário</td><td style="padding:8px;font-weight:bold">${startTime} – ${endTime}</td></tr>
      </table>
    `),

  reservationPending: ({ userName, area, date }) =>
    wrap('Pré-reserva Recebida', `
      <p>Olá, <strong>${userName}</strong>!</p>
      <p>Sua pré-reserva do <strong>${area}</strong> para o dia <strong>${date}</strong> foi recebida e está <strong style="color:#d97706">aguardando aprovação</strong> do porteiro ou síndico.</p>
      <p>Você receberá outro e-mail assim que for aprovada ou recusada.</p>
    `),

  reservationApproved: ({ userName, area, date, startTime, endTime }) =>
    wrap('Reserva Aprovada! 🎉', `
      <p>Olá, <strong>${userName}</strong>!</p>
      <p>Ótima notícia! Sua pré-reserva foi <strong style="color:#16a34a">aprovada</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Área</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${area}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Data</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${date}</td></tr>
        <tr><td style="padding:8px;color:#555">Horário</td><td style="padding:8px;font-weight:bold">${startTime} – ${endTime}</td></tr>
      </table>
    `),

  reservationRejected: ({ userName, area, date, reason }) =>
    wrap('Pré-reserva Recusada', `
      <p>Olá, <strong>${userName}</strong>!</p>
      <p>Infelizmente, sua pré-reserva do <strong>${area}</strong> para o dia <strong>${date}</strong> foi <strong style="color:#dc2626">recusada</strong>.</p>
      ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
      <p>Entre em contato com a administração para mais informações.</p>
    `),

  reservationCancelled: ({ userName, area, date }) =>
    wrap('Reserva Cancelada', `
      <p>Olá, <strong>${userName}</strong>!</p>
      <p>Sua reserva do <strong>${area}</strong> para o dia <strong>${date}</strong> foi <strong style="color:#f97316">cancelada</strong>.</p>
      <p>Caso não tenha solicitado o cancelamento, entre em contato com a administração.</p>
    `),

  reservationReminder: ({ userName, area, date, startTime }) =>
    wrap('Lembrete de Reserva ⏰', `
      <p>Olá, <strong>${userName}</strong>!</p>
      <p>Lembrando que você tem uma reserva <strong>amanhã</strong>!</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Área</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${area}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Data</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${date}</td></tr>
        <tr><td style="padding:8px;color:#555">Horário</td><td style="padding:8px;font-weight:bold">${startTime}</td></tr>
      </table>
    `),

  checkoutApproved: ({ userName, area, date }) =>
    wrap('Conferência Aprovada ✅', `
      <p>Olá, <strong>${userName}</strong>!</p>
      <p>A conferência de devolução da sua reserva do <strong>${area}</strong> (${date}) foi <strong style="color:#16a34a">aprovada</strong>.</p>
      <p>Obrigado pela colaboração!</p>
    `),

  checkoutRejected: ({ userName, area, date, observations }) =>
    wrap('Conferência Rejeitada', `
      <p>Olá, <strong>${userName}</strong>!</p>
      <p>A conferência de devolução da sua reserva do <strong>${area}</strong> (${date}) foi <strong style="color:#dc2626">rejeitada</strong>.</p>
      ${observations ? `<p><strong>Observações:</strong> ${observations}</p>` : ''}
      <p>Entre em contato com a administração para regularização.</p>
    `),
};

module.exports = templates;
