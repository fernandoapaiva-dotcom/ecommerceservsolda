const express = require('express');
const prisma = require('../models/db');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const router = express.Router();

// GET all products with filtering, search and active status
router.get('/', async (req, res) => {
  try {
    const { sectionId, search, status, minPrice, maxPrice } = req.query;

    const where = {};

    if (sectionId) {
      where.sectionId = sectionId;
    }

    if (status) {
      where.status = status;
    } else {
      // Default: clients see ACTIVE & FEATURED. Admins can view INACTIVE.
      where.status = { in: ['ACTIVE', 'FEATURED'] };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        section: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(products);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// GET single product by SKU or ID
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: identifier },
          { sku: identifier },
        ],
      },
      include: {
        section: true,
        reviews: {
          include: {
            user: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    return res.json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// POST create product (Admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      sku,
      name,
      price,
      stock,
      description,
      specs, // JSON structure or string
      status, // "ACTIVE", "INACTIVE", "FEATURED"
      images, // JSON array of string URLs
      pdfs, // JSON array of objects
      videos, // JSON array of objects
      metaTitle,
      metaDesc,
      sectionId,
      warranty,
    } = req.body;

    if (!sku || !name || !sectionId || price === undefined) {
      return res.status(400).json({ error: 'SKU, Nome, Preço e Seção são obrigatórios' });
    }

    const existingProduct = await prisma.product.findUnique({ where: { sku } });
    if (existingProduct) {
      return res.status(400).json({ error: 'Já existe um produto cadastrado com este SKU' });
    }

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        price: parseFloat(price),
        stock: stock !== undefined ? parseInt(stock) : 0,
        description: description || '',
        specs: typeof specs === 'string' ? specs : JSON.stringify(specs || []),
        status: status || 'ACTIVE',
        images: typeof images === 'string' ? images : JSON.stringify(images || []),
        pdfs: typeof pdfs === 'string' ? pdfs : JSON.stringify(pdfs || []),
        videos: typeof videos === 'string' ? videos : JSON.stringify(videos || []),
        metaTitle: metaTitle || '',
        metaDesc: metaDesc || '',
        sectionId,
        warranty: warranty || '',
      },
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// PUT update product (Admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      sku,
      name,
      price,
      stock,
      description,
      specs,
      status,
      images,
      pdfs,
      videos,
      metaTitle,
      metaDesc,
      sectionId,
      warranty,
    } = req.body;

    const currentProduct = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!currentProduct) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Verify SKU uniqueness if changing
    if (sku && sku !== currentProduct.sku) {
      const skuCheck = await prisma.product.findUnique({ where: { sku } });
      if (skuCheck) {
        return res.status(400).json({ error: 'Já existe um produto com o SKU informado' });
      }
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        sku: sku !== undefined ? sku : undefined,
        name: name !== undefined ? name : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        description: description !== undefined ? description : undefined,
        specs: specs !== undefined ? (typeof specs === 'string' ? specs : JSON.stringify(specs)) : undefined,
        status: status !== undefined ? status : undefined,
        images: images !== undefined ? (typeof images === 'string' ? images : JSON.stringify(images)) : undefined,
        pdfs: pdfs !== undefined ? (typeof pdfs === 'string' ? pdfs : JSON.stringify(pdfs)) : undefined,
        videos: videos !== undefined ? (typeof videos === 'string' ? videos : JSON.stringify(videos)) : undefined,
        metaTitle: metaTitle !== undefined ? metaTitle : undefined,
        metaDesc: metaDesc !== undefined ? metaDesc : undefined,
        sectionId: sectionId !== undefined ? sectionId : undefined,
        warranty: warranty !== undefined ? warranty : undefined,
      },
    });

    return res.json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// POST submit a review for a product
router.post('/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    if (!rating || rating < 1 || rating > 5 || !comment) {
      return res.status(400).json({ error: 'Nota (1 a 5) e comentário são obrigatórios.' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment,
        productId,
        userId: req.user.id,
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    return res.status(201).json(review);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao salvar avaliação.' });
  }
});

// DELETE product (Admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id },
    });
    return res.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

module.exports = router;
