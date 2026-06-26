const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../models/db');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'superservo_secret_key_2026';

// Manual Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, document, phone, address } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Campos obrigatórios: email, password, name' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        document: document || null,
        phone: phone || null,
        address: address || null,
        role: 'CLIENT',
      },
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        document: user.document,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Manual Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        document: user.document,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Google OAuth Login / Register Mock-up Endpoint (as per user instructions, placeholder instructions)
router.post('/google', async (req, res) => {
  try {
    const { email, name, googleToken } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email e nome são obrigatórios para login Google' });
    }

    // Secure verification of googleToken would normally be done using google-auth-library:
    // const ticket = await client.verifyIdToken({ idToken: googleToken, audience: CLIENT_ID });
    // const payload = ticket.getPayload();
    // const email = payload.email;
    // For now, this is a fully functioning simulator that uses the payload sent by Google Frontend Identity API.
    
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Register with random password for Google users
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: randomPassword,
          role: 'CLIENT',
        },
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        document: user.document,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao autenticar com Google' });
  }
});

// Me Profile Update
router.get('/me', authMiddleware, async (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      document: req.user.document,
      phone: req.user.phone,
      address: req.user.address,
    },
  });
});

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { name, document, phone, address } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name || req.user.name,
        document: document !== undefined ? document : req.user.document,
        phone: phone !== undefined ? phone : req.user.phone,
        address: address !== undefined ? address : req.user.address,
      },
    });
    return res.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        document: updated.document,
        phone: updated.phone,
        address: updated.address,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

module.exports = router;
