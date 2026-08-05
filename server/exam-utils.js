const crypto = require('crypto');

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function hashSeed(...parts) {
  const str = parts.join('|');
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

function shuffleArray(arr, seed) {
  const a = [...arr];
  const rand = seededRandom(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleQuestionOptions(options, correctIndex, seed) {
  const tagged = options.map((text, idx) => ({ text, isCorrect: idx === correctIndex }));
  const shuffled = shuffleArray(tagged, seed);
  return {
    options: shuffled.map(o => o.text),
    correctIndex: shuffled.findIndex(o => o.isCorrect)
  };
}

function pickQuestions(pool, count, seed, moduleNum) {
  const seen = new Set();
  const unique = [];
  for (const q of pool) {
    const key = (q.question || q.q || '').trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(q);
  }

  const weighted = unique.map((q, i) => ({
    q,
    weight: (q.difficulty || moduleNum) + (i % 3)
  }));
  const shuffled = shuffleArray(weighted, seed);
  const picked = shuffled.slice(0, Math.min(count, shuffled.length));

  if (picked.length < count) {
    const extra = shuffleArray(unique, seed + 7);
    for (const q of extra) {
      if (picked.length >= count) break;
      const key = (q.question || q.q || '').trim().toLowerCase();
      if (!picked.find(p => (p.q.question || p.q.q || '').trim().toLowerCase() === key)) {
        picked.push({ q, weight: 1 });
      }
    }
  }
  return picked.map(p => p.q);
}

function createExamSession(db, userId, examId, dbQuestions, moduleNum) {
  cleanupSessions(db);

  if (!dbQuestions.length) {
    throw new Error('No hay preguntas disponibles para este examen');
  }

  const baseSeed = hashSeed(userId, examId, Date.now(), moduleNum, Math.random());
  const questionCount = Math.min(5, dbQuestions.length);
  const picked = pickQuestions(
    dbQuestions.map(q => ({
      id: q.id,
      question: q.question,
      options: [q.option_a, q.option_b, q.option_c, q.option_d],
      correctIndex: q.correct_option
    })),
    questionCount,
    baseSeed,
    moduleNum
  );

  const prepared = picked.map((q, i) => {
    const { options, correctIndex } = shuffleQuestionOptions(q.options, q.correctIndex, baseSeed + i * 13 + 3);
    return { id: q.id, question: q.question, options, correctIndex };
  });

  const questions = shuffleArray(prepared, baseSeed + 99);
  const sessionId = crypto.randomBytes(16).toString('hex');
  const answersData = questions.map(q => ({ id: q.id, correctIndex: q.correctIndex }));

  db.prepare(`
    INSERT INTO exam_sessions (id, user_id, exam_id, answers_json) VALUES (?, ?, ?, ?)
  `).run(sessionId, userId, examId, JSON.stringify(answersData));

  return {
    sessionId,
    questions: questions.map((q, i) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      order_num: i + 1
    }))
  };
}

function gradeExamSession(db, sessionId, userId, answers) {
  cleanupSessions(db);

  const row = db.prepare(`
    SELECT id, user_id, exam_id, answers_json FROM exam_sessions WHERE id = ?
  `).get(sessionId);

  if (!row) return { error: 'Sesión de examen expirada. Recarga el examen e intenta de nuevo.' };
  if (Number(row.user_id) !== Number(userId)) return { error: 'Sesión inválida' };

  let sessionQuestions;
  try {
    sessionQuestions = JSON.parse(row.answers_json);
  } catch {
    return { error: 'Sesión corrupta. Recarga el examen.' };
  }

  if (!Array.isArray(answers) || answers.length !== sessionQuestions.length) {
    return { error: `Responde las ${sessionQuestions.length} preguntas del examen` };
  }

  let correctCount = 0;
  const results = sessionQuestions.map((q, i) => {
    const correct = Number(answers[i]) === Number(q.correctIndex);
    if (correct) correctCount++;
    return { question_id: q.id, correct, correct_option: q.correctIndex };
  });

  db.prepare('DELETE FROM exam_sessions WHERE id = ?').run(sessionId);

  return { correctCount, results, total: sessionQuestions.length };
}

function cleanupSessions(db) {
  db.prepare(`DELETE FROM exam_sessions WHERE created_at < datetime('now', '-45 minutes')`).run();
}

function shuffleAndStoreQuestion(q, seed) {
  const { options, correctIndex } = shuffleQuestionOptions(q.o, q.c, seed);
  return {
    question: q.q,
    option_a: options[0],
    option_b: options[1],
    option_c: options[2],
    option_d: options[3],
    correct_option: correctIndex,
    difficulty: q.difficulty || 1
  };
}

module.exports = {
  shuffleArray,
  shuffleQuestionOptions,
  shuffleAndStoreQuestion,
  createExamSession,
  gradeExamSession,
  hashSeed
};
