const express = require('express');
const prisma = require('../models/db');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const router = express.Router();

// GET single singleton config
router.get('/', async (req, res) => {
  try {
    const config = await prisma.config.findUnique({
      where: { id: 'singleton' },
    });
    return res.json(config);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// PUT update singleton config (Admin)
router.put('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      logo,
      companyName,
      cnpj,
      address,
      phone,
      whatsappSales,
      alertEmail,
      validityDays,
      socialLinks,
      footerText,
      workingHours,
      erpUrl,
      erpToken,
      erpSyncMinutes,
      themeColors,
      pdfNotes,
      installmentCount,
      installmentInterest,
      geminiApiKey,
      geminiModel,
      whatsappMessage,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
    } = req.body;

    const config = await prisma.config.upsert({
      where: { id: 'singleton' },
      update: {
        logo: logo !== undefined ? logo : undefined,
        companyName: companyName !== undefined ? companyName : undefined,
        cnpj: cnpj !== undefined ? cnpj : undefined,
        address: address !== undefined ? address : undefined,
        phone: phone !== undefined ? phone : undefined,
        whatsappSales: whatsappSales !== undefined ? whatsappSales : undefined,
        alertEmail: alertEmail !== undefined ? alertEmail : undefined,
        validityDays: validityDays !== undefined ? parseInt(validityDays) : undefined,
        socialLinks: socialLinks !== undefined ? (typeof socialLinks === 'string' ? socialLinks : JSON.stringify(socialLinks)) : undefined,
        footerText: footerText !== undefined ? footerText : undefined,
        workingHours: workingHours !== undefined ? workingHours : undefined,
        erpUrl: erpUrl !== undefined ? erpUrl : undefined,
        erpToken: erpToken !== undefined ? erpToken : undefined,
        erpSyncMinutes: erpSyncMinutes !== undefined ? parseInt(erpSyncMinutes) : undefined,
        themeColors: themeColors !== undefined ? (typeof themeColors === 'string' ? themeColors : JSON.stringify(themeColors)) : undefined,
        pdfNotes: pdfNotes !== undefined ? pdfNotes : undefined,
        installmentCount: installmentCount !== undefined ? parseInt(installmentCount) : undefined,
        installmentInterest: installmentInterest !== undefined ? Boolean(installmentInterest) : undefined,
        geminiApiKey: geminiApiKey !== undefined ? geminiApiKey : undefined,
        geminiModel: geminiModel !== undefined ? geminiModel : undefined,
        whatsappMessage: whatsappMessage !== undefined ? whatsappMessage : undefined,
        smtpHost: smtpHost !== undefined ? smtpHost : undefined,
        smtpPort: smtpPort !== undefined ? parseInt(smtpPort) : undefined,
        smtpUser: smtpUser !== undefined ? smtpUser : undefined,
        smtpPass: smtpPass !== undefined ? smtpPass : undefined,
      },
      create: {
        id: 'singleton',
        logo: logo || '',
        companyName: companyName || 'ServoSolda',
        cnpj: cnpj || '',
        address: address || '',
        phone: phone || '',
        whatsappSales: whatsappSales || '',
        alertEmail: alertEmail || '',
        validityDays: validityDays ? parseInt(validityDays) : 5,
        socialLinks: socialLinks ? (typeof socialLinks === 'string' ? socialLinks : JSON.stringify(socialLinks)) : '{}',
        footerText: footerText || '',
        workingHours: workingHours || '',
        erpUrl: erpUrl || '',
        erpToken: erpToken || '',
        erpSyncMinutes: erpSyncMinutes ? parseInt(erpSyncMinutes) : 15,
        themeColors: themeColors ? (typeof themeColors === 'string' ? themeColors : JSON.stringify(themeColors)) : "{\"primary\":\"#f59e0b\",\"secondary\":\"#1e293b\",\"accent\":\"#d97706\",\"background\":\"#f8fafc\",\"surface\":\"#ffffff\",\"text\":\"#0f172a\",\"textMuted\":\"#64748b\",\"border\":\"#e2e8f0\"}",
        pdfNotes: pdfNotes || '',
        installmentCount: installmentCount ? parseInt(installmentCount) : 10,
        installmentInterest: installmentInterest !== undefined ? Boolean(installmentInterest) : false,
        geminiApiKey: geminiApiKey || '',
        geminiModel: geminiModel || 'gemini-2.5-flash',
        whatsappMessage: whatsappMessage || '',
        smtpHost: smtpHost || '',
        smtpPort: smtpPort ? parseInt(smtpPort) : 587,
        smtpUser: smtpUser || '',
        smtpPass: smtpPass || '',
      },
    });

    return res.json(config);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

// POST /api/configs/test-ai
router.post('/test-ai', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const config = await prisma.config.findUnique({ where: { id: 'singleton' } });
    if (!config || !config.geminiApiKey) {
      return res.status(400).json({ error: 'Gemini API Key não configurada no banco de dados. Por favor, salve as configurações antes de testar.' });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: config.geminiModel || 'gemini-2.5-flash' });
    const result = await model.generateContent("Responda apenas com: OK");
    const response = await result.response;
    const text = response.text().trim();
    
    return res.json({ success: true, message: `✅ Conexão OK (Resposta: ${text})` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: `Erro na conexão com Gemini: ${error.message}` });
  }
});

// POST /api/configs/test-email
router.post('/test-email', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass, alertEmail } = req.body;
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !alertEmail) {
      return res.status(400).json({ error: 'Campos SMTP e E-mail de alerta são obrigatórios para teste.' });
    }

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      timeout: 10000,
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"ServoSolda Teste" <${smtpUser}>`,
      to: alertEmail,
      subject: 'Teste de Configuração de E-mail - ServoSolda',
      text: 'Este é um e-mail de teste para confirmar que as configurações do servidor SMTP do painel admin estão funcionando corretamente.',
      html: '<h3>Configuração de E-mail Concluída</h3><p>Este é um e-mail de teste para confirmar que as configurações do servidor SMTP do painel admin estão funcionando corretamente.</p>',
    });

    return res.json({ success: true, message: '✅ E-mail de teste enviado com sucesso! Verifique sua caixa de entrada.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: `Erro ao enviar e-mail de teste: ${error.message}` });
  }
});

module.exports = router;
