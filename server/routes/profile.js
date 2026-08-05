const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function getStudyHours(userId) {
  const row = db.prepare('SELECT COALESCE(SUM(minutes), 0) as total FROM study_sessions WHERE user_id = ?').get(userId);
  return Math.round(row.total / 60 * 10) / 10;
}

function getWeeklyActivity(userId) {
  const rows = db.prepare(`
    SELECT date(studied_at) as day, SUM(minutes) as minutes
    FROM study_sessions
    WHERE user_id = ? AND studied_at >= datetime('now', '-7 days')
    GROUP BY date(studied_at)
    ORDER BY day
  `).all(userId);

  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = rows.find(r => r.day === key);
    result.push({ day: days[d.getDay()], hours: found ? Math.round(found.minutes / 60 * 10) / 10 : 0 });
  }
  return result;
}

function getMonthlyActivity(userId) {
  const rows = db.prepare(`
    SELECT strftime('%W', studied_at) as week, SUM(minutes) as minutes
    FROM study_sessions
    WHERE user_id = ? AND studied_at >= datetime('now', '-28 days')
    GROUP BY week
    ORDER BY week
  `).all(userId);

  return rows.map((r, i) => ({ week: `Sem ${i + 1}`, hours: Math.round(r.minutes / 60 * 10) / 10 }));
}

function calcUserLevel(userId) {
  const hours = getStudyHours(userId);
  const completed = db.prepare(`
    SELECT COUNT(*) as c FROM enrollments WHERE user_id = ? AND progress_percent = 100
  `).get(userId).c;
  return Math.max(1, Math.floor(hours / 10) + completed);
}

function tickPetVitality(userId) {
  const pet = db.prepare('SELECT * FROM user_pets WHERE user_id = ? AND unlocked = 1').get(userId);
  if (!pet) return pet;

  const now = Date.now();
  const last = pet.last_update ? new Date(pet.last_update.replace(' ', 'T') + 'Z').getTime() : now;
  const minutes = Math.min(Math.max((now - last) / 60000, 0), 180);

  if (minutes < 0.5) return pet;

  let hunger = Math.max(0, (pet.hunger ?? 100) - minutes * 0.8);
  let energy = Math.max(0, (pet.energy ?? 100) - minutes * 0.5);
  let sleep = Math.max(0, (pet.sleep ?? 100) - minutes * 0.6);
  let happiness = pet.happiness ?? 50;

  if (hunger < 30) happiness = Math.max(0, happiness - Math.floor(minutes / 5));
  if (sleep < 20) energy = Math.min(100, energy + minutes * 0.3);

  db.prepare(`
    UPDATE user_pets SET hunger = ?, energy = ?, sleep = ?, happiness = ?, last_update = datetime('now')
    WHERE user_id = ?
  `).run(Math.round(hunger), Math.round(energy), Math.round(sleep), Math.round(happiness), userId);

  return db.prepare('SELECT * FROM user_pets WHERE user_id = ?').get(userId);
}

