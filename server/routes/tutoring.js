const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const sessions = db.prepare(`
    SELECT ts.*, tp.subject as teacher_subject, u.name as teacher_name
    FROM tutoring_sessions ts
    LEFT JOIN teacher_profiles tp ON tp.id = ts.teacher_id
    LEFT JOIN users u ON u.id = tp.user_id
    WHERE ts.user_id = ?
    ORDER BY ts.date DESC, ts.time_slot DESC
  `).all(req.user.id);
  res.json(sessions);
});

router.post('/', authMiddleware, (req, res) => {
  const { subject, level, date, time_slot, teacher_id, notes } = req.body;

  if (!subject || !level || !date || !time_slot || !teacher_id) {
    return res.status(400).json({ error: 'Completa materia, nivel, fecha, horario y maestro' });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (date < today) {
    return res.status(400).json({ error: 'La fecha debe ser hoy o posterior' });
  }

  const teacher = db.prepare(`
    SELECT tp.*, u.name FROM teacher_profiles tp JOIN users u ON u.id = tp.user_id
    WHERE tp.id = ? AND tp.status = 'approved'
  `).get(teacher_id);

  if (!teacher) return res.status(400).json({ error: 'Maestro no disponible' });

  const levels = JSON.parse(teacher.levels || '[]');
  const levelMap = { Primaria: 'primaria', Secundaria: 'secundaria', Preparatoria: 'preparatoria' };
  const levelKey = levelMap[level] || level.toLowerCase();
  if (levels.length && !levels.includes(levelKey)) {
    return res.status(400).json({ error: 'Este maestro no imparte asesorías en ese nivel' });
  }

  const conflict = db.prepare(`
    SELECT id FROM tutoring_sessions
    WHERE teacher_id = ? AND date = ? AND time_slot = ? AND status NOT IN ('cancelled', 'rejected')
  `).get(teacher_id, date, time_slot);

  if (conflict) {
    return res.status(409).json({ error: 'Este horario ya está ocupado. Elige otro horario u otro maestro.' });
  }

  const result = db.prepare(`
    INSERT INTO tutoring_sessions (user_id, subject, level, date, time_slot, advisor, teacher_id, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(req.user.id, subject, level, date, time_slot, teacher.name, teacher_id, notes || null);

  db.prepare(`INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)`)
    .run(req.user.id, 'Solicitud de asesoría enviada', `Tu solicitud con ${teacher.name} el ${date} está pendiente de confirmación.`);

  const admins = db.prepare(`SELECT id FROM users WHERE role = 'admin'`).all();
  for (const admin of admins) {
    db.prepare(`INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)`)
      .run(admin.id, 'Nueva solicitud de asesoría', `${teacher.name} — ${subject} (${level}) el ${date}.`);
  }

  const session = db.prepare('SELECT * FROM tutoring_sessions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(session);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const session = db.prepare('SELECT * FROM tutoring_sessions WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!session) return res.status(404).json({ error: 'Asesoría no encontrada' });

  db.prepare('UPDATE tutoring_sessions SET status = ? WHERE id = ?').run('cancelled', session.id);
  res.json({ ok: true });
});

module.exports = router;
