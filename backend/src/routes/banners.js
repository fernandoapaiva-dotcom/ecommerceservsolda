const express = require('express');
const prisma = require('../models/db');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const router = express.Router();

// GET all banners
router.get('/', async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { order: 'asc' },
    });
    return res.json(banners);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar banners' });
  }
});

// POST create banner (Admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { image, link, title, order, active } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Imagem do banner é obrigatória' });
    }

    const banner = await prisma.banner.create({
      data: {
        image,
        link: link || '',
        title: title || '',
        order: order !== undefined ? parseInt(order) : 0,
        active: active !== undefined ? Boolean(active) : true,
      },
    });
    return res.status(201).json(banner);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar banner' });
  }
});

// PUT update banner (Admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { image, link, title, order, active } = req.body;
    const banner = await prisma.banner.update({
      where: { id: req.params.id },
      data: {
        image: image !== undefined ? image : undefined,
        link: link !== undefined ? link : undefined,
        title: title !== undefined ? title : undefined,
        order: order !== undefined ? parseInt(order) : undefined,
        active: active !== undefined ? Boolean(active) : undefined,
      },
    });
    return res.json(banner);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar banner' });
  }
});

// DELETE banner (Admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.banner.delete({
      where: { id: req.params.id },
    });
    return res.json({ message: 'Banner excluído com sucesso' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao excluir banner' });
  }
});

module.exports = router;