router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const user = db.prepare('SELECT id, name, email, education_level, level, created_at FROM users WHERE id = ?').get(userId);

  const enrollments = db.prepare(`
    SELECT e.*, c.slug, c.title, c.level, c.emoji, c.lesson_count, c.duration_hours
    FROM enrollments e JOIN courses c ON c.id = e.course_id
    WHERE e.user_id = ?
    ORDER BY e.last_accessed DESC NULLS LAST, e.enrolled_at DESC
  `).all(userId);

  const totalCourses = enrollments.length;
  const avgProgress = totalCourses > 0
    ? Math.round(enrollments.reduce((s, e) => s + e.progress_percent, 0) / totalCourses)
    : 0;
  const studyHours = getStudyHours(userId);
  const level = calcUserLevel(userId);

  if (level !== user.level) {
    db.prepare('UPDATE users SET level = ? WHERE id = ?').run(level, userId);
    user.level = level;
  }

  const certificates = db.prepare(`
    SELECT cert.*, c.title, c.level
    FROM certificates cert JOIN courses c ON c.id = cert.course_id
    WHERE cert.user_id = ?
    ORDER BY cert.issued_at DESC
  `).all(userId);

  const favorites = db.prepare(`
    SELECT f.*, c.slug, c.title, c.level, c.emoji, c.lesson_count,
      COALESCE(e.progress_percent, 0) as progress_percent
    FROM favorites f JOIN courses c ON c.id = f.course_id
    LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = f.user_id
    WHERE f.user_id = ?
  `).all(userId);

  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
  `).all(userId);

  const achievements = db.prepare(`
    SELECT * FROM achievements WHERE user_id = ? ORDER BY earned_at DESC LIMIT 10
  `).all(userId);

  const tutoring = db.prepare(`
    SELECT * FROM tutoring_sessions WHERE user_id = ? ORDER BY date DESC, time_slot DESC LIMIT 10
  `).all(userId);

  let pet = db.prepare('SELECT * FROM user_pets WHERE user_id = ?').get(userId);
  if (pet?.unlocked) pet = tickPetVitality(userId) || pet;

  res.json({
    user,
    stats: {
      progress: avgProgress,
      courses: totalCourses,
      studyHours,
      level
    },
    enrollments,
    certificates,
    favorites,
    notifications,
    achievements,
    tutoring,
    pet: pet || { unlocked: 0, happiness: 0, food_count: 0, name: 'Búho', pet_type: 'owl' },
    weeklyActivity: getWeeklyActivity(userId),
    monthlyActivity: getMonthlyActivity(userId)
  });
});

router.put('/settings', authMiddleware, (req, res) => {
  const { name, email } = req.body;
  const userId = req.user.id;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nombre y correo son requeridos' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase(), userId);
  if (existing) {
    return res.status(409).json({ error: 'Este correo ya está en uso' });
  }

  db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')
    .run(name, email.toLowerCase(), userId);

  const user = db.prepare('SELECT id, name, email, education_level, level FROM users WHERE id = ?').get(userId);
  res.json(user);
});

router.put('/notifications/:id/read', authMiddleware, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  res.json({ ok: true });
});

router.put('/notifications/read-all', authMiddleware, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
});

router.post('/favorites/:courseId', authMiddleware, (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
  if (!course) return res.status(404).json({ error: 'Curso no encontrado' });

  db.prepare('INSERT OR IGNORE INTO favorites (user_id, course_id) VALUES (?, ?)')
    .run(req.user.id, courseId);
  res.json({ ok: true });
});

router.delete('/favorites/:courseId', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND course_id = ?')
    .run(req.user.id, parseInt(req.params.courseId, 10));
  res.json({ ok: true });
});

const PET_TYPES = { owl: 'Búho', wolf: 'Lobo', dinosaur: 'Dino' };

router.post('/pet/choose', authMiddleware, (req, res) => {
  const { pet_type, name } = req.body;
  if (!PET_TYPES[pet_type]) {
    return res.status(400).json({ error: 'Elige búho, lobo o dinosaurio' });
  }

  const pet = db.prepare('SELECT * FROM user_pets WHERE user_id = ?').get(req.user.id);
  if (!pet?.pending_choice) {
    return res.status(400).json({ error: 'No tienes una mascota pendiente de elegir' });
  }

  const petName = (name && name.trim()) || PET_TYPES[pet_type];
  db.prepare(`
    UPDATE user_pets SET pet_type = ?, name = ?, unlocked = 1, pending_choice = 0, unlocked_at = datetime('now')
    WHERE user_id = ?
  `).run(pet_type, petName, req.user.id);

  const updated = db.prepare('SELECT * FROM user_pets WHERE user_id = ?').get(req.user.id);
  db.prepare(`INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)`)
    .run(req.user.id, '¡Mascota elegida!', `${petName} será tu compañero de estudio.`);

  res.json({ ok: true, pet: updated });
});

function certificateHtml(cert) {
  const date = new Date(cert.issued_at + (cert.issued_at.includes('T') ? '' : 'T12:00:00'));
  const dateStr = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  const levelLabel = cert.level.charAt(0).toUpperCase() + cert.level.slice(1);
  const scoreLabel = cert.final_score != null ? `${cert.final_score}/10` : '—';
  const certId = `DA-${cert.id}-${cert.course_id}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Certificado — ${cert.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', Arial, sans-serif;
      background: linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #312E81 100%);
      min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px;
    }
    .cert-wrap {
      position: relative; max-width: 920px; width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #FDE68A, #F59E0B, #2563EB, #7C3AED);
      border-radius: 20px;
      box-shadow: 0 32px 80px rgba(0,0,0,.4);
    }
    .cert {
      background: linear-gradient(180deg, #FFFBEB 0%, #FFFFFF 40%, #F8FAFC 100%);
      border-radius: 14px;
      padding: 56px 64px 48px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .cert::before {
      content: '';
      position: absolute; inset: 16px;
      border: 2px solid rgba(37,99,235,.2);
      border-radius: 10px;
      pointer-events: none;
    }
    .cert-watermark {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      font-size: 8rem; opacity: 0.04; pointer-events: none;
    }
    .cert-header { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px; }
    .cert-logo { font-size: 2.5rem; }
    .brand { color: #2563EB; font-size: .8rem; letter-spacing: 3px; text-transform: uppercase; font-weight: 600; }
    h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 2.4rem; color: #0F172A; margin: 20px 0 6px;
    }
    .cert-tagline { color: #64748B; font-size: .95rem; margin-bottom: 36px; }
    .cert-label { color: #94A3B8; font-size: .85rem; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px; }
    .name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 2.2rem; color: #1D4ED8;
      border-bottom: 3px solid #DBEAFE;
      display: inline-block; padding: 0 24px 10px; margin-bottom: 28px;
    }
    .course {
      font-size: 1.35rem; color: #1E293B; font-weight: 600; margin-bottom: 28px;
    }
    .score-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, #FEF3C7, #FDE68A);
      border: 2px solid #F59E0B; border-radius: 999px;
      padding: 10px 24px; font-weight: 700; color: #92400E; margin-bottom: 28px;
    }
    .meta-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
      margin-top: 32px; padding-top: 28px; border-top: 1px solid #E2E8F0;
    }
    .meta-item { text-align: center; }
    .meta-item strong { display: block; font-size: .75rem; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .meta-item span { font-size: .95rem; color: #334155; font-weight: 500; }
    .seal {
      position: absolute; bottom: 32px; right: 48px;
      width: 80px; height: 80px;
      background: radial-gradient(circle, #2563EB, #1E40AF);
      border-radius: 50%; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; box-shadow: 0 8px 24px rgba(37,99,235,.4);
      border: 3px solid #DBEAFE;
    }
    .cert-id { margin-top: 20px; font-size: .75rem; color: #94A3B8; font-family: monospace; }
    @media print { body { background: #fff; } .cert-wrap { box-shadow: none; padding: 0; background: none; } }
  </style>
</head>
<body>
  <div class="cert-wrap">
    <div class="cert">
      <div class="cert-watermark">🎓</div>
      <div class="cert-header">
        <span class="cert-logo">🎓</span>
        <div><div class="brand">Digital Academy</div></div>
      </div>
      <h1>Certificado de Finalización</h1>
      <p class="cert-tagline">Reconocimiento oficial de logro académico</p>
      <p class="cert-label">Se otorga el presente certificado a</p>
      <div class="name">${cert.user_name}</div>
      <p class="cert-label">Por haber completado satisfactoriamente</p>
      <div class="course">${cert.title}</div>
      <div class="score-badge">⭐ Calificación final: ${scoreLabel}</div>
      <div class="meta-grid">
        <div class="meta-item"><strong>Nivel</strong><span>${levelLabel}</span></div>
        <div class="meta-item"><strong>Programa</strong><span>${cert.education_level}</span></div>
        <div class="meta-item"><strong>Fecha</strong><span>${dateStr}</span></div>
      </div>
      <div class="seal">✦</div>
      <p class="cert-id">ID de verificación: ${certId}</p>
    </div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

router.get('/certificates/:id/download', authMiddleware, (req, res) => {
  const certId = parseInt(req.params.id, 10);
  const cert = db.prepare(`
    SELECT cert.*, c.title, c.level, c.id as course_id, u.name as user_name, u.education_level
    FROM certificates cert
    JOIN courses c ON c.id = cert.course_id
    JOIN users u ON u.id = cert.user_id
    WHERE cert.id = ? AND cert.user_id = ?
  `).get(certId, req.user.id);

  if (!cert) return res.status(404).json({ error: 'Certificado no encontrado' });

  const safeName = cert.title.replace(/[^\w\sáéíóúñÁÉÍÓÚÑ-]/g, '').replace(/\s+/g, '-');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="certificado-${safeName}.html"`);
  res.send(certificateHtml(cert));
});

module.exports = router;
