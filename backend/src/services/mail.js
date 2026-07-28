const nodemailer = require('nodemailer');

async function sendAlertEmail(config, order, user) {
  try {
    if (!config.alertEmail) {
      console.log('No alert email configured. Skipping email notification.');
      return;
    }

    let transporter;
    if (config.smtpHost && config.smtpPort && config.smtpUser && config.smtpPass) {
      transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: parseInt(config.smtpPort),
        secure: parseInt(config.smtpPort) === 465,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        jsonTransport: true // Log email json to console for debugging / local testing instead of blocking on real credentials
      });
    }

    const items = JSON.parse(order.items);
    const itemsListHtml = items.map(item => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.sku}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.qty}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">R$ ${item.price.toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">R$ ${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    const emailOptions = {
      from: '"ServSolda Notificações" <no-reply@servsolda.com.br>',
      to: config.alertEmail,
      subject: `[Novo Orçamento] #${order.budgetNumber} - ${user.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333;">
          <h2 style="color: #d97706; border-bottom: 2px solid #d97706; padding-bottom: 10px;">Novo Orçamento Gerado no Site</h2>
          <p>Olá, equipe de vendas.</p>
          <p>Um novo orçamento de venda B2B/B2C foi gerado pelo cliente e aguarda contato comercial.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px;">
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 8px; font-weight: bold;">Número do Orçamento:</td>
              <td style="padding: 8px;">${order.budgetNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Cliente:</td>
              <td style="padding: 8px;">${user.name} (${user.email})</td>
            </tr>
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 8px; font-weight: bold;">Documento (CPF/CNPJ):</td>
              <td style="padding: 8px;">${user.document || 'Não informado'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Telefone de Contato:</td>
              <td style="padding: 8px;">${user.phone || 'Não informado'}</td>
            </tr>
          </table>

          <h3 style="margin-top: 25px; color: #1f2937;">Itens Solicitados</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background-color: #1f2937; color: white;">
                <th style="padding: 8px; text-align: left;">SKU</th>
                <th style="padding: 8px; text-align: left;">Produto</th>
                <th style="padding: 8px; text-align: center;">Qtd</th>
                <th style="padding: 8px; text-align: right;">Unitário</th>
                <th style="padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsListHtml}
            </tbody>
            <tfoot>
              <tr style="font-weight: bold; background-color: #f3f4f6;">
                <td colspan="4" style="padding: 8px; text-align: right;">Valor Total Geral:</td>
                <td style="padding: 8px; text-align: right; color: #d97706;">R$ ${order.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <p style="margin-top: 20px;">O PDF completo do orçamento foi gerado e salvo em: <strong>${order.pdfPath}</strong></p>
          <p style="font-size: 11px; color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">
            Este é um e-mail automático gerado pelo sistema ServSolda E-commerce.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(emailOptions);
    console.log(`[Email Sent mock] Alert notification for budget ${order.budgetNumber} sent to ${config.alertEmail}`);
    console.log('Mock email content logs:', info.message);
  } catch (error) {
    console.error('Error sending alert email:', error);
  }
}

module.exports = {
  sendAlertEmail,
};
