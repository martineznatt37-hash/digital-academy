const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { teacherMiddleware } = require('../middleware/roles');

const router = express.Router();

router.get('/approved', (_req, res) => {
  const teachers = db.prepare(`
    SELECT tp.id, tp.subject, tp.levels, tp.bio, u.name, u.email
    FROM teacher_profiles tp JOIN users u ON u.id = tp.user_id
    WHERE tp.status = 'approved'
    ORDER BY u.name
  `).all().map(t => ({
    ...t,
    levels: JSON.parse(t.levels || '[]')
  }));
  res.json(teachers);
});

router.get('/dashboard', authMiddleware, teacherMiddleware, (req, res) => {
  const profile = db.prepare(`
    SELECT tp.*, u.name, u.email
    FROM teacher_profiles tp JOIN users u ON u.id = tp.user_id
    WHERE tp.user_id = ?
  `).get(req.user.id);

  if (!profile) {
    return res.status(404).json({ error: 'No tienes un perfil de maestro registrado' });
  }

  const levels = JSON.parse(profile.levels || '[]');
  const today = new Date().toISOString().slice(0, 10);

  const sessions = db.prepare(`
    SELECT ts.*, u.name as student_name, u.email as student_email
    FROM tutoring_sessions ts
    JOIN users u ON u.id = ts.user_id
    WHERE ts.teacher_id = ?
    ORDER BY ts.date DESC, ts.time_slot DESC
  `).all(profile.id);

  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 15
  `).all(req.user.id);

  const stats = {
    total: sessions.length,
    pending: sessions.filter(s => s.status === 'pending').length,
    confirmed: sessions.filter(s => s.status === 'confirmed').length,
    upcoming: sessions.filter(s => s.status === 'confirmed' && s.date >= today).length,
    completed: sessions.filter(s => s.status === 'confirmed' && s.date < today).length
  };

  res.json({
    user: { id: req.user.id, name: profile.name, email: profile.email, role: req.user.role },
    profile: { ...profile, levels },
    sessions,
    stats: {
      ...stats,
      registeredStudents: countRegisteredStudents()
    },
    notifications
  });
});

router.get('/users', authMiddleware, teacherMiddleware, (_req, res) => {
  try {
    const users = db.prepare(`
      SELECT
        u.id, u.name, u.email, u.education_level, u.level,
        COALESCE(u.role, 'student') as role, u.created_at,
        u.password_plain as password,
        (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) as enrollments
      FROM users u
      WHERE u.role = 'student' OR u.role IS NULL
      ORDER BY u.created_at DESC
    `).all().map(u => ({
      ...u,
      password: u.password || '—'
    }));
    res.json(users);
  } catch (err) {
    console.error('Error loading users:', err.message);
    res.status(500).json({ error: 'Error al cargar usuarios' });
  }
});

function countRegisteredStudents() {
  return db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'student' OR role IS NULL`).get().c;
}

router.post('/register', (req, res) => {
  const { name, email, password, subject, levels, bio } = req.body;

  if (!name || !email || !password || !subject || !levels?.length) {
    return res.status(400).json({ error: 'Completa nombre, correo, contraseña, materia y al menos un nivel' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const emailLower = email.toLowerCase();
  const existing = db.prepare('SELECT id, role FROM users WHERE email = ?').get(emailLower);
  if (existing) {
    return res.status(409).json({ error: 'Este correo ya está registrado' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const userResult = db.prepare(`
    INSERT INTO users (name, email, password_hash, education_level, role, password_plain)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, emailLower, hash, 'Maestro', 'teacher', password);

  const userId = userResult.lastInsertRowid;
  db.prepare(`
    INSERT INTO teacher_profiles (user_id, subject, levels, bio, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(userId, subject, JSON.stringify(levels), bio || null);

  const admins = db.prepare(`SELECT id FROM users WHERE role = 'admin'`).all();
  for (const admin of admins) {
    db.prepare(`INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)`)
      .run(admin.id, 'Nuevo registro de maestro', `${name} solicitó impartir asesorías de ${subject}.`);
  }

  res.status(201).json({
    ok: true,
    message: 'Registro enviado. Un administrador revisará tu solicitud pronto.'
  });
});

module.exports = router;
