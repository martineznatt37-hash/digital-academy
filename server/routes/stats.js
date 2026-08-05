const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/public', (_req, res) => {
  const activeFromEnrollments = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as c FROM enrollments
    WHERE last_accessed >= datetime('now', '-30 days')
  `).get().c;

  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const activeStudents = Math.max(activeFromEnrollments, totalUsers > 0 ? totalUsers : 0);

  const coursesAvailable = db.prepare(`
    SELECT COUNT(*) as c FROM courses WHERE is_active IS NULL OR is_active = 1
  `).get().c;

  const reviewStats = db.prepare(`
    SELECT AVG(rating) as avg, COUNT(*) as count FROM course_reviews
  `).get();

  const completedCourses = db.prepare(`
    SELECT COUNT(*) as c FROM enrollments WHERE progress_percent = 100
  `).get().c;

  const satisfaction = reviewStats.count > 0
    ? Math.round((reviewStats.avg / 5) * 100)
    : null;

  res.json({
    activeStudents,
    coursesAvailable,
    satisfaction,
    reviewCount: reviewStats.count,
    completedCourses,
    totalUsers
  });
});

module.exports = router;
