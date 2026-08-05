/**
 * School-aligned curriculum — subjects students actually study per level (SEP México)
 */
module.exports = {
  primaria: [
    { slug: 'matematicas-divertidas', title: 'Matemáticas', description: 'Sumas, restas, multiplicaciones, divisiones y problemas cotidianos de primaria.', emoji: '🔢', gradient: 'linear-gradient(135deg,#DBEAFE,#BFDBFE)', lesson_count: 12, duration_hours: 24 },
    { slug: 'lectura-escritura', title: 'Español', description: 'Lectura, escritura, ortografía y comprensión de textos de primaria.', emoji: '📖', gradient: 'linear-gradient(135deg,#FEF3C7,#FDE68A)', lesson_count: 12, duration_hours: 22 },
    { slug: 'ciencias-naturales', title: 'Ciencias Naturales', description: 'Seres vivos, cuerpo humano, materia, energía y cuidado del medio ambiente.', emoji: '🌱', gradient: 'linear-gradient(135deg,#D1FAE5,#A7F3D0)', lesson_count: 12, duration_hours: 24 },
    { slug: 'historia-geografia-primaria', title: 'Historia y Geografía', description: 'México ayer y hoy, comunidad, entidades federativas y mapas básicos.', emoji: '🗺️', gradient: 'linear-gradient(135deg,#FECACA,#FCA5A5)', lesson_count: 12, duration_hours: 22 },
    { slug: 'formacion-civica-primaria', title: 'Formación Cívica y Ética', description: 'Valores, convivencia, derechos, deberes y participación en la comunidad.', emoji: '🤝', gradient: 'linear-gradient(135deg,#E9D5FF,#C4B5FD)', lesson_count: 12, duration_hours: 20 }
  ],
  secundaria: [
    { slug: 'matematicas-secundaria', title: 'Matemáticas', description: 'Fracciones, decimales, proporciones, ecuaciones y geometría de secundaria.', emoji: '📐', gradient: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)', lesson_count: 12, duration_hours: 28 },
    { slug: 'espanol-secundaria', title: 'Español', description: 'Gramática, redacción, análisis literario y comprensión lectora.', emoji: '📝', gradient: 'linear-gradient(135deg,#FEF3C7,#FDE68A)', lesson_count: 12, duration_hours: 26 },
    { slug: 'ciencias-secundaria', title: 'Ciencias', description: 'Biología, química y física introductoria según el plan de secundaria.', emoji: '🔬', gradient: 'linear-gradient(135deg,#D1FAE5,#6EE7B7)', lesson_count: 12, duration_hours: 28 },
    { slug: 'historia-secundaria', title: 'Historia', description: 'Historia de México: época prehispánica, colonia, independencia y siglo XIX.', emoji: '📜', gradient: 'linear-gradient(135deg,#FECACA,#F87171)', lesson_count: 12, duration_hours: 24 },
    { slug: 'geografia-secundaria', title: 'Geografía', description: 'Relieve, clima, población, recursos naturales y geografía de México.', emoji: '🌎', gradient: 'linear-gradient(135deg,#BFDBFE,#93C5FD)', lesson_count: 12, duration_hours: 24 },
    { slug: 'ingles-intermedio', title: 'Inglés', description: 'Vocabulario, gramática y conversación para estudiantes de secundaria.', emoji: '🇬🇧', gradient: 'linear-gradient(135deg,#FEE2E2,#FECACA)', lesson_count: 12, duration_hours: 26 }
  ],
  preparatoria: [
    { slug: 'matematicas-preparatoria', title: 'Matemáticas', description: 'Álgebra, funciones, trigonometría y cálculo diferencial e integral.', emoji: '📊', gradient: 'linear-gradient(135deg,#EDE9FE,#C4B5FD)', lesson_count: 12, duration_hours: 32 },
    { slug: 'fisica-preparatoria', title: 'Física', description: 'Cinemática, dinámica, energía, electricidad y magnetismo.', emoji: '⚡', gradient: 'linear-gradient(135deg,#DBEAFE,#60A5FA)', lesson_count: 12, duration_hours: 28 },
    { slug: 'quimica-organica', title: 'Química', description: 'Estructura atómica, enlaces, reacciones y química orgánica básica.', emoji: '⚗️', gradient: 'linear-gradient(135deg,#D1FAE5,#6EE7B7)', lesson_count: 12, duration_hours: 28 },
    { slug: 'biologia-preparatoria', title: 'Biología', description: 'Célula, genética, evolución, ecología y sistemas del cuerpo humano.', emoji: '🧬', gradient: 'linear-gradient(135deg,#A7F3D0,#34D399)', lesson_count: 12, duration_hours: 26 },
    { slug: 'historia-mexico-preparatoria', title: 'Historia de México', description: 'México contemporáneo, Revolución, siglo XX y actualidad.', emoji: '🏛️', gradient: 'linear-gradient(135deg,#FECACA,#FCA5A5)', lesson_count: 12, duration_hours: 24 },
    { slug: 'literatura-preparatoria', title: 'Literatura', description: 'Movimientos literarios, análisis de textos y expresión escrita avanzada.', emoji: '📚', gradient: 'linear-gradient(135deg,#FDE68A,#F59E0B)', lesson_count: 12, duration_hours: 24 }
  ],
  reassign: [
    { slug: 'algebra-basica', level: 'secundaria', title: 'Matemáticas (Álgebra)', hidden: true },
    { slug: 'calculo-diferencial', level: 'preparatoria', title: 'Cálculo Diferencial', hidden: true },
    { slug: 'introduccion-programacion', level: 'capacitacion', title: 'Introducción a la Programación' },
    { slug: 'fundamentos-ia', level: 'capacitacion', title: 'Fundamentos de Inteligencia Artificial' }
  ]
};
