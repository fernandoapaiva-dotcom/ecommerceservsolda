const express = require('express');
const prisma = require('../models/db');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const router = express.Router();

// GET all clients (Admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        id: true,
        name: true,
        email: true,
        document: true,
        phone: true,
        address: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(clients);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

// GET single client details + order history (Admin)
router.get('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const client = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client || client.role === 'ADMIN') {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    return res.json(client);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar dados do cliente' });
  }
});

module.exports = router;
