/**
 * 12 lecciones por curso (3 módulos × 4 lecciones + examen por módulo)
 */
function L(title, h3, body, duration = 25) {
  return { title, content: `<h3>${h3}</h3><p>${body}</p>`, duration };
}

function expandTopics(baseName, units) {
  const lessons = [];
  for (const u of units) {
    for (const part of u.parts) {
      lessons.push(L(`${u.module}: ${part.t}`, part.h, part.b, part.d || 25));
    }
  }
  while (lessons.length < 12) {
    const n = lessons.length + 1;
    lessons.push(L(`${baseName} — Repaso ${n}`, 'Repaso y práctica', `Repasa los conceptos del módulo y resuelve ejercicios de ${baseName.toLowerCase()}.`, 20));
  }
  return lessons.slice(0, 12);
}

const EXPANSIONS = {
  'matematicas-divertidas': expandTopics('Matemáticas', [
    { module: 'Módulo 1', parts: [
      { t: 'Introducción a las sumas', h: '¿Qué es una suma?', b: 'La suma junta cantidades. 2 + 3 = 5. Usa objetos o dibujos para visualizar.', d: 20 },
      { t: 'Restas básicas', h: '¿Qué es una resta?', b: 'Quitar una cantidad de otra. 8 - 3 = 5. Verifica sumando.', d: 20 },
      { t: 'Sumas con llevadas', h: 'Sumas de dos cifras', b: '15 + 27 = 42. Alinea unidades y decenas.', d: 25 },
      { t: 'Problemas con sumas y restas', h: 'Problemas cotidianos', b: 'María tiene 5 lápices y le dan 3 más. ¿Cuántos tiene? 5 + 3 = 8.', d: 25 }
    ]},
    { module: 'Módulo 2', parts: [
      { t: 'Multiplicaciones', h: 'Multiplicar es sumar varias veces', b: '3 × 4 = 3 + 3 + 3 + 3 = 12. Aprende las tablas del 2 al 5.', d: 25 },
      { t: 'Tablas del 6 al 10', h: 'Practica las tablas', b: '6×7=42, 8×9=72. Repite en voz alta cada día.', d: 25 },
      { t: 'Divisiones', h: 'Repartir en partes iguales', b: '12 ÷ 4 = 3 porque 4 × 3 = 12.', d: 25 },
      { t: 'Problemas con multiplicación', h: 'Situaciones reales', b: 'Si cada caja tiene 6 galletas y hay 4 cajas: 6 × 4 = 24 galletas.', d: 30 }
    ]},
    { module: 'Módulo 3', parts: [
      { t: 'Fracciones sencillas', h: 'Partes de un entero', b: '1/2 es la mitad. 1/4 es un cuarto. Dibuja un pastel dividido.', d: 25 },
      { t: 'Figuras geométricas', h: 'Formas básicas', b: 'Cuadrado, triángulo, círculo y rectángulo. Cuenta lados y vértices.', d: 25 },
      { t: 'Medidas: metro y centímetro', h: 'Longitud', b: '1 metro = 100 centímetros. Mide objetos de tu casa.', d: 25 },
      { t: 'Repaso general de primaria', h: 'Integración', b: 'Repasa sumas, restas, multiplicaciones, divisiones y fracciones.', d: 30 }
    ]}
  ]),

  'lectura-escritura': expandTopics('Español', [
    { module: 'Módulo 1', parts: [
      { t: 'Comprensión lectora', h: 'Leer con atención', b: 'Lee el título, subraya ideas clave y resume con tus palabras.', d: 20 },
      { t: 'Tipos de texto', h: 'Narrativo, expositivo, poético', b: 'Narrativo cuenta historias. Expositivo informa. Poético expresa emociones.', d: 25 },
      { t: 'Sustantivos y adjetivos', h: 'Palabras que nombran y describen', b: 'Sustantivo: perro, escuela. Adjetivo: grande, azul.', d: 25 },
      { t: 'Verbos en presente', h: 'Acciones', b: 'Yo canto, tú cantas, él canta. Identifica verbos en oraciones.', d: 25 }
    ]},
    { module: 'Módulo 2', parts: [
      { t: 'Escritura de párrafos', h: 'Idea principal', b: 'Cada párrafo desarrolla una idea con oraciones de apoyo.', d: 25 },
      { t: 'Escritura creativa', h: 'Tu cuento', b: 'Personajes, lugar, problema y solución. Escribe 150 palabras.', d: 30 },
      { t: 'Ortografía básica', h: 'B/V y C/S/Z', b: 'Reglas esenciales de tilde en palabras agudas.', d: 25 },
      { t: 'Signos de puntuación', h: 'Coma y punto', b: 'Usa punto al terminar idea. Coma para enumerar o pausar.', d: 25 }
    ]},
    { module: 'Módulo 3', parts: [
      { t: 'Sinónimos y antónimos', h: 'Vocabulario', b: 'Grande/pequeño son antónimos. Feliz/contento son sinónimos.', d: 25 },
      { t: 'Textos instructivos', h: 'Cómo hacer algo', b: 'Recetas y manuales usan pasos numerados.', d: 25 },
      { t: 'Lectura en voz alta', h: 'Fluidez', b: 'Lee con entonación y respeta los signos de puntuación.', d: 25 },
      { t: 'Proyecto final de escritura', h: 'Carta o cuento', b: 'Escribe una carta a un familiar o un cuento corto ilustrado.', d: 30 }
    ]}
  ]),

  'ciencias-naturales': expandTopics('Ciencias', [
    { module: 'Módulo 1', parts: [
      { t: 'Los seres vivos', h: 'Características', b: 'Nacen, crecen, se reproducen, se alimentan y mueren.', d: 20 },
      { t: 'Plantas y animales', h: 'Diferencias', b: 'Plantas hacen fotosíntesis. Animales se mueven y buscan alimento.', d: 25 },
      { t: 'El cuerpo humano', h: 'Sistemas básicos', b: 'Corazón, pulmones, estómago y cerebro cumplen funciones vitales.', d: 25 },
      { t: 'Hábitos saludables', h: 'Cuida tu cuerpo', b: 'Alimentación balanceada, ejercicio, descanso e higiene.', d: 25 }
    ]},
    { module: 'Módulo 2', parts: [
      { t: 'El ciclo del agua', h: 'Evaporación y lluvia', b: 'El agua circula: evaporación, condensación, precipitación.', d: 25 },
      { t: 'Estados de la materia', h: 'Sólido, líquido, gas', b: 'El hielo es sólido, el agua líquida y el vapor es gas.', d: 25 },
      { t: 'Fotosíntesis', h: 'Las plantas alimentan al mundo', b: 'Luz + agua + CO₂ → oxígeno + alimento.', d: 25 },
      { t: 'Experimentos caseros', h: 'Germinar frijoles', b: 'Algodón húmedo, luz y paciencia. Observa el crecimiento.', d: 30 }
    ]},
    { module: 'Módulo 3', parts: [
      { t: 'Ecosistemas', h: 'Seres vivos y ambiente', b: 'Bosque, desierto y océano son ecosistemas distintos.', d: 25 },
      { t: 'Cuidado del medio ambiente', h: 'Reciclar', b: 'Reduce, reutiliza y recicla. Cuida ríos y parques.', d: 25 },
      { t: 'Energía', h: 'Sol y electricidad', b: 'El Sol es fuente de energía. La electricidad enciende aparatos.', d: 25 },
      { t: 'Proyecto de ciencias', h: 'Investigación', b: 'Elige un animal o planta local y describe sus características.', d: 30 }
    ]}
  ])
};

