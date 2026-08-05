const express = require('express');
const { createExamSession, gradeExamSession } = require('../exam-utils');
const db = require('../db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { eduToLevel } = require('../course-images');

const router = express.Router();
const PASS_SCORE = 8;
const LESSONS_PER_MODULE = 4;

function modNum(orderNum) { return Math.ceil(orderNum / LESSONS_PER_MODULE); }

function getModuleProgressMap(userId, courseId) {
  const rows = db.prepare(`
    SELECT module_num, passed, exam_score FROM module_progress
    WHERE user_id = ? AND course_id = ?
  `).all(userId, courseId);
  return Object.fromEntries(rows.map(r => [r.module_num, r]));
}

function getLessonProgressMap(userId, courseId) {
  const rows = db.prepare(`
    SELECT lp.lesson_id, lp.viewed, lp.passed, lp.exam_score
    FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id
    WHERE lp.user_id = ? AND l.course_id = ?
  `).all(userId, courseId);
  return Object.fromEntries(rows.map(r => [r.lesson_id, r]));
}

function isModuleUnlocked(moduleProgress, mod) {
  if (mod === 1) return true;
  return !!(moduleProgress[mod - 1]?.passed);
}

function isExamLesson(lesson, allLessons) {
  const mod = lesson.module_num || modNum(lesson.order_num);
  const inMod = allLessons.filter(l => (l.module_num || modNum(l.order_num)) === mod);
  return lesson.id === inMod[inMod.length - 1].id;
}

function syncModuleExam(course, mod) {
  const { getQuestionPool } = require('../exam-questions');
  const lessons = db.prepare(`
    SELECT id, title, content, order_num, module_num FROM lessons WHERE course_id = ? ORDER BY order_num
  `).all(course.id);
  const modLessons = lessons.filter(l => (l.module_num || modNum(l.order_num)) === mod);
  if (modLessons.length === 0) return;
  const lastLesson = modLessons[modLessons.length - 1];
  const studyLessons = modLessons.slice(0, Math.max(modLessons.length - 1, 1));

  const existing = db.prepare('SELECT id FROM exams WHERE course_id = ? AND module_num = ?').get(course.id, mod);
  let examId = existing?.id;
  if (!examId) {
    const r = db.prepare('INSERT INTO exams (course_id, module_num, lesson_id, title) VALUES (?, ?, ?, ?)')
      .run(course.id, mod, lastLesson.id, `Examen: ${course.title}`);
    examId = r.lastInsertRowid;
  }
  repopulateExamQuestions(examId, course.slug, mod, studyLessons);
}

function repopulateExamQuestions(examId, slug, mod, studyLessons) {
  const { getQuestionPool } = require('../exam-questions');
  if (!studyLessons) {
    const exam = db.prepare('SELECT course_id FROM exams WHERE id = ?').get(examId);
    studyLessons = db.prepare(`
      SELECT title, content, order_num, module_num FROM lessons WHERE course_id = ? AND module_num = ?
      ORDER BY order_num
    `).all(exam.course_id, mod).slice(0, 3);
  }
  db.prepare('DELETE FROM exam_questions WHERE exam_id = ?').run(examId);
  const insertQ = db.prepare(`
    INSERT INTO exam_questions (exam_id, question, option_a, option_b, option_c, option_d, correct_option, order_num)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const questions = getQuestionPool(slug, mod, studyLessons);
  const seen = new Set();
  let order = 1;
  for (const q of questions) {
    const key = q.q.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    insertQ.run(examId, q.q, q.o[0], q.o[1], q.o[2], q.o[3], q.c, order++);
  }
}

function getCourseFinalScore(userId, courseId) {
  const rows = db.prepare(`
    SELECT exam_score FROM module_progress
    WHERE user_id = ? AND course_id = ? AND passed = 1
  `).all(userId, courseId);
  if (rows.length === 0) return null;
  const avg = rows.reduce((s, r) => s + r.exam_score, 0) / rows.length;
  return Math.round(avg * 10) / 10;
}

function allContentLessonsViewed(mod, allLessons, lessonProgress) {
  const modLessons = allLessons.filter(l => (l.module_num || modNum(l.order_num)) === mod);
  const contentLessons = modLessons.filter(l => !isExamLesson(l, allLessons));
  if (contentLessons.length === 0) return true;
  return contentLessons.every(l => lessonProgress[l.id]?.viewed || lessonProgress[l.id]?.passed);
}

function isLessonUnlocked(lesson, allLessons, moduleProgress, lessonProgress) {
  const mod = lesson.module_num || modNum(lesson.order_num);
  if (!isModuleUnlocked(moduleProgress, mod)) return false;

  if (isExamLesson(lesson, allLessons)) {
    if (moduleProgress[mod]?.passed) return true;
    return allContentLessonsViewed(mod, allLessons, lessonProgress);
  }

  if (lesson.order_num === 1) return true;

  const prev = allLessons.find(l => l.order_num === lesson.order_num - 1);
  if (!prev) return true;

  const prevMod = prev.module_num || modNum(prev.order_num);
  if (prevMod < mod) return isModuleUnlocked(moduleProgress, mod);

  const prevProg = lessonProgress[prev.id];
  return !!(prevProg?.viewed || prevProg?.passed);
}

function updateEnrollmentProgress(userId, courseId) {
  const total = db.prepare('SELECT COUNT(DISTINCT module_num) as c FROM lessons WHERE course_id = ?').get(courseId).c;
  const completed = db.prepare(`
    SELECT COUNT(*) as c FROM module_progress
    WHERE user_id = ? AND course_id = ? AND passed = 1
  `).get(userId, courseId).c;

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const completedAt = progress === 100 ? new Date().toISOString() : null;

  db.prepare(`
    UPDATE enrollments SET progress_percent = ?, completed_at = ?, last_accessed = datetime('now')
    WHERE user_id = ? AND course_id = ?
  `).run(progress, completedAt, userId, courseId);

  if (progress === 100) {
    const finalScore = getCourseFinalScore(userId, courseId);
    db.prepare('INSERT OR IGNORE INTO certificates (user_id, course_id, final_score) VALUES (?, ?, ?)')
      .run(userId, courseId, finalScore);
    db.prepare('UPDATE certificates SET final_score = ? WHERE user_id = ? AND course_id = ?')
      .run(finalScore, userId, courseId);
    db.prepare('UPDATE enrollments SET final_score = ? WHERE user_id = ? AND course_id = ?')
      .run(finalScore, userId, courseId);
    const course = db.prepare('SELECT title FROM courses WHERE id = ?').get(courseId);
    db.prepare(`INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)`)
      .run(userId, '¡Certificado obtenido!', `Completaste "${course.title}" con calificación ${finalScore}/10. Descárgalo en Mis certificados.`);
    db.prepare(`INSERT OR IGNORE INTO achievements (user_id, type, title) VALUES (?, 'certificate', ?)`)
      .run(userId, `Certificado: ${course.title}`);
  }

  const avgMinutes = db.prepare('SELECT AVG(duration_minutes) as m FROM lessons WHERE course_id = ?').get(courseId).m || 30;
  db.prepare('INSERT INTO study_sessions (user_id, course_id, minutes) VALUES (?, ?, ?)').run(userId, courseId, avgMinutes);

  const totalHours = db.prepare('SELECT COALESCE(SUM(minutes),0)/60 as h FROM study_sessions WHERE user_id = ?').get(userId).h;
  const newLevel = Math.max(1, Math.floor(totalHours / 10) + db.prepare('SELECT COUNT(*) as c FROM enrollments WHERE user_id = ? AND progress_percent = 100').get(userId).c);
  const currentLevel = db.prepare('SELECT level FROM users WHERE id = ?').get(userId).level;
  if (newLevel > currentLevel) {
    db.prepare('UPDATE users SET level = ? WHERE id = ?').run(newLevel, userId);
    db.prepare(`INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)`)
      .run(userId, `¡Subiste al nivel ${newLevel}!`, 'Sigue estudiando.');
  }
  return progress;
}

function feedPet(userId, correctCount) {
  const pet = db.prepare('SELECT * FROM user_pets WHERE user_id = ? AND unlocked = 1').get(userId);
  if (!pet) return { fed: false, pet: null };
  const newFood = pet.food_count + correctCount;
  const newHappiness = Math.min(100, (pet.happiness ?? 50) + correctCount * 10);
  const newHunger = Math.min(100, (pet.hunger ?? 100) + correctCount * 15);
  const newEnergy = Math.min(100, (pet.energy ?? 100) + correctCount * 8);
  db.prepare(`
    UPDATE user_pets SET food_count = ?, happiness = ?, hunger = ?, energy = ?, last_update = datetime('now')
    WHERE user_id = ?
  `).run(newFood, newHappiness, newHunger, newEnergy, userId);
  return { fed: true, pet: db.prepare('SELECT * FROM user_pets WHERE user_id = ?').get(userId) };
}

function tryUnlockPet(userId, moduleNum, score) {
  if (moduleNum !== 1 || score < 10) return { unlocked: false, pendingChoice: false, pet: null };
  let pet = db.prepare('SELECT * FROM user_pets WHERE user_id = ?').get(userId);
  if (pet?.unlocked) return { unlocked: false, pendingChoice: false, pet };

  db.prepare(`
    INSERT INTO user_pets (user_id, pet_type, name, happiness, food_count, unlocked, pending_choice, unlocked_at)
    VALUES (?, '', 'Mi mascota', 100, 0, 0, 1, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET pending_choice = 1, happiness = 100
  `).run(userId);

  db.prepare(`INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)`)
    .run(userId, '¡Mascota desbloqueada!', 'Obtuviste 10/10. Elige tu mascota: búho, lobo o dinosaurio.');

  return { unlocked: false, pendingChoice: true, pet: db.prepare('SELECT * FROM user_pets WHERE user_id = ?').get(userId) };
}

function getCourseLevelsForUser(user) {
  if (!user?.id) return null;
  const row = db.prepare('SELECT education_level FROM users WHERE id = ?').get(user.id);
  const level = eduToLevel[row?.education_level];
  if (!level) return null;
  return [level];
}

router.get('/', optionalAuth, (req, res) => {
  let courses = db.prepare('SELECT * FROM courses WHERE is_active IS NULL OR is_active = 1 ORDER BY level, title').all();
  const allowed = getCourseLevelsForUser(req.user);

  if (allowed) {
    courses = courses.filter(c => allowed.includes(c.level));
  }

  if (req.user) {
    const enrollments = db.prepare('SELECT course_id, progress_percent FROM enrollments WHERE user_id = ?').all(req.user.id);
    const map = Object.fromEntries(enrollments.map(e => [e.course_id, e.progress_percent]));
    return res.json(courses.map(c => ({
      ...c,
      enrolled: map[c.id] !== undefined,
      progress_percent: map[c.id] ?? 0,
      forYourLevel: allowed ? allowed.includes(c.level) : true
    })));
  }
  res.json(courses.map(c => ({ ...c, enrolled: false, progress_percent: 0, forYourLevel: true })));
});

router.get('/search', optionalAuth, (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  let courses = db.prepare(`
    SELECT * FROM courses WHERE (is_active IS NULL OR is_active = 1)
    AND (title LIKE ? OR description LIKE ?) ORDER BY title
  `).all(`%${q}%`, `%${q}%`);
  const allowed = getCourseLevelsForUser(req.user);
  if (allowed) courses = courses.filter(c => allowed.includes(c.level));
  res.json(courses);
});

router.get('/:slug', optionalAuth, (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE slug = ? AND (is_active IS NULL OR is_active = 1)').get(req.params.slug);
  if (!course) return res.status(404).json({ error: 'Curso no encontrado' });

  const allowed = getCourseLevelsForUser(req.user);
  if (allowed && !allowed.includes(course.level)) {
    return res.status(403).json({ error: 'Este curso no está disponible para tu nivel educativo.' });
  }

  const lessons = db.prepare(`
    SELECT id, title, order_num, duration_minutes, module_num FROM lessons
    WHERE course_id = ? ORDER BY order_num
  `).all(course.id);

  let enrollment = null, lessonProgress = [], isFavorite = false, enrichedLessons = lessons;

  if (req.user) {
    enrollment = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(req.user.id, course.id);
    const modProg = getModuleProgressMap(req.user.id, course.id);
    const lesProg = getLessonProgressMap(req.user.id, course.id);
    lessonProgress = Object.entries(lesProg).map(([id, p]) => ({ lesson_id: parseInt(id, 10), passed: p.passed, exam_score: p.exam_score, viewed: p.viewed }));
    enrichedLessons = lessons.map(l => {
      const mod = l.module_num || modNum(l.order_num);
      return {
        ...l, module_num: mod,
        locked: enrollment ? !isLessonUnlocked(l, lessons, modProg, lesProg) : true,
        is_exam_lesson: isExamLesson(l, lessons),
        module_passed: modProg[mod]?.passed === 1,
        exam_score: modProg[mod]?.exam_score || 0
      };
    });
    isFavorite = !!db.prepare('SELECT id FROM favorites WHERE user_id = ? AND course_id = ?').get(req.user.id, course.id);
  } else {
    enrichedLessons = lessons.map(l => ({ ...l, locked: true, is_exam_lesson: isExamLesson(l, lessons), module_passed: false, exam_score: 0 }));
  }

  let canReview = false;
  let userReview = null;
  let finalScore = null;
  if (req.user && enrollment) {
    if (enrollment.progress_percent === 100) {
      userReview = db.prepare('SELECT rating, comment FROM course_reviews WHERE user_id = ? AND course_id = ?')
        .get(req.user.id, course.id);
      canReview = true;
      finalScore = enrollment.final_score ?? getCourseFinalScore(req.user.id, course.id);
    }
  }

  res.json({ course, lessons: enrichedLessons, enrollment, lessonProgress, isFavorite, canReview, userReview, finalScore });
});

router.post('/:slug/enroll', authMiddleware, (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE slug = ? AND (is_active IS NULL OR is_active = 1)').get(req.params.slug);
  if (!course) return res.status(404).json({ error: 'Curso no encontrado' });
  const allowed = getCourseLevelsForUser(req.user);
  if (allowed && !allowed.includes(course.level)) {
    return res.status(403).json({ error: 'Este curso no está disponible para tu nivel educativo.' });
  }
  db.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id, last_accessed) VALUES (?, ?, datetime(\'now\'))').run(req.user.id, course.id);
  db.prepare(`INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)`)
    .run(req.user.id, 'Inscripción confirmada', `Te inscribiste en "${course.title}". Estudia las lecciones y aprueba el examen del módulo.`);
  res.json({ ok: true });
});

router.get('/:slug/lessons/:lessonId', authMiddleware, (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE slug = ?').get(req.params.slug);
  if (!course) return res.status(404).json({ error: 'Curso no encontrado' });

  const lessonId = parseInt(req.params.lessonId, 10);
  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ? AND course_id = ?').get(lessonId, course.id);
  if (!lesson) return res.status(404).json({ error: 'Lección no encontrada' });

  const allLessons = db.prepare('SELECT id, title, order_num, module_num FROM lessons WHERE course_id = ? ORDER BY order_num').all(course.id);
  const modProg = getModuleProgressMap(req.user.id, course.id);
  const lesProg = getLessonProgressMap(req.user.id, course.id);

  if (!isLessonUnlocked(lesson, allLessons, modProg, lesProg)) {
    return res.status(403).json({ error: 'Completa las lecciones anteriores o aprueba el examen del módulo previo con 8/10.' });
  }

  db.prepare(`
    INSERT INTO lesson_progress (user_id, lesson_id, viewed) VALUES (?, ?, 1)
    ON CONFLICT(user_id, lesson_id) DO UPDATE SET viewed = 1
  `).run(req.user.id, lessonId);

  const mod = lesson.module_num || modNum(lesson.order_num);
  const examLesson = isExamLesson(lesson, allLessons);

  res.json({
    course, lesson, allLessons,
    module_num: mod,
    is_exam_lesson: examLesson,
    module_passed: modProg[mod]?.passed === 1,
    exam_score: modProg[mod]?.exam_score || 0,
    lessons_in_module: allLessons.filter(l => (l.module_num || modNum(l.order_num)) === mod).length
  });
});

router.get('/:slug/lessons/:lessonId/exam', authMiddleware, (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE slug = ?').get(req.params.slug);
  if (!course) return res.status(404).json({ error: 'Curso no encontrado' });

  const lessonId = parseInt(req.params.lessonId, 10);
  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ? AND course_id = ?').get(lessonId, course.id);
  if (!lesson) return res.status(404).json({ error: 'Lección no encontrada' });

  const allLessons = db.prepare('SELECT id, order_num, module_num FROM lessons WHERE course_id = ? ORDER BY order_num').all(course.id);
  if (!isExamLesson(lesson, allLessons)) {
    return res.status(400).json({ error: 'El examen está al final de cada módulo (después de 3-4 lecciones).' });
  }

  const modProg = getModuleProgressMap(req.user.id, course.id);
  const lesProg = getLessonProgressMap(req.user.id, course.id);
  if (!isLessonUnlocked(lesson, allLessons, modProg, lesProg)) {
    return res.status(403).json({ error: 'Completa las lecciones anteriores del módulo antes del examen.' });
  }

  const mod = lesson.module_num || modNum(lesson.order_num);
  let exam = db.prepare('SELECT * FROM exams WHERE course_id = ? AND module_num = ?').get(course.id, mod);
  if (!exam) {
    syncModuleExam(course, mod);
    exam = db.prepare('SELECT * FROM exams WHERE course_id = ? AND module_num = ?').get(course.id, mod);
  }
  if (!exam) return res.status(404).json({ error: 'Examen no disponible para este apartado' });

  const questions = db.prepare(`
    SELECT id, question, option_a, option_b, option_c, option_d, correct_option, order_num
    FROM exam_questions WHERE exam_id = ? ORDER BY order_num
  `).all(exam.id);

  if (questions.length === 0) {
    repopulateExamQuestions(exam.id, course.slug, mod);
    const refreshed = db.prepare(`
      SELECT id, question, option_a, option_b, option_c, option_d, correct_option, order_num
      FROM exam_questions WHERE exam_id = ? ORDER BY order_num
    `).all(exam.id);
    questions.push(...refreshed);
  }

  if (questions.length === 0) {
    return res.status(503).json({ error: 'No hay preguntas para este examen. Contacta al administrador.' });
  }

  const progress = db.prepare('SELECT passed, exam_score FROM module_progress WHERE user_id = ? AND course_id = ? AND module_num = ?')
    .get(req.user.id, course.id, mod);

  const modLessons = db.prepare('SELECT title FROM lessons WHERE course_id = ? AND module_num = ? ORDER BY order_num').all(course.id, mod);

  let session;
  try {
    session = createExamSession(db, req.user.id, exam.id, questions, mod);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error al preparar el examen' });
  }

  res.json({
    exam: { id: exam.id, title: exam.title, module_num: mod, difficulty: mod === 1 ? 'Básico' : mod === 2 ? 'Intermedio' : 'Avanzado' },
    session_id: session.sessionId,
    module_lessons: modLessons.map(l => l.title),
    questions: session.questions.map(q => ({ id: q.id, question: q.question, options: q.options, order_num: q.order_num })),
    already_passed: progress?.passed === 1,
    best_score: progress?.exam_score || 0
  });
});

router.post('/:slug/lessons/:lessonId/exam', authMiddleware, (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE slug = ?').get(req.params.slug);
  if (!course) return res.status(404).json({ error: 'Curso no encontrado' });

  const lessonId = parseInt(req.params.lessonId, 10);
  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ? AND course_id = ?').get(lessonId, course.id);
  if (!lesson) return res.status(404).json({ error: 'Lección no encontrada' });

  const allLessons = db.prepare('SELECT id, order_num, module_num FROM lessons WHERE course_id = ? ORDER BY order_num').all(course.id);
  if (!isExamLesson(lesson, allLessons)) return res.status(400).json({ error: 'Examen no disponible en esta lección' });

  const mod = lesson.module_num || modNum(lesson.order_num);
  const exam = db.prepare('SELECT id FROM exams WHERE course_id = ? AND module_num = ?').get(course.id, mod);
  if (!exam) return res.status(404).json({ error: 'Examen no encontrado' });

  const { answers, session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'Sesión de examen inválida. Recarga el examen.' });

  const graded = gradeExamSession(db, session_id, req.user.id, answers);
  if (graded.error) return res.status(400).json({ error: graded.error });

  const { correctCount, results, total } = graded;

  const score = total > 0 ? Math.round((correctCount / total) * 10) : 0;
  const passed = score >= PASS_SCORE;

  db.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id, last_accessed) VALUES (?, ?, datetime(\'now\'))').run(req.user.id, course.id);

  const existing = db.prepare('SELECT passed, exam_score FROM module_progress WHERE user_id = ? AND course_id = ? AND module_num = ?')
    .get(req.user.id, course.id, mod);
  const bestScore = Math.max(existing?.exam_score || 0, score);
  const nowPassed = passed || existing?.passed === 1;

  db.prepare(`
    INSERT INTO module_progress (user_id, course_id, module_num, passed, exam_score, completed_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, course_id, module_num) DO UPDATE SET
      passed = MAX(passed, excluded.passed),
      exam_score = MAX(exam_score, excluded.exam_score),
      completed_at = datetime('now')
  `).run(req.user.id, course.id, mod, nowPassed ? 1 : 0, bestScore);

  if (nowPassed) {
    const modLessons = db.prepare('SELECT id FROM lessons WHERE course_id = ? AND module_num = ?').all(course.id, mod);
    for (const l of modLessons) {
      db.prepare(`
        INSERT INTO lesson_progress (user_id, lesson_id, viewed, passed, completed, exam_score, completed_at)
        VALUES (?, ?, 1, 1, 1, ?, datetime('now'))
        ON CONFLICT(user_id, lesson_id) DO UPDATE SET passed = 1, completed = 1, exam_score = MAX(exam_score, ?)
      `).run(req.user.id, l.id, bestScore, bestScore);
    }
  }

  const petFeed = feedPet(req.user.id, correctCount);
  let petUnlock = { unlocked: false, pendingChoice: false, pet: null };

  if (passed && score === 10 && mod === 1) {
    petUnlock = tryUnlockPet(req.user.id, mod, score);
  }

  if (passed) {
    db.prepare(`INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)`)
      .run(req.user.id, '¡Módulo aprobado!', `Aprobaste el módulo ${mod} de "${course.title}" con ${score}/10.`);
    updateEnrollmentProgress(req.user.id, course.id);
    if (score === 10) {
      db.prepare(`INSERT OR IGNORE INTO achievements (user_id, type, title) VALUES (?, 'exam', ?)`)
        .run(req.user.id, `Puntuación perfecta: ${course.title} M${mod}`);
    }
  }

  const courseProgress = db.prepare('SELECT progress_percent FROM enrollments WHERE user_id = ? AND course_id = ?')
    .get(req.user.id, course.id)?.progress_percent || 0;

  const certificate = courseProgress === 100
    ? db.prepare('SELECT id, final_score FROM certificates WHERE user_id = ? AND course_id = ?').get(req.user.id, course.id)
    : null;
  const finalScore = courseProgress === 100 ? getCourseFinalScore(req.user.id, course.id) : null;

  res.json({
    score, passed, correctCount, totalQuestions: total, results, passScore: PASS_SCORE,
    petUnlocked: petUnlock.pendingChoice || petUnlock.unlocked,
    pendingPetChoice: petUnlock.pendingChoice,
    petFed: petFeed.fed,
    pet: petFeed.pet || petUnlock.pet,
    courseProgress,
    finalScore,
    certificateId: certificate?.id || null,
    courseCompleted: courseProgress === 100,
    message: passed
      ? (score === 10 ? `¡Perfecto! ${score}/10 — Avanzas al siguiente módulo.` : `¡Aprobado ${score}/10! Avanzas al siguiente módulo.`)
      : `Obtuviste ${score}/10. Necesitas al menos ${PASS_SCORE}/10.`
  });
});

module.exports = router;
