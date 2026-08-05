const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { eduToLevel } = require('../course-images');

const router = express.Router();

const LEVEL_HINTS = {
  primaria: 'Usa palabras muy simples, frases cortas y ejemplos de la vida diaria (dulces, juguetes, escuela).',
  secundaria: 'Usa lenguaje claro y directo, con ejemplos concretos. Evita tecnicismos sin explicar.',
  preparatoria: 'Explica con claridad; puedes usar términos académicos pero defínelos en palabras sencillas.',
  capacitacion: 'Explica como si enseñaras a alguien que empieza desde cero, paso a paso y sin asumir conocimientos previos.'
};

function levelHint(level) {
  return LEVEL_HINTS[level] || LEVEL_HINTS.secundaria;
}

function buildSystemPrompt(ctx, lessonCtx, lessonContext) {
  const eduLevel = ctx?.user?.education_level || lessonCtx?.course?.level || 'secundaria';
  const courseLevel = ctx?.courseLevel || lessonCtx?.course?.level || 'secundaria';

  return `Eres la IA educativa de Digital Academy. Tu trabajo es ayudar a estudiantes a aprender.

REGLAS OBLIGATORIAS:
1. Responde SIEMPRE en español.
2. Usa lenguaje SENCILLO: frases cortas, palabras fáciles de entender.
3. Explica PASO A PASO usando numeración (1, 2, 3...) cuando el tema lo permita.
4. Responde directamente la pregunta del estudiante; no des respuestas genéricas.
5. Incluye al menos un ejemplo concreto y cotidiano.
6. Sé amable, paciente y motivador. Nunca hagas sentir mal al estudiante.
7. Si es una tarea, GUÍA paso a paso pero NO des la respuesta final sin explicar el razonamiento.
8. Adapta la explicación al nivel del estudiante.

Nivel escolar del estudiante: ${eduLevel}.
${levelHint(courseLevel)}
${ctx ? `Nombre del estudiante: ${ctx.user.name}.` : ''}${buildContextPrompt(lessonCtx)}${lessonContext && !lessonCtx?.lesson ? `\n\nInformación del curso relacionada:\n${lessonContext}` : ''}`;
}

