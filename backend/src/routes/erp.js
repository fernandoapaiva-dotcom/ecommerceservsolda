const express = require('express');
const prisma = require('../models/db');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const router = express.Router();

// Mock ERP implementation: Simulation of the Softsystem ERP endpoint
// GET /api/mock-erp/products
router.get('/products', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    // Simple mock auth token verification
    if (!authHeader || !authHeader.includes('mock-erp-secret-token-key-2026')) {
      return res.status(401).json({ error: 'Unauthorized ERP token check' });
    }

    // Returns custom products stocks and prices matching SKU codes
    // We will supply mock changes for testing the synchronization
    const mockErpData = [
      { sku: 'MIG-250', price: 2399.90, stock: 12 },
      { sku: 'INV-160', price: 749.00, stock: 25 },
      // test zero stock product behavior
      { sku: 'TEST-ZERO-STOCK', price: 150.00, stock: 0 }
    ];

    return res.json(mockErpData);
  } catch (err) {
    return res.status(500).json({ error: 'ERP internal failure simulation' });
  }
});

// Logs Endpoint (Admin)
router.get('/logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const logs = await prisma.syncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar logs de sincronização' });
  }
});

module.exports = router;
