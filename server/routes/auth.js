const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, password, education_level } = req.body;
  if (!name || !email || !password || !education_level) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Este correo ya está registrado' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash, education_level, password_plain)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, email.toLowerCase(), hash, education_level, password);

  const userId = result.lastInsertRowid;

  db.prepare(`
    INSERT INTO notifications (user_id, title, body)
    VALUES (?, ?, ?)
  `).run(userId, '¡Bienvenido a Digital Academy!', 'Tu cuenta ha sido creada. Explora los cursos y comienza a aprender.');

  const token = jwt.sign({ id: userId, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });
  const user = db.prepare('SELECT id, name, email, education_level, level, role FROM users WHERE id = ?').get(userId);

  res.status(201).json({ token, user });
});

router.post('/register-teacher', (req, res) => {
  res.status(400).json({ error: 'Usa POST /api/teachers/register para registro de maestros' });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña requeridos' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, education_level: user.education_level, level: user.level, role: user.role || 'student' }
  });
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No autenticado' });
  try {
    const { id } = jwt.verify(header.slice(7), JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, education_level, level, role, created_at FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

module.exports = router;
