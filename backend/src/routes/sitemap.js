const express = require('express');
const prisma = require('../models/db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { sku: true, updatedAt: true }
    });

    const sections = await prisma.section.findMany({
      where: { active: true },
      select: { id: true, updatedAt: true }
    });

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${baseUrl}/produtos</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${baseUrl}/privacidade</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.3</priority>\n  </url>\n`;

    // Sections
    sections.forEach(sec => {
      const date = new Date(sec.updatedAt).toISOString().split('T')[0];
      xml += `  <url>\n    <loc>${baseUrl}/secao/${sec.id}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    });

    // Products
    products.forEach(prod => {
      const date = new Date(prod.updatedAt).toISOString().split('T')[0];
      xml += `  <url>\n    <loc>${baseUrl}/produto/${prod.sku}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    return res.status(200).send(xml);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