const KNOWLEDGE = {
  limite: '**¿Qué es un límite?**\nEl valor al que se acerca una función cuando x se acerca a un número.\n\n**Paso a paso — lim(x→2) x²:**\n1. El número x se acerca a 2 (sin llegar exactamente).\n2. Sustituye valores cercanos: 1.9² = 3.61, 1.99² ≈ 3.96, 2.01² ≈ 4.04.\n3. Todos se acercan a **4**.\n4. Conclusión: el límite es **4**.',
  derivada: '**¿Qué es la derivada?**\nMide qué tan rápido cambia algo en un instante.\n\n**Paso a paso — regla básica:**\n1. Si f(x) = xⁿ, la derivada es f\'(x) = n·xⁿ⁻¹.\n2. Ejemplo: f(x) = x² → n=2, entonces f\'(x) = 2x.\n3. Si x = 3: f\'(3) = 2×3 = **6**.\n4. Significa: en x=3, la función cambia con "velocidad" 6.',
  ecuacion: '**¿Qué es una ecuación?**\nEs una igualdad con un número desconocido (una letra como x).\n\n**Paso a paso — resolver x + 5 = 12:**\n1. Identifica qué buscas: el valor de **x**.\n2. Quita el 5 del lado izquierdo: resta 5 en **ambos** lados.\n3. Queda: x = 12 − 5.\n4. Calcula: x = **7**.\n5. Verifica: 7 + 5 = 12 ✓',
  suma: '**¿Qué es la suma?**\nJuntar cantidades para obtener un total.\n\n**Paso a paso — 15 + 27:**\n1. Alinea unidades y decenas en columna.\n2. Unidades: 7 + 5 = 12 → escribe 2, lleva 1.\n3. Decenas: 2 + 1 + 1 = **4**.\n4. Resultado: **42**.',
  resta: '**¿Qué es la resta?**\nQuitar una cantidad de otra.\n\n**Paso a paso — 50 − 18:**\n1. Pide prestado en unidades (0 − 8 no se puede).\n2. Unidades: 10 − 8 = **2**.\n3. Decenas: 4 − 1 = **3**.\n4. Resultado: **32**. Verifica: 32 + 18 = 50 ✓',
  multiplicacion: '**¿Qué es la multiplicación?**\nSumar el mismo número varias veces.\n\n**Paso a paso — 4 × 3:**\n1. Significa: 4 + 4 + 4.\n2. 4 + 4 = 8, luego 8 + 4 = **12**.\n3. Resultado: **12**.\n\n**Tip:** aprende las tablas del 1 al 10.',
  division: '**¿Qué es la división?**\nRepartir en partes iguales.\n\n**Paso a paso — 20 ÷ 4:**\n1. Pregunta: "¿cuántas veces cabe 4 en 20?"\n2. 4 × 5 = 20 → cabe **5** veces.\n3. Resultado: **5**.',
  fotosintesis: '**¿Qué es la fotosíntesis?**\nCómo las plantas fabrican su alimento.\n\n**Paso a paso:**\n1. Absorben **luz solar** en las hojas.\n2. Toman **agua** por las raíces.\n3. Toman **CO₂** del aire.\n4. Con clorofila (verde), los combinan.\n5. Producen **glucosa** (alimento) y **oxígeno**.',
  celula: '**¿Qué es una célula?**\nLa unidad más pequeña de los seres vivos.\n\n**Paso a paso — partes:**\n1. **Membrana:** protege la célula.\n2. **Citoplasma:** gel interno.\n3. **Núcleo:** controla la célula.\n4. Plantas: **cloroplastos**. Animales: **mitocondrias**.',
  verbo: '**¿Qué es un verbo?**\nPalabra de **acción**, **estado** o **proceso**.\n\n**Paso a paso:**\n1. Pregunta "¿qué hace?" → "María **corre**".\n2. Cambia según persona: yo corro, tú corres.\n3. Cambia según tiempo: corro (ahora), corrí (antes).',
  sustantivo: '**¿Qué es un sustantivo?**\nPalabra que **nombra** algo.\n\n**Paso a paso:**\n1. Pregunta "¿qué o quién?"\n2. **Común:** perro, escuela (minúscula).\n3. **Propio:** México, Ana (mayúscula).',
  mapa: '**¿Qué es un mapa?**\nDibujo de un lugar visto desde arriba.\n\n**Paso a paso para leerlo:**\n1. Lee el **título**.\n2. Revisa la **escala**.\n3. Usa la **rosa de los vientos** (N, S, E, O).\n4. Consulta la **leyenda** de símbolos.',
  fraccion: '**¿Qué es una fracción?**\nParte de un entero.\n\n**Paso a paso — 3/4:**\n1. Denominador (4) = partes totales.\n2. Numerador (3) = partes que tomas.\n3. Sumar igual denominador: 1/4 + 2/4 = 3/4.',
  independencia: '**Independencia de México**\n\n**Paso a paso:**\n1. México era colonia de España.\n2. **16 sep 1810:** Grito de Dolores (Hidalgo).\n3. Lucha de **11 años**.\n4. **1821:** independencia lograda.',
  revolucion: '**Revolución Mexicana (1910-1920)**\n\n**Paso a paso:**\n1. Desigualdad bajo el Porfiriato.\n2. **1910:** inicia la revolución.\n3. Líderes: Madero, Zapata, Villa.\n4. **1917:** Constitución con derechos sociales.',
  gracias: '¡De nada! 😊 Cuando quieras, pregúntame y te explico paso a paso con palabras sencillas.',
  ayuda: 'Soy tu **IA educativa**. Puedo:\n\n1. **Responder dudas** de tus materias.\n2. **Explicar paso a paso** con lenguaje sencillo.\n3. **Guiarte en tareas** (sin hacerlas por ti).\n4. **Recomendar cursos**.\n\nPregunta por ejemplo:\n• "Explícame la fotosíntesis paso a paso"\n• "¿Cómo resuelvo x + 5 = 12?"',
  tarea: '**Ayuda con tu tarea** — te guío paso a paso, no te doy la respuesta sin explicar.\n\n**Cómo funciona:**\n1. Dime la materia (matemáticas, ciencias, etc.).\n2. Copia el enunciado o describe el ejercicio.\n3. Te explico el **primer paso** y te pregunto si lo entiendes.\n4. Avanzamos juntos hasta que lo resuelvas tú.\n\n¿Qué ejercicio o tema necesitas?'
};

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalize(text) {
  return (text || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function cleanQuery(text) {
  return normalize(text)
    .replace(/^(que es|que son|que significa|como funciona|como se|explical?ame|explique|explica|dime|cuentame|hablame de|hablame sobre|sobre el|sobre la|sobre|define|definicion de|definicion del|definicion de la|what is|whats)\s+/i, '')
    .replace(/\?+$/, '')
    .trim();
}

function matchKeyword(text) {
  const lower = normalize(text);
  const core = cleanQuery(text);

  if (/^(hola|buenos|hey|saludos|que tal)/.test(lower)) return 'saludo';
  if (/^(gracias|thank)/.test(lower)) return 'gracias';
  if (/^(ayuda|help)$/.test(lower.trim())) return 'ayuda';
  if (/^(tengo una duda|tengo duda|resolver duda)/.test(lower.trim())) return 'ayuda';
  if (/^explicame paso a paso$/.test(lower.trim())) return 'ayuda';
  if (/ayuda.*tarea|mi tarea|homework/.test(lower)) return 'tarea';
  if (/progreso|avance|mis horas/.test(lower)) return 'progreso';
  if (/curso|recomienda|inscrib/.test(lower)) return 'curso';

  const check = core || lower;
  if (/paso a paso|explicame|explicalo|explicacion/.test(lower)) {
    if (/fotosintesis/.test(check)) return 'fotosintesis';
    if (/ecuacion|x\s*[\+\-\=]|incognita/.test(check)) return 'ecuacion';
    if (/fracci/.test(check)) return 'fraccion';
    if (/celula/.test(check)) return 'celula';
  }
  if (/x\s*[\+\-\=]|ecuacion|incognita|despejar/.test(check)) return 'ecuacion';
  if (/limite/.test(check)) return 'limite';
  if (/derivada/.test(check)) return 'derivada';
  if (/suma|sumar|adicion/.test(check)) return 'suma';
  if (/resta|restar/.test(check)) return 'resta';
  if (/multiplic|producto|tabla/.test(check)) return 'multiplicacion';
  if (/divisi|dividir/.test(check)) return 'division';
  if (/fotosintesis/.test(check)) return 'fotosintesis';
  if (/celula/.test(check)) return 'celula';
  if (/verbo/.test(check)) return 'verbo';
  if (/sustantivo/.test(check)) return 'sustantivo';
  if (/mapa|geograf/.test(check)) return 'mapa';
  if (/fracci/.test(check)) return 'fraccion';
  if (/independencia|hidalgo|1810|grito de dolores/.test(check)) return 'independencia';
  if (/revoluci|porfiriato|1910|zapata|villa/.test(check)) return 'revolucion';
  return null;
}

function getUserContext(userId) {
  if (!userId) return null;
  const user = db.prepare('SELECT name, education_level, level FROM users WHERE id = ?').get(userId);
  const hours = db.prepare('SELECT COALESCE(SUM(minutes),0)/60 as h FROM study_sessions WHERE user_id = ?').get(userId).h;
  const level = eduToLevel[user.education_level];
  const enrollments = db.prepare(`
    SELECT c.title, e.progress_percent FROM enrollments e
    JOIN courses c ON c.id = e.course_id WHERE e.user_id = ? AND (c.is_active IS NULL OR c.is_active = 1)
    ${level ? 'AND c.level = ?' : ''}
    LIMIT 5
  `).all(userId, ...(level ? [level] : []));
  return { user, hours: Math.round(hours * 10) / 10, enrollments, courseLevel: level };
}

const STOP_WORDS = new Set(['como', 'que', 'son', 'del', 'de', 'la', 'el', 'los', 'las', 'un', 'una', 'para', 'con', 'por', 'resuelvo', 'resolver', 'explicame', 'explica', 'dime', 'sobre', 'estudia', 'estudiar']);

function findBestLesson(query, userLevel) {
  const cleaned = cleanQuery(query);
  const terms = (cleaned || query).toLowerCase().split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  if (terms.length === 0) return null;

  let sql = `
    SELECT l.title, l.content, c.title as course_title, c.slug, c.level
    FROM lessons l JOIN courses c ON c.id = l.course_id
    WHERE (c.is_active IS NULL OR c.is_active = 1)
  `;
  const params = [];
  if (userLevel) {
    sql += ' AND c.level = ?';
    params.push(userLevel);
  }

  const lessons = db.prepare(sql).all(...params);
  let best = null;
  let bestScore = 0;

  for (const lesson of lessons) {
    const titleLower = lesson.title.toLowerCase();
    const text = (lesson.title + ' ' + stripHtml(lesson.content)).toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (titleLower.includes(t)) score += 5;
      else if (text.includes(t)) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      best = lesson;
    }
  }

  return bestScore >= 1 ? best : null;
}

function explainFromLesson(lesson, query) {
  const plain = stripHtml(lesson.content);
  const headingMatch = (lesson.content || '').match(/<h3[^>]*>(.*?)<\/h3>/i);
  const heading = headingMatch ? stripHtml(headingMatch[1]) : lesson.title;

  const chunks = plain.split(/(?<=[.!?])\s+/).filter(s => s.length > 15);
  const terms = cleanQuery(query).split(/\s+/).filter(w => w.length > 2);
  let relevant = chunks.filter(s => terms.some(t => s.toLowerCase().includes(t)));
  if (relevant.length === 0) relevant = chunks.slice(0, 5);
  else relevant = relevant.slice(0, 5);

  const steps = relevant.map((s, i) => `${i + 1}. ${s.trim()}`).join('\n');
  const intro = relevant[0] || heading;

  return `**${heading}** — explicación sencilla\n\n**En pocas palabras:**\n${intro}\n\n**Paso a paso:**\n${steps}\n\n📘 Esto lo estudias en **${lesson.course_title}** (lección: "${lesson.title}").\n\n¿Quieres que profundice en algún paso o te dé un ejemplo?`;
}

function buildSmartReply(text, userId) {
  const ctx = getUserContext(userId);
  const key = matchKeyword(text);

  if (key === 'saludo') {
    const name = ctx?.user?.name?.split(' ')[0] || '';
    return `¡Hola${name ? ` ${name}` : ''}! 👋 Soy tu **IA educativa** de Digital Academy.\n\nPuedo:\n1. Responder tus dudas escolares.\n2. Explicarte temas **paso a paso**.\n3. Usar **lenguaje sencillo** adaptado a tu nivel.\n\n¿Qué tema quieres que te explique?`;
  }

  if (key === 'progreso' && ctx) {
    const courseList = ctx.enrollments.length > 0
      ? ctx.enrollments.map(e => `• ${e.title}: ${e.progress_percent}%`).join('\n')
      : 'Aún no tienes cursos inscritos. ¡Explora el catálogo de tu nivel!';
    return `📊 **Tu progreso**\n\n• Nivel: ${ctx.user.level}\n• Horas estudiadas: ${ctx.hours}h\n• Nivel escolar: ${ctx.user.education_level}\n\n**Cursos:**\n${courseList}`;
  }

  if (key === 'curso') {
    const level = ctx?.courseLevel || 'secundaria';
    const courses = db.prepare(`
      SELECT title FROM courses
      WHERE (is_active IS NULL OR is_active = 1) AND level = ?
      ORDER BY title LIMIT 6
    `).all(level);
    const list = courses.map(c => `• ${c.title}`).join('\n');
    return `Según tu nivel (${ctx?.user?.education_level || 'escolar'}), estos cursos están disponibles:\n\n${list}\n\n¿Sobre cuál tienes dudas?`;
  }

  if (key && KNOWLEDGE[key]) return KNOWLEDGE[key];

  const lesson = findBestLesson(text, ctx?.courseLevel) || findBestLesson(cleanQuery(text), ctx?.courseLevel);
  if (lesson) return explainFromLesson(lesson, text);

  return `Entiendo tu pregunta sobre "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}".\n\nSoy tu IA educativa y puedo explicarte con **paso a paso** y **lenguaje sencillo** temas de:\n• Matemáticas\n• Ciencias\n• Español\n• Historia\n• Inglés\n• Geografía\n\nIntenta preguntar así:\n• "Explícame paso a paso qué es la fotosíntesis"\n• "¿Cómo resuelvo ecuaciones de primer grado?"\n• "Ayúdame a entender las fracciones"`;
}

function createConversation(userId) {
  return db.prepare('INSERT INTO chat_conversations (user_id) VALUES (?)').run(userId).lastInsertRowid;
}

function getConversationForUser(userId, conversationId) {
  if (!conversationId) return null;
  const row = db.prepare('SELECT id FROM chat_conversations WHERE id = ? AND user_id = ?').get(conversationId, userId);
  return row ? row.id : null;
}

function resolveConversation(userId, conversationId) {
  const existing = getConversationForUser(userId, conversationId);
  if (existing) return existing;
  return createConversation(userId);
}

async function callGemini(messages) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMsgs = messages.filter(m => m.role !== 'system');

  const contents = chatMsgs.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const body = {
    contents,
    generationConfig: { temperature: 0.5, maxOutputTokens: 900 }
  };
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(body)
      }
    );
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      console.error('Gemini API error:', res.status, err.slice(0, 300));
      return null;
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || null;
  } catch (err) {
    console.error('Gemini request failed:', err.message);
    return null;
  }
}

