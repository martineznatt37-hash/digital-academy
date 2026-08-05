const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

// En Render puedes montar disco persistente y poner DATABASE_PATH=/var/data/digital-academy.db
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'digital-academy.db');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      education_level TEXT NOT NULL DEFAULT 'Secundaria',
      level INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      level TEXT NOT NULL,
      emoji TEXT NOT NULL,
      gradient TEXT NOT NULL,
      lesson_count INTEGER NOT NULL DEFAULT 0,
      duration_hours REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      order_num INTEGER NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 15
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      progress_percent INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      last_accessed TEXT,
      enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      UNIQUE(user_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
      minutes REAL NOT NULL,
      studied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      issued_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tutoring_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      level TEXT NOT NULL,
      date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      advisor TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      earned_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
      title TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exam_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option INTEGER NOT NULL DEFAULT 0,
      order_num INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS user_pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      pet_type TEXT NOT NULL DEFAULT 'owl',
      name TEXT NOT NULL DEFAULT 'Búho',
      happiness INTEGER NOT NULL DEFAULT 50,
      food_count INTEGER NOT NULL DEFAULT 0,
      unlocked INTEGER NOT NULL DEFAULT 0,
      pending_choice INTEGER NOT NULL DEFAULT 0,
      unlocked_at TEXT
    );

    CREATE TABLE IF NOT EXISTS module_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      module_num INTEGER NOT NULL,
      passed INTEGER NOT NULL DEFAULT 0,
      exam_score INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      UNIQUE(user_id, course_id, module_num)
    );

    CREATE TABLE IF NOT EXISTS course_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS exam_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      answers_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  try { db.exec('ALTER TABLE courses ADD COLUMN is_active INTEGER DEFAULT 1'); } catch {}

  try { db.exec('ALTER TABLE lesson_progress ADD COLUMN exam_score INTEGER DEFAULT 0'); } catch {}
  try { db.exec('ALTER TABLE lesson_progress ADD COLUMN passed INTEGER DEFAULT 0'); } catch {}
  try { db.exec('ALTER TABLE lesson_progress ADD COLUMN viewed INTEGER DEFAULT 0'); } catch {}
  try { db.exec('ALTER TABLE lessons ADD COLUMN module_num INTEGER DEFAULT 1'); } catch {}
  try { db.exec('ALTER TABLE exams ADD COLUMN course_id INTEGER'); } catch {}
  try { db.exec('ALTER TABLE exams ADD COLUMN module_num INTEGER'); } catch {}
  try { db.exec('ALTER TABLE user_pets ADD COLUMN pending_choice INTEGER DEFAULT 0'); } catch {}
  try { db.exec('ALTER TABLE courses ADD COLUMN cover_image TEXT'); } catch {}
  try { db.exec('ALTER TABLE certificates ADD COLUMN final_score REAL'); } catch {}
  try { db.exec('ALTER TABLE enrollments ADD COLUMN final_score REAL'); } catch {}
  try { db.exec('ALTER TABLE user_pets ADD COLUMN energy INTEGER DEFAULT 100'); } catch {}
  try { db.exec('ALTER TABLE user_pets ADD COLUMN hunger INTEGER DEFAULT 100'); } catch {}
  try { db.exec('ALTER TABLE user_pets ADD COLUMN sleep INTEGER DEFAULT 100'); } catch {}
  try { db.exec('ALTER TABLE user_pets ADD COLUMN last_update TEXT'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT \'student\''); } catch {}
  try { db.exec('ALTER TABLE tutoring_sessions ADD COLUMN teacher_id INTEGER'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN password_plain TEXT'); } catch {}

  db.prepare(`UPDATE users SET password_plain = 'demo1234' WHERE email = 'demo@digitalacademy.com' AND (password_plain IS NULL OR password_plain = '')`).run();
  db.prepare(`UPDATE users SET password_plain = '1234' WHERE email = 'admin@gmail.com' AND (password_plain IS NULL OR password_plain = '')`).run();

  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  try { db.exec('ALTER TABLE chat_messages ADD COLUMN conversation_id INTEGER REFERENCES chat_conversations(id) ON DELETE CASCADE'); } catch {}

  const orphanUsers = db.prepare(`
    SELECT DISTINCT user_id FROM chat_messages
    WHERE user_id IS NOT NULL AND conversation_id IS NULL
  `).all();
  for (const row of orphanUsers) {
    const convId = db.prepare('INSERT INTO chat_conversations (user_id) VALUES (?)').run(row.user_id).lastInsertRowid;
    db.prepare('UPDATE chat_messages SET conversation_id = ? WHERE user_id = ? AND conversation_id IS NULL').run(convId, row.user_id);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS teacher_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      levels TEXT NOT NULL,
      bio TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedAdminUser();
  const courseCount = db.prepare('SELECT COUNT(*) as c FROM courses').get().c;
  if (courseCount === 0) seedData();
  seedTechCourses();
  migrateCurriculum();
  expandLessonsTo12();
  seedCourseImages();
  syncMissingExams();
  backfillCertificateScores();
  refreshExamQuestions();
  migrateModuleSystem();
}

const COURSE_IMAGES = require('./course-images').courses;
const LESSON_IMAGES = require('./course-images').lessons;
const { eduToLevel } = require('./course-images');

function migrateCurriculum() {
  const curriculum = require('./curriculum');
  const extraLessons = require('./curriculum-lessons');

  const upsert = db.prepare(`
    INSERT INTO courses (slug, title, description, level, emoji, gradient, lesson_count, duration_hours, is_active)
    VALUES (@slug, @title, @description, @level, @emoji, @gradient, @lesson_count, @duration_hours, 1)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      level = excluded.level,
      emoji = excluded.emoji,
      gradient = excluded.gradient,
      lesson_count = excluded.lesson_count,
      duration_hours = excluded.duration_hours,
      is_active = 1
  `);

  for (const [level, courses] of Object.entries({ primaria: curriculum.primaria, secundaria: curriculum.secundaria, preparatoria: curriculum.preparatoria })) {
    for (const c of courses) {
      upsert.run({ ...c, level });
    }
  }

  for (const r of curriculum.reassign) {
    db.prepare('UPDATE courses SET level = ?, title = ? WHERE slug = ?').run(r.level, r.title, r.slug);
    if (r.hidden) {
      db.prepare('UPDATE courses SET is_active = 0 WHERE slug = ?').run(r.slug);
    }
  }

  const getCourseId = db.prepare('SELECT id FROM courses WHERE slug = ?');
  const countLessons = db.prepare('SELECT COUNT(*) as c FROM lessons WHERE course_id = ?');
  const insertLesson = db.prepare(`
    INSERT INTO lessons (course_id, title, content, order_num, duration_minutes, module_num)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const [slug, lessons] of Object.entries(extraLessons)) {
    const course = getCourseId.get(slug);
    if (!course) continue;
    if (countLessons.get(course.id).c > 0) continue;
    lessons.forEach((l, i) => {
      insertLesson.run(course.id, l.title, l.content, i + 1, l.duration, Math.ceil((i + 1) / 4));
    });
  }

  db.prepare(`UPDATE courses SET title = 'Matemáticas', description = 'Sumas, restas, multiplicaciones, divisiones y problemas cotidianos de primaria.' WHERE slug = 'matematicas-divertidas'`).run();
  db.prepare(`UPDATE courses SET title = 'Español', description = 'Lectura, escritura, ortografía y comprensión de textos de primaria.' WHERE slug = 'lectura-escritura'`).run();
  db.prepare(`UPDATE courses SET title = 'Inglés', lesson_count = 4, duration_hours = 12 WHERE slug = 'ingles-intermedio'`).run();
  db.prepare(`UPDATE courses SET title = 'Química' WHERE slug = 'quimica-organica'`).run();
}

function seedCourseImages() {
  const update = db.prepare('UPDATE courses SET cover_image = ? WHERE slug = ?');
  for (const [slug, url] of Object.entries(COURSE_IMAGES)) {
    update.run(url, slug);
  }
  db.prepare(`UPDATE courses SET cover_image = ? WHERE cover_image LIKE 'https://%'`).run('/images/courses/matematicas-divertidas.png');
  db.prepare(`UPDATE courses SET cover_image = REPLACE(cover_image, '.svg', '.png') WHERE cover_image LIKE '%.svg'`).run();
}

function seedData() {
  const courses = [
    { slug: 'matematicas-divertidas', title: 'Matemáticas Divertidas', description: 'Aprende sumas, restas, multiplicaciones y divisiones con juegos interactivos y ejercicios paso a paso.', level: 'primaria', emoji: '🔢', gradient: 'linear-gradient(135deg,#DBEAFE,#BFDBFE)', lesson_count: 5, duration_hours: 12 },
    { slug: 'ciencias-naturales', title: 'Ciencias Naturales', description: 'Explora el mundo de la naturaleza, los animales, las plantas y experimentos sencillos para hacer en casa.', level: 'primaria', emoji: '🌱', gradient: 'linear-gradient(135deg,#D1FAE5,#A7F3D0)', lesson_count: 4, duration_hours: 10 },
    { slug: 'lectura-escritura', title: 'Lectura y Escritura Creativa', description: 'Desarrolla habilidades de lectura comprensiva y expresión escrita con cuentos, poemas y actividades creativas.', level: 'primaria', emoji: '📖', gradient: 'linear-gradient(135deg,#FEF3C7,#FDE68A)', lesson_count: 4, duration_hours: 8 },
    { slug: 'algebra-basica', title: 'Álgebra Básica', description: 'Domina ecuaciones, factorización y funciones lineales con explicaciones claras y ejercicios resueltos paso a paso.', level: 'secundaria', emoji: '📐', gradient: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)', lesson_count: 6, duration_hours: 20 },
    { slug: 'introduccion-programacion', title: 'Introducción a la Programación', description: 'Aprende los fundamentos de la programación con bloques visuales y tu primer lenguaje de código.', level: 'secundaria', emoji: '💻', gradient: 'linear-gradient(135deg,#DBEAFE,#93C5FD)', lesson_count: 5, duration_hours: 16 },
    { slug: 'ingles-intermedio', title: 'Inglés Intermedio', description: 'Mejora tu vocabulario, gramática y conversación con lecciones interactivas y práctica con IA.', level: 'secundaria', emoji: '🇬🇧', gradient: 'linear-gradient(135deg,#FEE2E2,#FECACA)', lesson_count: 5, duration_hours: 24 },
    { slug: 'calculo-diferencial', title: 'Cálculo Diferencial', description: 'Límites, derivadas y aplicaciones con visualizaciones interactivas y resolución de problemas guiada.', level: 'preparatoria', emoji: '∫', gradient: 'linear-gradient(135deg,#EDE9FE,#C4B5FD)', lesson_count: 5, duration_hours: 30 },
    { slug: 'fundamentos-ia', title: 'Fundamentos de Inteligencia Artificial', description: 'Conoce qué es la IA, cómo funciona el machine learning y crea tu primer proyecto con herramientas modernas.', level: 'preparatoria', emoji: '🤖', gradient: 'linear-gradient(135deg,#DBEAFE,#60A5FA)', lesson_count: 5, duration_hours: 18 },
    { slug: 'quimica-organica', title: 'Química Orgánica', description: 'Estructuras moleculares, reacciones y nomenclatura explicadas con modelos 3D y simulaciones interactivas.', level: 'preparatoria', emoji: '⚗️', gradient: 'linear-gradient(135deg,#D1FAE5,#6EE7B7)', lesson_count: 4, duration_hours: 25 }
  ];

  const insertCourse = db.prepare(`
    INSERT INTO courses (slug, title, description, level, emoji, gradient, lesson_count, duration_hours)
    VALUES (@slug, @title, @description, @level, @emoji, @gradient, @lesson_count, @duration_hours)
  `);

  for (const c of courses) insertCourse.run(c);

  const lessonsBySlug = {
    'matematicas-divertidas': [
      { title: 'Introducción a las sumas', content: '<h3>¿Qué es una suma?</h3><p>La suma es juntar dos o más cantidades para obtener un total. Por ejemplo: 2 + 3 = 5.</p><h4>Ejercicios</h4><ul><li>5 + 4 = ?</li><li>7 + 2 = ?</li><li>10 + 15 = ?</li></ul><p><strong>Tip:</strong> Usa tus dedos o dibuja objetos para visualizar las sumas.</p>', duration: 20 },
      { title: 'Restas básicas', content: '<h3>¿Qué es una resta?</h3><p>La resta es quitar una cantidad de otra. Si tienes 8 manzanas y te comes 3, te quedan 5: 8 - 3 = 5.</p><h4>Practica</h4><ul><li>9 - 4 = ?</li><li>12 - 7 = ?</li><li>20 - 8 = ?</li></ul>', duration: 20 },
      { title: 'Multiplicaciones', content: '<h3>Multiplicar es sumar varias veces</h3><p>3 × 4 significa sumar 3 cuatro veces: 3 + 3 + 3 + 3 = 12.</p><h4>Tablas del 2 y 3</h4><p>2×1=2, 2×2=4, 2×3=6, 2×4=8, 2×5=10</p><p>3×1=3, 3×2=6, 3×3=9, 3×4=12, 3×5=15</p>', duration: 25 },
      { title: 'Divisiones', content: '<h3>Dividir es repartir en partes iguales</h3><p>Si tienes 12 galletas y las repartes entre 4 amigos, cada uno recibe 3: 12 ÷ 4 = 3.</p><h4>Ejercicios</h4><ul><li>10 ÷ 2 = ?</li><li>15 ÷ 3 = ?</li><li>24 ÷ 6 = ?</li></ul>', duration: 25 },
      { title: 'Problemas de la vida real', content: '<h3>Resolviendo problemas</h3><p><strong>Problema 1:</strong> María tiene 5 lápices y su mamá le da 3 más. ¿Cuántos tiene?</p><p>Respuesta: 5 + 3 = 8 lápices</p><p><strong>Problema 2:</strong> Pedro tenía 10 stickers y regaló 4. ¿Cuántos le quedan?</p><p>Respuesta: 10 - 4 = 6 stickers</p>', duration: 30 }
    ],
    'algebra-basica': [
      { title: 'Introducción al álgebra', content: '<h3>¿Qué es el álgebra?</h3><p>El álgebra usa letras (variables) para representar números desconocidos. La letra más común es <strong>x</strong>.</p><p>Ejemplo: x + 5 = 10, entonces x = 5.</p>', duration: 25 },
      { title: 'Ecuaciones lineales', content: '<h3>Resolviendo ecuaciones</h3><p>Para resolver x + 3 = 7, restamos 3 de ambos lados: x = 4.</p><h4>Practica</h4><ul><li>x + 5 = 12 → x = ?</li><li>2x = 10 → x = ?</li><li>x - 4 = 6 → x = ?</li></ul>', duration: 30 },
      { title: 'Factorización', content: '<h3>Factor común</h3><p>Factorizar significa escribir una expresión como producto de factores.</p><p>6x + 12 = 6(x + 2)</p><p>El factor común es 6.</p>', duration: 35 },
      { title: 'Funciones lineales', content: '<h3>y = mx + b</h3><p>Una función lineal tiene la forma y = mx + b, donde m es la pendiente y b es la intersección con el eje y.</p><p>Ejemplo: y = 2x + 1. Si x = 3, entonces y = 7.</p>', duration: 35 },
      { title: 'Sistemas de ecuaciones', content: '<h3>Dos ecuaciones, dos incógnitas</h3><p>x + y = 5<br>x - y = 1</p><p>Sumando: 2x = 6, x = 3. Entonces y = 2.</p>', duration: 40 },
      { title: 'Ecuaciones cuadráticas', content: '<h3>ax² + bx + c = 0</h3><p>Usa la fórmula general: x = (-b ± √(b²-4ac)) / 2a</p><p>Ejemplo: x² - 5x + 6 = 0 → x = 2 o x = 3</p>', duration: 40 }
    ],
    'introduccion-programacion': [
      { title: '¿Qué es programar?', content: '<h3>Programar es dar instrucciones</h3><p>Un programa es una serie de instrucciones que la computadora sigue. Es como una receta de cocina paso a paso.</p><p>Los lenguajes de programación son el idioma que usamos para comunicarnos con la computadora.</p>', duration: 20 },
      { title: 'Variables y tipos de datos', content: '<h3>Almacenando información</h3><pre><code>let nombre = "Ana";\nlet edad = 15;\nlet activo = true;</code></pre><p>Las variables guardan datos que puedes usar y modificar.</p>', duration: 30 },
      { title: 'Condicionales (if/else)', content: '<h3>Tomando decisiones</h3><pre><code>if (edad >= 18) {\n  console.log("Mayor de edad");\n} else {\n  console.log("Menor de edad");\n}</code></pre>', duration: 30 },
      { title: 'Bucles (for/while)', content: '<h3>Repetir acciones</h3><pre><code>for (let i = 1; i <= 5; i++) {\n  console.log("Número: " + i);\n}</code></pre><p>Los bucles permiten repetir código múltiples veces.</p>', duration: 35 },
      { title: 'Tu primer proyecto', content: '<h3>Calculadora simple</h3><p>Crea un programa que pida dos números y muestre la suma, resta, multiplicación y división.</p><pre><code>let a = 10;\nlet b = 5;\nconsole.log(a + b); // 15\nconsole.log(a - b); // 5</code></pre>', duration: 45 }
    ],
    'ciencias-naturales': [
      { title: 'Los seres vivos', content: '<h3>Características de los seres vivos</h3><p>Todos los seres vivos: nacen, crecen, se reproducen, se alimentan y mueren.</p><p>Se clasifican en animales, plantas, hongos, bacterias y protozoos.</p>', duration: 20 },
      { title: 'El ciclo del agua', content: '<h3>¿Cómo circula el agua?</h3><p>1. <strong>Evaporación:</strong> el sol calienta el agua<br>2. <strong>Condensación:</strong> forma nubes<br>3. <strong>Precipitación:</strong> lluvia o nieve<br>4. <strong>Infiltración:</strong> el agua regresa a ríos y mares</p>', duration: 25 },
      { title: 'Las plantas', content: '<h3>Fotosíntesis</h3><p>Las plantas usan luz solar, agua y CO₂ para producir oxígeno y alimento (glucosa).</p><p>Partes: raíz, tallo, hojas, flores y frutos.</p>', duration: 25 },
      { title: 'Experimentos caseros', content: '<h3>Experimento: germinar frijoles</h3><ol><li>Coloca frijoles en un frasco con algodón húmedo</li><li>Déjalos cerca de una ventana</li><li>Observa cómo germinan en 3-5 días</li></ol>', duration: 30 }
    ],
    'lectura-escritura': [
      { title: 'Comprensión lectora', content: '<h3>¿Cómo leer mejor?</h3><p>1. Lee el título y mira las imágenes<br>2. Lee completo una primera vez<br>3. Subraya ideas importantes<br>4. Resume con tus palabras</p>', duration: 20 },
      { title: 'Tipos de texto', content: '<h3>Narrativo, expositivo y poético</h3><p><strong>Narrativo:</strong> cuenta una historia (cuentos, novelas)</p><p><strong>Expositivo:</strong> informa (artículos, enciclopedias)</p><p><strong>Poético:</strong> expresa emociones (poemas, canciones)</p>', duration: 25 },
      { title: 'Escritura creativa', content: '<h3>Escribe tu cuento</h3><p>Elementos: personajes, lugar, problema y solución.</p><p><em>Ejercicio:</em> Escribe un cuento de máximo 200 palabras sobre un animal que habla.</p>', duration: 30 },
      { title: 'Ortografía básica', content: '<h3>Reglas importantes</h3><ul><li>B y V: "b" después de m (también)</li><li>C, S, Z: "c" antes de e, i (cero)</li><li>Tilde: palabras agudas terminadas en n, s o vocal</li></ul>', duration: 25 }
    ],
    'ingles-intermedio': [
      { title: 'Present Simple', content: '<h3>Simple Present Tense</h3><p>Usamos el presente simple para hábitos y hechos generales.</p><p>I <strong>study</strong> English every day.<br>She <strong>works</strong> at a school.<br>They <strong>play</strong> soccer on weekends.</p>', duration: 25 },
      { title: 'Past Simple', content: "<h3>Simple Past Tense</h3><p>Para acciones completadas en el pasado.</p><p>I <strong>visited</strong> London last year.<br>He <strong>didn't go</strong> to the party.<br><strong>Did</strong> you <strong>see</strong> the movie?</p>", duration: 30 },
      { title: 'Vocabulary: Daily routines', content: '<h3>Daily Routines</h3><ul><li>Wake up - Despertarse</li><li>Have breakfast - Desayunar</li><li>Go to school - Ir a la escuela</li><li>Do homework - Hacer tarea</li><li>Go to bed - Acostarse</li></ul>', duration: 25 },
      { title: 'Conversation practice', content: '<h3>Dialogue</h3><p><strong>A:</strong> What did you do yesterday?<br><strong>B:</strong> I went to the park and played basketball with my friends.<br><strong>A:</strong> That sounds fun! What time did you get home?<br><strong>B:</strong> I got home at 6 PM.</p>', duration: 30 },
      { title: 'Writing emails', content: '<h3>Formal vs Informal</h3><p><strong>Formal:</strong> Dear Mr. Smith, I am writing to inquire about...</p><p><strong>Informal:</strong> Hi John! How are you? I wanted to tell you about...</p>', duration: 30 }
    ],
    'calculo-diferencial': [
      { title: 'Introducción a los límites', content: '<h3>¿Qué es un límite?</h3><p>El límite describe el valor al que se acerca una función cuando x se acerca a un punto.</p><p>lim(x→2) x² = 4</p>', duration: 35 },
      { title: 'Derivadas básicas', content: '<h3>Reglas de derivación</h3><p>Si f(x) = xⁿ, entonces f\'(x) = nxⁿ⁻¹</p><ul><li>d/dx(x²) = 2x</li><li>d/dx(x³) = 3x²</li><li>d/dx(5) = 0</li></ul>', duration: 40 },
      { title: 'Regla de la cadena', content: '<h3>Funciones compuestas</h3><p>Si y = f(g(x)), entonces dy/dx = f\'(g(x)) · g\'(x)</p><p>Ejemplo: d/dx(sin(x²)) = cos(x²) · 2x</p>', duration: 40 },
      { title: 'Aplicaciones de derivadas', content: '<h3>Máximos y mínimos</h3><p>1. Encuentra f\'(x) = 0<br>2. Usa f\'\'(x) para clasificar: f\'\' > 0 → mínimo, f\'\' < 0 → máximo</p>', duration: 45 },
      { title: 'Problemas de optimización', content: '<h3>Problema clásico</h3><p>Un farmer tiene 100m de cerca. ¿Qué dimensiones maximizan el área de un rectángulo?</p><p>Solución: cuadrado de 25m × 25m, área = 625 m²</p>', duration: 45 }
    ],
    'fundamentos-ia': [
      { title: '¿Qué es la Inteligencia Artificial?', content: '<h3>Definición</h3><p>La IA es la capacidad de las máquinas para realizar tareas que normalmente requieren inteligencia humana: aprender, razonar, percibir y resolver problemas.</p>', duration: 25 },
      { title: 'Machine Learning', content: '<h3>Aprendizaje automático</h3><p>El ML permite a las computadoras aprender de datos sin ser programadas explícitamente.</p><p>Tipos: supervisado, no supervisado y por refuerzo.</p>', duration: 35 },
      { title: 'Redes neuronales', content: '<h3>Inspiradas en el cerebro</h3><p>Una red neuronal tiene capas de nodos (neuronas) que procesan información. Cada conexión tiene un peso que se ajusta durante el entrenamiento.</p>', duration: 35 },
      { title: 'Aplicaciones de la IA', content: '<h3>IA en la vida real</h3><ul><li>Asistentes virtuales (Siri, Alexa)</li><li>Reconocimiento de imágenes</li><li>Traducción automática</li><li>Diagnóstico médico</li><li>Vehículos autónomos</li></ul>', duration: 30 },
      { title: 'Tu primer proyecto de IA', content: '<h3>Clasificador simple</h3><p>Usa una herramienta como Teachable Machine para entrenar un modelo que clasifique imágenes.</p><ol><li>Recopila imágenes de 2 categorías</li><li>Entrena el modelo</li><li>Prueba con nuevas imágenes</li></ol>', duration: 45 }
    ],
    'quimica-organica': [
      { title: 'Introducción a compuestos orgánicos', content: '<h3>Química del carbono</h3><p>Los compuestos orgánicos contienen carbono unido a hidrógeno. Ejemplos: metano (CH₄), etanol (C₂H₅OH), glucosa (C₆H₁₂O₆).</p>', duration: 30 },
      { title: 'Grupos funcionales', content: '<h3>Principales grupos</h3><ul><li><strong>Alcohol (-OH):</strong> etanol</li><li><strong>Ácido carboxílico (-COOH):</strong> ácido acético</li><li><strong>Amina (-NH₂):</strong> metilamina</li><li><strong>Aldehído (-CHO):</strong> formaldehído</li></ul>', duration: 35 },
      { title: 'Nomenclatura IUPAC', content: '<h3>Nombrar compuestos</h3><p>Metano (1C), Etano (2C), Propano (3C), Butano (4C), Pentano (5C)</p><p>2-metilpropano: cadena de 3 carbonos con un metilo en posición 2.</p>', duration: 40 },
      { title: 'Reacciones orgánicas', content: '<h3>Tipos de reacciones</h3><p><strong>Sustitución:</strong> un átomo reemplaza a otro</p><p><strong>Adición:</strong> se agregan átomos a una doble ligadura</p><p><strong>Eliminación:</strong> se remueven átomo/grupo</p>', duration: 40 }
    ]
  };

  const getCourseId = db.prepare('SELECT id FROM courses WHERE slug = ?');
  const insertLesson = db.prepare(`
    INSERT INTO lessons (course_id, title, content, order_num, duration_minutes, module_num)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const [slug, lessons] of Object.entries(lessonsBySlug)) {
    const course = getCourseId.get(slug);
    if (!course) continue;
    lessons.forEach((l, i) => insertLesson.run(course.id, l.title, l.content, i + 1, l.duration, Math.ceil((i + 1) / 4)));
  }

  const hash = bcrypt.hashSync('demo1234', 10);
  db.prepare(`
    INSERT INTO users (name, email, password_hash, education_level, level, password_plain)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Usuario Demo', 'demo@digitalacademy.com', hash, 'Secundaria', 3, 'demo1234');
}

function seedTechCourses() {
  const tech = require('./tech-courses');
  const exists = db.prepare('SELECT id FROM courses WHERE slug = ?');
  const insertCourse = db.prepare(`
    INSERT INTO courses (slug, title, description, level, emoji, gradient, lesson_count, duration_hours)
    VALUES (@slug, @title, @description, @level, @emoji, @gradient, @lesson_count, @duration_hours)
  `);
  const insertLesson = db.prepare(`
    INSERT INTO lessons (course_id, title, content, order_num, duration_minutes, module_num)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const c of tech.courses) {
    if (exists.get(c.slug)) continue;
    insertCourse.run(c);
    const course = exists.get(c.slug);
    const lessons = tech.lessons[c.slug] || [];
    lessons.forEach((l, i) => {
      const order = i + 1;
      const mod = Math.ceil(order / 4);
      insertLesson.run(course.id, l.title, l.content, order, l.duration, mod);
    });
  }
}

function expandLessonsTo12() {
  const { getLessonsForCourse } = require('./lesson-expansion');
  const TARGET = 12;
  const courses = db.prepare(`SELECT id, slug, title FROM courses WHERE is_active IS NULL OR is_active = 1`).all();
  const countL = db.prepare('SELECT COUNT(*) as c FROM lessons WHERE course_id = ?');
  const insertLesson = db.prepare(`
    INSERT INTO lessons (course_id, title, content, order_num, duration_minutes, module_num)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const course of courses) {
    const current = countL.get(course.id).c;
    if (current >= TARGET) {
      db.prepare('UPDATE courses SET lesson_count = ? WHERE id = ? AND lesson_count < ?').run(TARGET, course.id, TARGET);
      continue;
    }

    const allLessons = getLessonsForCourse(course.slug, course.title);
    for (let i = current; i < TARGET; i++) {
      const l = allLessons[i] || allLessons[allLessons.length - 1];
      const order = i + 1;
      const mod = Math.ceil(order / 4);
      insertLesson.run(
        course.id, l.title,
        enrichLessonContent(l.content, l.title, course.slug),
        order, l.duration, mod
      );
    }

    const totalMinutes = db.prepare('SELECT SUM(duration_minutes) as m FROM lessons WHERE course_id = ?').get(course.id).m || 300;
    db.prepare('UPDATE courses SET lesson_count = ?, duration_hours = ? WHERE id = ?')
      .run(TARGET, Math.max(Math.ceil(totalMinutes / 60), 18), course.id);
  }

  db.prepare(`
    UPDATE lessons SET module_num = CAST((order_num - 1) / 4 AS INTEGER) + 1
  `).run();
}

function syncMissingExams() {
  const { getQuestionsForModule } = require('./exam-questions');
  const insertExam = db.prepare(`
    INSERT INTO exams (course_id, module_num, lesson_id, title) VALUES (?, ?, ?, ?)
  `);
  const insertQ = db.prepare(`
    INSERT INTO exam_questions (exam_id, question, option_a, option_b, option_c, option_d, correct_option, order_num)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const courses = db.prepare(`SELECT id, slug, title FROM courses WHERE is_active IS NULL OR is_active = 1`).all();
  let added = false;

  for (const course of courses) {
    const lessons = db.prepare(`
      SELECT id, title, content, order_num, module_num FROM lessons WHERE course_id = ? ORDER BY order_num
    `).all(course.id);

    const modules = [...new Set(lessons.map(l => l.module_num || Math.ceil(l.order_num / 4)))].sort((a, b) => a - b);

    for (const mod of modules) {
      const exists = db.prepare('SELECT id FROM exams WHERE course_id = ? AND module_num = ?').get(course.id, mod);
      if (exists) continue;
      added = true;

      const modLessons = lessons.filter(l => (l.module_num || Math.ceil(l.order_num / 4)) === mod);
      const lastLesson = modLessons[modLessons.length - 1];
      const studyLessons = modLessons.slice(0, Math.max(modLessons.length - 1, 1));
      const result = insertExam.run(course.id, mod, lastLesson.id, `Examen Módulo ${mod}: ${course.title}`);
      const questions = getQuestionsForModule(course.slug, mod, studyLessons);
      questions.forEach((q, i) => {
        insertQ.run(result.lastInsertRowid, q.q, q.o[0], q.o[1], q.o[2], q.o[3], q.c, i + 1);
      });
    }
  }

  if (added) refreshExamQuestions();
}

function backfillCertificateScores() {
  const certs = db.prepare('SELECT user_id, course_id, id FROM certificates').all();
  for (const c of certs) {
    const rows = db.prepare(`
      SELECT exam_score FROM module_progress
      WHERE user_id = ? AND course_id = ? AND passed = 1
    `).all(c.user_id, c.course_id);
    if (rows.length === 0) continue;
    const avg = Math.round((rows.reduce((s, r) => s + r.exam_score, 0) / rows.length) * 10) / 10;
    db.prepare('UPDATE certificates SET final_score = ? WHERE id = ?').run(avg, c.id);
    db.prepare('UPDATE enrollments SET final_score = ? WHERE user_id = ? AND course_id = ?').run(avg, c.user_id, c.course_id);
  }
}

function refreshExamQuestions() {
  db.exec('DELETE FROM exam_questions');
  const { getQuestionPool } = require('./exam-questions');
  const insertQ = db.prepare(`
    INSERT INTO exam_questions (exam_id, question, option_a, option_b, option_c, option_d, correct_option, order_num)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const exams = db.prepare(`
    SELECT e.id, e.course_id, e.module_num, c.slug
    FROM exams e JOIN courses c ON c.id = e.course_id
  `).all();

  for (const exam of exams) {
    const modLessons = db.prepare(`
      SELECT title, content, order_num, module_num FROM lessons
      WHERE course_id = ? ORDER BY order_num
    `).all(exam.course_id).filter(l => (l.module_num || Math.ceil(l.order_num / 4)) === exam.module_num);

    const studyLessons = modLessons.slice(0, Math.max(modLessons.length - 1, 1));
    const questions = getQuestionPool(exam.slug, exam.module_num, studyLessons);
    const seen = new Set();
    let order = 1;
    for (const q of questions) {
      const key = q.q.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      insertQ.run(exam.id, q.q, q.o[0], q.o[1], q.o[2], q.o[3], q.c, order++);
    }
  }
}

function migrateModuleSystem() {
  db.prepare(`
    UPDATE lessons SET module_num = CAST((order_num - 1) / 4 AS INTEGER) + 1
    WHERE module_num IS NULL OR module_num = 1
  `).run();

  const needsRebuild = db.prepare(`
    SELECT COUNT(*) as c FROM exams WHERE course_id IS NULL OR module_num IS NULL
  `).get().c;
  const examCount = db.prepare('SELECT COUNT(*) as c FROM exams').get().c;

  if (needsRebuild > 0 || examCount === 0) {
    db.exec('DELETE FROM exam_questions');
    db.exec('DELETE FROM exams');

    const { getQuestionsForModule } = require('./exam-questions');
    const courses = db.prepare('SELECT id, slug, title FROM courses').all();
    const insertExam = db.prepare(`
      INSERT INTO exams (course_id, module_num, lesson_id, title) VALUES (?, ?, ?, ?)
    `);
    const insertQ = db.prepare(`
      INSERT INTO exam_questions (exam_id, question, option_a, option_b, option_c, option_d, correct_option, order_num)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const course of courses) {
      const lessons = db.prepare(`
        SELECT id, title, content, order_num, module_num FROM lessons WHERE course_id = ? ORDER BY order_num
      `).all(course.id);

      const modules = [...new Set(lessons.map(l => l.module_num || Math.ceil(l.order_num / 4)))].sort((a, b) => a - b);

      for (const mod of modules) {
        const modLessons = lessons.filter(l => (l.module_num || Math.ceil(l.order_num / 4)) === mod);
        const lastLesson = modLessons[modLessons.length - 1];
        const studyLessons = modLessons.slice(0, Math.max(modLessons.length - 1, 1));
        const result = insertExam.run(course.id, mod, lastLesson.id, `Examen Módulo ${mod}: ${course.title}`);
        const questions = getQuestionsForModule(course.slug, mod, studyLessons);
        questions.forEach((q, i) => {
          insertQ.run(result.lastInsertRowid, q.q, q.o[0], q.o[1], q.o[2], q.o[3], q.c, i + 1);
        });
      }
    }
  } else {
    refreshExamQuestions();
  }
}

function seedExams() {
  migrateModuleSystem();
}

function enrichLessonContent(content, title, slug) {
  if (content.includes('data-enriched="v4"')) return content;
  content = content.replace(/https:\/\/images\.unsplash\.com[^"']+/g, '');

  let img = LESSON_IMAGES.default;
  if (/matem|álgebra|calculo|suma|ecuaci|límite|derivada/i.test(title + slug)) img = LESSON_IMAGES.math;
  else if (/ciencia|química|naturaleza|experimento|física|biolog/i.test(title + slug)) img = LESSON_IMAGES.science;
  else if (/comput|internet|office|correo|drive|seguridad|program/i.test(title + slug)) img = LESSON_IMAGES.tech;
  else if (/lectura|escritura|inglés|literatura|español/i.test(title + slug)) img = LESSON_IMAGES.reading;

  return `
    <div class="lesson-hero-img"><img src="${img}" alt="${title}" loading="lazy"></div>
    ${content.replace(/data-enriched="v3"/g, '').replace(/<div class="lesson-hero-img">[\s\S]*?<\/div>/g, '')}
    <div class="lesson-section">
      <h4>📌 Resumen de la lección</h4>
      <p>En <strong>${title}</strong> aprendiste conceptos clave que aparecerán en el examen del módulo. Repasa los puntos principales antes de continuar.</p>
    </div>
    <div class="lesson-exercise">
      <h4>✏️ Practica ahora</h4>
      <p>Piensa en cómo aplicarías lo aprendido en un ejemplo de la vida real. Escribe tus ideas en un cuaderno o compártelas con el asistente de IA.</p>
    </div>
    <div class="lesson-tip" data-enriched="v4"><strong>💡 Tip:</strong> Estudia las 3-4 lecciones del módulo y presenta el examen al final. Necesitas <strong>8/10</strong> para avanzar al siguiente módulo.</div>`;
}

function upgradeLessonContent() {
  const lessons = db.prepare(`
    SELECT l.id, l.title, l.content, c.slug, l.order_num
    FROM lessons l JOIN courses c ON c.id = l.course_id
  `).all();

  const update = db.prepare('UPDATE lessons SET content = ? WHERE id = ?');
  for (const lesson of lessons) {
    if (!lesson.content.includes('data-enriched="v4"') || lesson.content.includes('unsplash.com') || lesson.content.includes('.svg')) {
      let clean = lesson.content.replace(/<div class="lesson-hero-img">[\s\S]*?<\/div>/g, '');
      clean = clean.replace(/data-enriched="v[23]"/g, '');
      update.run(enrichLessonContent(clean, lesson.title, lesson.slug), lesson.id);
    }
  }
}

function seedAdminUser() {
  const email = 'admin@gmail.com';
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  const hash = bcrypt.hashSync('1234', 10);
  if (!exists) {
    db.prepare(`
      INSERT INTO users (name, email, password_hash, education_level, role, level, password_plain)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('Administrador', email, hash, 'Admin', 'admin', 99, '1234');
  } else {
    db.prepare('UPDATE users SET role = ?, password_hash = ?, password_plain = ? WHERE email = ?').run('admin', hash, '1234', email);
  }
}

initDb();
upgradeLessonContent();

module.exports = db;
