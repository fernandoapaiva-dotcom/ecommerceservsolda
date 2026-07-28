const express = require('express');
const path = require('path');
const prisma = require('../models/db');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const router = express.Router();

// GET all products with filtering, search and active status
router.get('/', async (req, res) => {
  try {
    const { sectionId, search, status, minPrice, maxPrice } = req.query;

    const where = {};

    if (sectionId) {
      // Find all child subcategories recursively to include products in nested subgroups
      const allSectionIds = [sectionId];
      const getSubcategories = async (parentId) => {
        const subcategories = await prisma.section.findMany({
          where: { parentId },
          select: { id: true }
        });
        for (const sub of subcategories) {
          allSectionIds.push(sub.id);
          await getSubcategories(sub.id);
        }
      };
      await getSubcategories(sectionId);
      where.sectionId = { in: allSectionIds };
    }

    if (status) {
      if (status !== 'ALL') {
        where.status = status;
      }
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

// Firebird Services & Multer
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { restoreFbkToFdb, queryFirebirdDatabase, normalizeErpRecords, applyErpProductsToDb } = require('../services/firebirdSync');
const fs = require('fs');

// POST /api/products/sync-firebird (Admin) - Conecta no banco Firebird .FDB
router.post('/sync-firebird', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const config = await prisma.config.findUnique({ where: { id: 'singleton' } });
    const database = req.body.databasePath || (config ? config.erpUrl : null);

    if (!database) {
      return res.status(400).json({ error: 'Caminho do banco Firebird (.FDB) não informado.' });
    }

    const host = req.body.host || '127.0.0.1';
    const port = req.body.port ? parseInt(req.body.port) : 3050;
    const user = req.body.user || 'SYSDBA';
    const password = req.body.password || 'masterkey';
    const createIfMissing = req.body.createIfMissing === true;

    console.log(`[Firebird Sync] Conectando em ${host}:${port} - ${database}`);

    const rawRecords = await queryFirebirdDatabase({
      host,
      port,
      database,
      user,
      password
    });

    const normalized = normalizeErpRecords(rawRecords);
    const result = await applyErpProductsToDb(normalized, createIfMissing);

    return res.json({
      message: 'Sincronização com Firebird executada com sucesso!',
      ...result
    });
  } catch (error) {
    console.error('[Firebird Sync Error]', error);
    return res.status(500).json({ error: error.message || 'Erro ao sincronizar com banco Firebird' });
  }
});

// POST /api/products/import-erp-file (Admin) - Processa upload de arquivo de backup (.FBK, .FDB, .CSV, .TXT, .JSON, .XML)
router.post('/import-erp-file', authMiddleware, adminMiddleware, upload.single('file'), async (req, res) => {
  let filePath = req.file?.path;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const originalName = req.file.originalname.toLowerCase();
    const ext = path.extname(req.file.originalname) || (originalName.endsWith('.fbk') ? '.fbk' : '.fdb');
    const namedFilePath = req.file.path + ext;
    fs.renameSync(req.file.path, namedFilePath);
    filePath = namedFilePath;

    const createIfMissing = req.body.createIfMissing === 'true' || req.body.createIfMissing === true;
    const onlyWebExport = req.body.onlyWebExport === 'true' || req.body.onlyWebExport === true;

    let normalizedRecords = [];

    if (originalName.endsWith('.fbk')) {
      // Aguarda 1 segundo para o Windows/Node liberar a trava de escrita do Multer no disco
      await new Promise(r => setTimeout(r, 1000));
      // Arquivo de backup compactado do Firebird (.FBK) -> restaura em um .FDB temporário via gbak.exe
      const absPath = path.resolve(filePath);
      const tempFdbPath = restoreFbkToFdb(absPath);
      try {
        const rawRecords = await queryFirebirdDatabase({ database: tempFdbPath, onlyWebExport });
        normalizedRecords = normalizeErpRecords(rawRecords);
      } finally {
        try { fs.unlinkSync(tempFdbPath); } catch (e) {}
      }

    } else if (originalName.endsWith('.fdb') || originalName.endsWith('.gdb')) {
      // É um arquivo de banco de dados Firebird enviado via upload!
      const absPath = path.resolve(filePath);
      const rawRecords = await queryFirebirdDatabase({
        database: absPath,
        onlyWebExport
      });
      normalizedRecords = normalizeErpRecords(rawRecords);

    } else if (originalName.endsWith('.json')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      const records = Array.isArray(parsed) ? parsed : (parsed.products || parsed.items || [parsed]);
      normalizedRecords = normalizeErpRecords(records);

    } else {
      // Trata como CSV, TXT ou relatório delimitado por ;, , ou TAB
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

      if (lines.length > 0) {
        // Detecta separador (;, , ou tab)
        const headerLine = lines[0];
        let delimiter = ';';
        if (headerLine.includes(';') && !headerLine.includes(',')) delimiter = ';';
        else if (headerLine.includes(',') && !headerLine.includes(';')) delimiter = ',';
        else if (headerLine.includes('\t')) delimiter = '\t';

        const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));

        const parsedRows = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = cols[idx] || '';
          });
          parsedRows.push(rowObj);
        }

        normalizedRecords = normalizeErpRecords(parsedRows);
      }
    }

    // Remove o arquivo temporário após o parsing
    try { fs.unlinkSync(filePath); } catch (e) {}

    if (normalizedRecords.length === 0) {
      return res.status(400).json({ error: 'Nenhum registro válido de produto encontrado no arquivo.' });
    }

    const result = await applyErpProductsToDb(normalizedRecords, createIfMissing);

    return res.json({
      message: `Importação de ${originalName} realizada com sucesso!`,
      fileName: req.file.originalname,
      ...result
    });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    console.error('[Import ERP File Error]', error);
    return res.status(500).json({ error: error.message || 'Erro ao processar arquivo do ERP.' });
  }
});

module.exports = router;