async function callOpenAI(messages) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 900, temperature: 0.5 })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

router.get('/history', authMiddleware, (req, res) => {
  const conversationId = getConversationForUser(req.user.id, req.query.conversationId);
  if (!conversationId) return res.json([]);

  const messages = db.prepare(`
    SELECT role, content, created_at FROM chat_messages
    WHERE user_id = ? AND conversation_id = ?
    ORDER BY created_at ASC LIMIT 50
  `).all(req.user.id, conversationId);
  res.json(messages);
});

router.post('/conversation', authMiddleware, (req, res) => {
  try {
    const conversationId = createConversation(req.user.id);
    res.json({ conversationId });
  } catch (err) {
    console.error('Error creating conversation:', err.message);
    res.status(500).json({ error: 'No se pudo crear la conversación' });
  }
});

function getLessonContext(courseSlug, lessonId) {
  if (!courseSlug) return null;
  const course = db.prepare('SELECT id, title, slug, level FROM courses WHERE slug = ?').get(courseSlug);
  if (!course) return null;

  let lesson = null;
  if (lessonId) {
    lesson = db.prepare(`
      SELECT l.*, c.title as course_title, c.slug, c.level
      FROM lessons l JOIN courses c ON c.id = l.course_id
      WHERE l.id = ? AND c.slug = ?
    `).get(lessonId, courseSlug);
  }

  const modLessons = lesson
    ? db.prepare('SELECT title, content, order_num FROM lessons WHERE course_id = ? AND module_num = ? ORDER BY order_num')
        .all(course.id, lesson.module_num || Math.ceil(lesson.order_num / 4))
    : [];

  return { course, lesson, modLessons };
}

