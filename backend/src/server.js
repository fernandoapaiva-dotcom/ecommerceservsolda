require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const nodeCron = require('node-cron');

const prisma = require('./models/db');
const { syncErpProducts } = require('./services/erpSync');

// Import routes
const authRoutes = require('./routes/auth');
const sectionsRoutes = require('./routes/sections');
const productsRoutes = require('./routes/products');
const bannersRoutes = require('./routes/banners');
const configsRoutes = require('./routes/configs');
const uploadsRoutes = require('./routes/uploads');
const clientsRoutes = require('./routes/clients');
const budgetsRoutes = require('./routes/budgets');
const erpRoutes = require('./routes/erp');
const aiRoutes = require('./routes/ai');
const sitemapRoutes = require('./routes/sitemap');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static uploaded files (logos, manuals, banners, PDFs)
const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sections', sectionsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/configs', configsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/erp', erpRoutes);
app.use('/api/mock-erp', erpRoutes); // Mock ERP listener
app.use('/api/ai', aiRoutes);
app.use('/sitemap.xml', sitemapRoutes);

// Serve Frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(distPath));
  
  // Wildcard client router handler using regex to match non-API routes
  app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Fallback Route for Development API
  app.get('/', (req, res) => {
    res.json({ message: 'ServSolda Backend API is running successfully in development mode!' });
  });
}

// Start server
app.listen(PORT, async () => {
  console.log(`Backend server is running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);

  // Set up recurring ERP synchronization cron task based on configuration
  try {
    const config = await prisma.config.findUnique({ where: { id: 'singleton' } });
    const intervalMinutes = config ? config.erpSyncMinutes : 15;
    
    console.log(`[Scheduler] Scheduling ERP sync every ${intervalMinutes} minute(s).`);
    
    // Setup cron scheduler: runs every X minutes
    nodeCron.schedule(`*/${intervalMinutes} * * * *`, () => {
      syncErpProducts();
    });

    // Run first sync immediately on startup
    syncErpProducts();
  } catch (error) {
    console.error('Error starting cron scheduler:', error.message);
  }
});
