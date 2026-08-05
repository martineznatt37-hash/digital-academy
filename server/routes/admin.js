const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/roles');

const router = express.Router();

function usersHasPasswordPlain() {
  return db.prepare('PRAGMA table_info(users)').all().some(c => c.name === 'password_plain');
}

function ensurePasswordPlainColumn() {
  if (!usersHasPasswordPlain()) {
    db.exec('ALTER TABLE users ADD COLUMN password_plain TEXT');
    db.prepare(`UPDATE users SET password_plain = 'demo1234' WHERE email = 'demo@digitalacademy.com'`).run();
    db.prepare(`UPDATE users SET password_plain = '1234' WHERE email = 'admin@gmail.com'`).run();
  }
}

router.get('/users', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    ensurePasswordPlainColumn();
    const passwordSelect = usersHasPasswordPlain() ? 'u.password_plain' : "NULL";

    const users = db.prepare(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.education_level,
        u.level,
        COALESCE(u.role, 'student') as role,
        u.created_at,
        ${passwordSelect} as password,
        (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) as enrollments,
        (SELECT COALESCE(SUM(minutes), 0) / 60.0 FROM study_sessions s WHERE s.user_id = u.id) as study_hours
      FROM users u
      ORDER BY datetime(u.created_at) DESC, u.id DESC
    `).all().map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      education_level: u.education_level,
      level: u.level,
      role: u.role || 'student',
      created_at: u.created_at,
      password: u.password || '—',
      enrollments: u.enrollments || 0,
      study_hours: Math.round((u.study_hours || 0) * 10) / 10
    }));

    res.json(users);
  } catch (err) {
    console.error('GET /admin/users error:', err.message);
    res.status(500).json({ error: 'No se pudieron cargar los usuarios' });
  }
});

router.get('/teachers', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const teachers = db.prepare(`
      SELECT tp.*, u.name, u.email,
        ${usersHasPasswordPlain() ? 'u.password_plain' : 'NULL'} as password
      FROM teacher_profiles tp JOIN users u ON u.id = tp.user_id
      ORDER BY tp.created_at DESC
    `).all().map(t => ({
      ...t,
      levels: JSON.parse(t.levels || '[]'),
      password: t.password || '—'
    }));
    res.json(teachers);
  } catch (err) {
    console.error('GET /admin/teachers error:', err.message);
    res.status(500).json({ error: 'No se pudieron cargar los maestros' });
  }
});

router.put('/teachers/:id/approve', authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const tp = db.prepare('SELECT * FROM teacher_profiles WHERE id = ?').get(id);
  if (!tp) return res.status(404).json({ error: 'Registro no encontrado' });

  db.prepare('UPDATE teacher_profiles SET status = ? WHERE id = ?').run('approved', id);
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run('teacher', tp.user_id);
  db.prepare(`INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)`)
    .run(tp.user_id, '¡Registro aprobado!', 'Ya puedes impartir asesorías en Digital Academy.');

  res.json({ ok: true });
});

router.put('/teachers/:id/reject', authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const tp = db.prepare('SELECT * FROM teacher_profiles WHERE id = ?').get(id);
  if (!tp) return res.status(404).json({ error: 'Registro no encontrado' });

  db.prepare('UPDATE teacher_profiles SET status = ? WHERE id = ?').run('rejected', id);
  db.prepare(`INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)`)
    .run(tp.user_id, 'Registro no aprobado', 'Tu solicitud de maestro fue rechazada. Contacta al administrador.');

  res.json({ ok: true });
});

router.get('/tutoring', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT ts.*, u.name as student_name, u.email as student_email,
        tp.subject as teacher_subject, tu.name as teacher_name
      FROM tutoring_sessions ts
      JOIN users u ON u.id = ts.user_id
      LEFT JOIN teacher_profiles tp ON tp.id = ts.teacher_id
      LEFT JOIN users tu ON tu.id = tp.user_id
      ORDER BY ts.date DESC, ts.time_slot DESC
    `).all();
    res.json(sessions);
  } catch (err) {
    console.error('GET /admin/tutoring error:', err.message);
    res.status(500).json({ error: 'No se pudieron cargar las asesorías' });
  }
});

router.put('/tutoring/:id/accept', authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const session = db.prepare('SELECT * FROM tutoring_sessions WHERE id = ?').get(id);
  if (!session) return res.status(404).json({ error: 'Asesoría no encontrada' });

  db.prepare('UPDATE tutoring_sessions SET status = ? WHERE id = ?').run('confirmed', id);
  db.prepare(`INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)`)
    .run(session.user_id, 'Asesoría confirmada', `Tu asesoría del ${session.date} a las ${session.time_slot} fue aceptada.`);

  if (session.teacher_id) {
    const tp = db.prepare('SELECT user_id FROM teacher_profiles WHERE id = ?').get(session.teacher_id);
    if (tp) {
      db.prepare(`INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)`)
        .run(tp.user_id, 'Nueva asesoría asignada', `Tienes una asesoría el ${session.date} a las ${session.time_slot}.`);
    }
  }

  res.json({ ok: true });
});

router.put('/tutoring/:id/reject', authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const session = db.prepare('SELECT * FROM tutoring_sessions WHERE id = ?').get(id);
  if (!session) return res.status(404).json({ error: 'Asesoría no encontrada' });

  db.prepare('UPDATE tutoring_sessions SET status = ? WHERE id = ?').run('cancelled', id);
  db.prepare(`INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)`)
    .run(session.user_id, 'Asesoría rechazada', `Tu solicitud del ${session.date} no pudo confirmarse.`);

  res.json({ ok: true });
});

router.get('/stats', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const stats = {
      pendingTeachers: db.prepare(`SELECT COUNT(*) as c FROM teacher_profiles WHERE status = 'pending'`).get().c,
      approvedTeachers: db.prepare(`SELECT COUNT(*) as c FROM teacher_profiles WHERE status = 'approved'`).get().c,
      pendingTutoring: db.prepare(`SELECT COUNT(*) as c FROM tutoring_sessions WHERE status = 'pending'`).get().c,
      totalStudents: db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'student' OR role IS NULL`).get().c,
      totalUsers: db.prepare(`SELECT COUNT(*) as c FROM users`).get().c,
      totalTutoring: db.prepare(`SELECT COUNT(*) as c FROM tutoring_sessions`).get().c
    };
    res.json(stats);
  } catch (err) {
    console.error('GET /admin/stats error:', err.message);
    res.status(500).json({ error: 'No se pudieron cargar las estadísticas' });
  }
});

module.exports = router;
