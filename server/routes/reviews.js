const express = require('express');
const db = require('../db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name, u.education_level, c.title as course_title, c.level as course_level
    FROM course_reviews r
    JOIN users u ON u.id = r.user_id
    JOIN courses c ON c.id = r.course_id
    ORDER BY r.created_at DESC
    LIMIT 12
  `).all();

  res.json(reviews.map(r => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    userName: r.user_name,
    educationLevel: r.education_level,
    courseTitle: r.course_title,
    courseLevel: r.course_level,
    createdAt: r.created_at
  })));
});

router.post('/', authMiddleware, (req, res) => {
  const { course_id, rating, comment } = req.body;
  if (!course_id || !rating || !comment?.trim()) {
    return res.status(400).json({ error: 'Curso, calificación y comentario son requeridos' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'La calificación debe ser de 1 a 5' });
  }

  const enrollment = db.prepare(`
    SELECT progress_percent FROM enrollments WHERE user_id = ? AND course_id = ?
  `).get(req.user.id, course_id);

  if (!enrollment || enrollment.progress_percent < 100) {
    return res.status(403).json({ error: 'Debes completar el curso al 100% para dejar tu opinión' });
  }

  const existing = db.prepare('SELECT id FROM course_reviews WHERE user_id = ? AND course_id = ?')
    .get(req.user.id, course_id);

  if (existing) {
    db.prepare('UPDATE course_reviews SET rating = ?, comment = ?, created_at = datetime(\'now\') WHERE id = ?')
      .run(rating, comment.trim(), existing.id);
  } else {
    db.prepare('INSERT INTO course_reviews (user_id, course_id, rating, comment) VALUES (?, ?, ?, ?)')
      .run(req.user.id, course_id, rating, comment.trim());
  }

  const course = db.prepare('SELECT title FROM courses WHERE id = ?').get(course_id);
  db.prepare(`INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)`)
    .run(req.user.id, '¡Gracias por tu opinión!', `Tu reseña de "${course.title}" fue publicada.`);

  res.json({ ok: true });
});

router.get('/course/:courseId/mine', authMiddleware, (req, res) => {
  const review = db.prepare(`
    SELECT * FROM course_reviews WHERE user_id = ? AND course_id = ?
  `).get(req.user.id, parseInt(req.params.courseId, 10));
  res.json(review || null);
});

module.exports = router;