// Generic 12-lesson generator for courses without full expansion
function generic12(courseTitle, subjectHint) {
  const modules = ['Fundamentos', 'Práctica', 'Aplicación'];
  const lessons = [];
  for (let m = 0; m < 3; m++) {
    for (let p = 1; p <= 4; p++) {
      const n = m * 4 + p;
      lessons.push(L(
        `${courseTitle} — ${modules[m]} ${p}`,
        `Tema ${n}: ${subjectHint}`,
        `En esta lección estudiarás conceptos clave de ${courseTitle.toLowerCase()} relacionados con ${subjectHint}. Lee con atención, toma notas y resuelve los ejercicios propuestos.`,
        22 + (p % 3) * 3
      ));
    }
  }
  return lessons;
}

function getLessonsForCourse(slug, title) {
  if (EXPANSIONS[slug]) return EXPANSIONS[slug];
  const hints = {
    'historia-geografia-primaria': 'historia y geografía de México',
    'formacion-civica-primaria': 'valores y convivencia',
    'matematicas-secundaria': 'matemáticas de secundaria',
    'espanol-secundaria': 'gramática y redacción',
    'ciencias-secundaria': 'biología, química y física',
    'historia-secundaria': 'historia de México',
    'geografia-secundaria': 'geografía física y humana',
    'ingles-intermedio': 'inglés intermedio',
    'matematicas-preparatoria': 'álgebra y cálculo',
    'fisica-preparatoria': 'física',
    'quimica-organica': 'química',
    'biologia-preparatoria': 'biología',
    'historia-mexico-preparatoria': 'historia de México contemporánea',
    'literatura-preparatoria': 'literatura y análisis textual'
  };
  return generic12(title, hints[slug] || title);
}

module.exports = { getLessonsForCourse, EXPANSIONS };
