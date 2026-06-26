const axios = require('axios');
const prisma = require('../models/db');

async function syncErpProducts() {
  console.log('[ERP Sync] Initiating ERP synchronization check...');
  try {
    const config = await prisma.config.findUnique({ where: { id: 'singleton' } });
    if (!config || !config.erpUrl) {
      console.log('[ERP Sync] Sincronização pulada: URL do ERP não configurada.');
      return;
    }

    const headers = {};
    if (config.erpToken) {
      headers['Authorization'] = `Bearer ${config.erpToken}`;
    }

    // Connect to Softsystem ERP REST API
    const response = await axios.get(`${config.erpUrl}/products`, { headers, timeout: 5000 });
    const erpProducts = response.data;

    if (!Array.isArray(erpProducts)) {
      throw new Error('Formato retornado do ERP inválido. Esperado um array.');
    }

    let updatedCount = 0;

    for (const item of erpProducts) {
      const { sku, price, stock } = item;
      if (!sku) continue;

      // Find local product by sku
      const localProduct = await prisma.product.findUnique({ where: { sku } });
      if (localProduct) {
        // If stock is 0, status is set to ACTIVE but stock indicates sold out on frontend UI logic,
        // or we mark it as ACTIVE/INACTIVE depending on ERP rules. The instructions say:
        // "Se o produto tiver estoque 0, marcá-lo automaticamente como 'fora de estoque' no site (não remover)"
        // Since we don't have a specific "OUT_OF_STOCK" status in the database schema but we have standard "ACTIVE/FEATURED/INACTIVE",
        // we can simply update its price and stock. The frontend will dynamically render "Fora de Estoque" if stock <= 0.
        // We will keep status as-is (e.g. ACTIVE or FEATURED) so it is still visible on the site.
        await prisma.product.update({
          where: { sku },
          data: {
            price: parseFloat(price),
            stock: parseInt(stock),
          },
        });
        updatedCount++;
      }
    }

    const message = `Sincronização concluída com sucesso. ${updatedCount} produtos atualizados.`;
    console.log(`[ERP Sync] ${message}`);
    await prisma.syncLog.create({
      data: {
        status: 'SUCCESS',
        message,
      },
    });

  } catch (error) {
    const errMsg = `Erro ao sincronizar com ERP: ${error.message}`;
    console.error(`[ERP Sync] ${errMsg}`);
    try {
      await prisma.syncLog.create({
        data: {
          status: 'FAILED',
          message: errMsg,
        },
      });
    } catch (dbErr) {
      console.error('[ERP Sync] Failed to write SyncLog to DB:', dbErr.message);
    }
  }
}

module.exports = {
  syncErpProducts,
};
