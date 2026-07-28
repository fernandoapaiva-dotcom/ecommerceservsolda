const express = require('express');
const prisma = require('../models/db');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const router = express.Router();

// GET all sections
router.get('/', async (req, res) => {
  try {
    const sections = await prisma.section.findMany({
      orderBy: { order: 'asc' },
    });
    return res.json(sections);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar seções' });
  }
});

// POST create section (Admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, image, icon, order, active, parentId } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome da seção é obrigatório' });
    }

    const section = await prisma.section.create({
      data: {
        name,
        image: image || '',
        icon: icon || '',
        order: order !== undefined ? parseInt(order) : 0,
        active: active !== undefined ? Boolean(active) : true,
        parentId: parentId || null
      },
    });
    return res.status(201).json(section);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar seção' });
  }
});

// PUT update section (Admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, image, icon, order, active, parentId } = req.body;
    
    // Prevent section from becoming its own parent
    if (parentId && parentId === req.params.id) {
      return res.status(400).json({ error: 'Uma seção não pode ser pai de si mesma.' });
    }

    const section = await prisma.section.update({
      where: { id: req.params.id },
      data: {
        name: name !== undefined ? name : undefined,
        image: image !== undefined ? image : undefined,
        icon: icon !== undefined ? icon : undefined,
        order: order !== undefined ? parseInt(order) : undefined,
        active: active !== undefined ? Boolean(active) : undefined,
        parentId: parentId !== undefined ? (parentId || null) : undefined
      },
    });
    return res.json(section);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar seção' });
  }
});

// POST reorder sections (Admin)
router.post('/reorder', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { orders } = req.body; // Array of { id: string, order: number }
    if (!Array.isArray(orders)) {
      return res.status(400).json({ error: 'orders deve ser um array' });
    }

    const transactions = orders.map((item) =>
      prisma.section.update({
        where: { id: item.id },
        data: { order: parseInt(item.order) },
      })
    );

    await prisma.$transaction(transactions);
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao reordenar seções' });
  }
});

// DELETE section (Admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const childCount = await prisma.section.count({
      where: { parentId: req.params.id },
    });

    if (childCount > 0) {
      return res.status(400).json({
        error: 'Esta seção possui subcategorias vinculadas e não pode ser excluída.',
      });
    }

    const productCount = await prisma.product.count({
      where: { sectionId: req.params.id },
    });

    if (productCount > 0) {
      return res.status(400).json({
        error: 'Esta seção possui produtos vinculados e não pode ser excluída.',
      });
    }

    await prisma.section.delete({
      where: { id: req.params.id },
    });
    return res.json({ message: 'Seção excluída com sucesso' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao excluir seção' });
  }
});

module.exports = router;
