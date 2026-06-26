const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = process.env.UPLOADS_PATH || path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // accept images or pdfs
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo inválido. Apenas imagens e PDFs são permitidos.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

router.post('/', upload.single('file'), (req, res) => {
  try {
    console.log('req.file:', req.file, 'req.files:', req.files);
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }
    // Return relative url path accessible via express static serving
    const fileUrl = `/uploads/${req.file.filename}`;
    return res.status(201).json({
      url: fileUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
  }
});

module.exports = router;