function buildContextPrompt(ctx) {
  if (!ctx?.lesson) return '';
  const plain = stripHtml(ctx.lesson.content);
  const headingMatch = (ctx.lesson.content || '').match(/<h3[^>]*>(.*?)<\/h3>/i);
  const heading = headingMatch ? stripHtml(headingMatch[1]) : ctx.lesson.title;
  const modTitles = ctx.modLessons.map(l => l.title).join(', ');

  return `\n\nCONTEXTO ACTUAL DEL ESTUDIANTE (usa esto como fuente principal):
- Curso: ${ctx.course.title} (${ctx.course.level})
- Lección actual: "${ctx.lesson.title}" (Módulo ${ctx.lesson.module_num || Math.ceil(ctx.lesson.order_num / 4)})
- Tema: ${heading}
- Contenido de la lección:\n${plain.slice(0, 1800)}
- Otras lecciones del módulo: ${modTitles}

Responde SOLO con información coherente con este curso y lección. Si la pregunta es sobre otro tema, indícalo y responde con lo que sí está en el material.`;
}

router.post('/message', authMiddleware, async (req, res) => {
  const { message, context, conversationId: reqConversationId } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Mensaje vacío' });

  const userId = req.user.id;
  const text = message.trim();

  let conversationId;
  try {
    conversationId = resolveConversation(userId, reqConversationId);
  } catch (err) {
    console.error('Error resolving conversation:', err.message);
    return res.status(500).json({ error: 'Error al iniciar la conversación. Reinicia el servidor.' });
  }

  try {
    db.prepare('INSERT INTO chat_messages (user_id, conversation_id, role, content) VALUES (?, ?, ?, ?)').run(userId, conversationId, 'user', text);

    const ctx = getUserContext(userId);
    const lessonCtx = getLessonContext(context?.courseSlug, context?.lessonId);

    let lesson = lessonCtx?.lesson || findBestLesson(text, ctx?.courseLevel);
    if (lessonCtx?.lesson) lesson = lessonCtx.lesson;
    const lessonContext = lesson ? explainFromLesson(lesson, text) : null;

    const systemPrompt = buildSystemPrompt(ctx, lessonCtx, lessonContext);

    const recentMessages = db.prepare(`
      SELECT role, content FROM chat_messages
      WHERE user_id = ? AND conversation_id = ?
      ORDER BY created_at DESC LIMIT 6
    `).all(userId, conversationId).reverse();

    let reply = await callGemini([
      { role: 'system', content: systemPrompt },
      ...recentMessages.slice(0, -1).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: text }
    ]);

    if (!reply) {
      reply = await callOpenAI([
        { role: 'system', content: systemPrompt },
        ...recentMessages.slice(0, -1).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        { role: 'user', content: text }
      ]);
    }

    if (!reply) {
      if (lessonCtx?.lesson) reply = explainFromLesson(lessonCtx.lesson, text);
      else reply = buildSmartReply(text, userId);
    }

    db.prepare('INSERT INTO chat_messages (user_id, conversation_id, role, content) VALUES (?, ?, ?, ?)').run(userId, conversationId, 'assistant', reply);

    res.json({ reply, conversationId });
  } catch (err) {
    console.error('Chat message error:', err.message);
    res.status(500).json({ error: 'No se pudo procesar tu mensaje.' });
  }
});

module.exports = router;
