const express = require('express');
const prisma = require('../models/db');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const { generateBudgetPDF } = require('../services/pdf');
const { sendAlertEmail } = require('../services/mail');

const router = express.Router();

// Helper to generate a unique human-readable budget number
// Format: ORC-YYYYMMDD-XXXX where XXXX is a incrementing number
async function generateBudgetNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.order.count({
    where: {
      budgetNumber: {
        startsWith: `ORC-${dateStr}`,
      },
    },
  });
  const suffix = (count + 1).toString().padStart(4, '0');
  return `ORC-${dateStr}-${suffix}`;
}

// GET all budgets with optional client filter (Admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, clientId } = req.query;
    const where = {};

    if (clientId) {
      where.userId = clientId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const budgets = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            document: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(budgets);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar orçamentos' });
  }
});

// GET client's own budget history
router.get('/my-budgets', authMiddleware, async (req, res) => {
  try {
    const budgets = await prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(budgets);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar históricos do cliente' });
  }
});

// GET budget details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const budget = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            document: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!budget) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }

    // Allow owner or Admin to view details
    if (budget.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso não autorizado.' });
    }

    return res.json(budget);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar detalhes do orçamento' });
  }
});

// POST Create Budget (Checkout)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, subtotal, total, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'O carrinho está vazio ou é inválido.' });
    }

    // Load active config
    const config = await prisma.config.findUnique({ where: { id: 'singleton' } });
    if (!config) {
      return res.status(500).json({ error: 'Configuração geral do sistema não encontrada.' });
    }

    // Generate unique budget number
    const budgetNumber = await generateBudgetNumber();

    // Create the Order/Budget in the database
    const order = await prisma.order.create({
      data: {
        budgetNumber,
        userId: req.user.id,
        items: JSON.stringify(items),
        subtotal: parseFloat(subtotal),
        total: parseFloat(total),
        notes: notes || '',
      },
    });

    // Generate the PDF
    const pdfPath = await generateBudgetPDF(order, req.user, config);

    // Save PDF link in DB
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { pdfPath },
    });

    // Send asynchronous alert email to Admin
    sendAlertEmail(config, updatedOrder, req.user);

    // Construct the WhatsApp message parameters for redirection
    let whatsappMessage = config.whatsappMessage;
    if (!whatsappMessage) {
      const customerInfo = `*Cliente:* ${req.user.name}\n*Contato:* ${req.user.phone || req.user.email}`;
      const budgetInfo = `*Orçamento:* ${budgetNumber}\n*Total:* R$ ${updatedOrder.total.toFixed(2)}`;
      whatsappMessage = `Olá ServoSolda! Acabei de gerar o orçamento no site:\n\n${budgetInfo}\n${customerInfo}\n\nEstou enviando o arquivo PDF em anexo para fecharmos o negócio.`;
    } else {
      whatsappMessage = whatsappMessage
        .replace(/{budgetNumber}/g, budgetNumber)
        .replace(/{total}/g, `R$ ${updatedOrder.total.toFixed(2)}`)
        .replace(/{customerName}/g, req.user.name)
        .replace(/{customerContact}/g, req.user.phone || req.user.email);
    }
    
    const cleanPhone = config.whatsappSales.replace(/\D/g, '');
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;

    return res.status(201).json({
      message: 'Orçamento gerado com sucesso!',
      order: updatedOrder,
      downloadUrl: pdfPath, // URL for downloading the generated PDF
      whatsappRedirectUrl: waLink,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao gerar orçamento' });
  }
});

module.exports = router;
