const { shuffleQuestionOptions, shuffleAndStoreQuestion, hashSeed } = require('./exam-utils');

function Q(q, o, c, difficulty = 1) {
  return { q, o, c, difficulty };
}

function expandBank(baseQuestions, moduleNum) {
  return baseQuestions.map((item, i) => {
    const q = item.q || item;
    const o = item.o;
    const c = item.c ?? 0;
    const d = item.difficulty || 1;
    if (moduleNum === 1) return shuffleQuestion({ q, o, c, difficulty: d }, hashSeed(q, i, 1));
    const seed = hashSeed(q, i, moduleNum);
    const shuffled = shuffleOpts(o, c, seed);
    const templates = [
      { q: `Repaso: ${q}`, o: shuffled.o, c: shuffled.c },
      { q: `Aplicación práctica: ${q}`, o: shuffled.o, c: shuffled.c },
      { q: `Evaluación: ${q}`, o: shuffled.o, c: shuffled.c }
    ];
    const t = templates[i % templates.length];
    return Q(t.q, t.o, t.c, d + moduleNum);
  });
}

function shuffleOpts(o, c, seed) {
  const { options, correctIndex } = shuffleQuestionOptions(o, c, hashSeed(seed, ...o));
  return { o: options, c: correctIndex };
}

function makeModuleBanks(singleBank) {
  const base = singleBank[0] || singleBank;
  return [
    expandBank(base, 1),
    expandBank(base, 2),
    expandBank(base, 3)
  ];
}

const TECH_QUESTIONS = {
  'uso-basico-computadoras': [
    { q: '¿Qué parte de la computadora muestra la imagen?', o: ['Monitor', 'Teclado', 'Mouse', 'Impresora'], c: 0 },
    { q: '¿Para qué sirve el mouse?', o: ['Señalar y hacer clic', 'Solo escribir', 'Encender la PC', 'Imprimir'], c: 0 },
    { q: '¿Cómo se apaga correctamente una PC con Windows?', o: ['Menú Inicio → Apagar', 'Desconectar el cable', 'Presionar reset', 'Cerrar el monitor'], c: 0 },
    { q: '¿Qué tecla borra un carácter hacia atrás?', o: ['Backspace', 'Enter', 'Espacio', 'Shift'], c: 0 },
    { q: '¿Qué botón cierra una ventana?', o: ['× (equis)', '− (minimizar)', '□ (maximizar)', '+ (más)'], c: 0 }
  ],
  'navegacion-internet': [
    { q: '¿Qué programa usas para ver páginas web?', o: ['Navegador', 'Word', 'Calculadora', 'Paint'], c: 0 },
    { q: '¿Dónde escribes la dirección de un sitio web?', o: ['Barra de direcciones', 'Barra de tareas', 'Escritorio', 'Menú Inicio'], c: 0 },
    { q: 'Google se usa principalmente para:', o: ['Buscar información', 'Escribir documentos', 'Editar fotos', 'Hacer llamadas'], c: 0 },
    { q: '¿Qué indica un sitio seguro?', o: ['Candado y https://', 'Muchos anuncios', 'Ventanas emergentes', 'Sin URL'], c: 0 },
    { q: '¿Qué hace el botón recargar (↻)?', o: ['Actualiza la página', 'Cierra el navegador', 'Borra historial', 'Imprime'], c: 0 }
  ],
  'correo-electronico': [
    { q: '¿Dónde llegan los mensajes nuevos?', o: ['Bandeja de entrada', 'Spam', 'Papelera', 'Archivados'], c: 0 },
    { q: '¿Qué campo indica a quién envías el correo?', o: ['Para', 'Asunto', 'CC', 'Firma'], c: 0 },
    { q: '¿Para qué sirve el "Asunto"?', o: ['Indicar el tema del mensaje', 'Poner contraseña', 'Adjuntar archivos', 'Elegir color'], c: 0 },
    { q: '¿Cómo adjuntas un archivo en Gmail?', o: ['Icono del clip 📎', 'Botón Inicio', 'Tecla F5', 'Doble clic'], c: 0 },
    { q: '¿Qué es el spam?', o: ['Correo no deseado', 'Correos importantes', 'Borradores', 'Contactos'], c: 0 }
  ],
  'microsoft-office': [
    { q: '¿Qué programa usas para escribir un ensayo?', o: ['Word', 'Excel', 'PowerPoint', 'Paint'], c: 0 },
    { q: 'En Excel, ¿qué hace =SUMA(A1:A5)?', o: ['Suma las celdas A1 a A5', 'Resta valores', 'Cuenta letras', 'Borra datos'], c: 0 },
    { q: 'PowerPoint se usa para:', o: ['Presentaciones', 'Hojas de cálculo', 'Correo', 'Internet'], c: 0 },
    { q: '¿Qué atajo guarda un documento?', o: ['Ctrl + S', 'Ctrl + P', 'Ctrl + Z', 'Ctrl + X'], c: 0 },
    { q: 'Extensión de un archivo Word:', o: ['.docx', '.xlsx', '.pptx', '.pdf'], c: 0 }
  ],
  'google-drive': [
    { q: 'Google Drive guarda archivos:', o: ['En la nube', 'Solo en USB', 'Solo en disco duro', 'En el teclado'], c: 0 },
    { q: 'Espacio gratis con Gmail:', o: ['15 GB', '1 GB', '100 GB', '500 MB'], c: 0 },
    { q: 'Google Docs es similar a:', o: ['Microsoft Word', 'Excel', 'PowerPoint', 'Photoshop'], c: 0 },
    { q: 'Para compartir en Drive:', o: ['Compartir y elegir permisos', 'Enviar por fax', 'Imprimir', 'Borrar'], c: 0 },
    { q: 'Ventaja de Google Docs:', o: ['Colaboración en tiempo real', 'Solo sin internet', 'No se comparte', 'No guarda'], c: 0 }
  ],
  'seguridad-digital': [
    { q: 'Contraseña segura:', o: ['Letras, números y símbolos', 'Solo tu nombre', '123456', 'Tu cumpleaños'], c: 0 },
    { q: 'Phishing es:', o: ['Correos falsos para robar datos', 'Antivirus', 'WiFi', 'Navegador'], c: 0 },
    { q: '¿Misma contraseña en todas las cuentas?', o: ['No', 'Sí', 'Solo bancos', 'Solo redes'], c: 0 },
    { q: 'Actualizar el sistema:', o: ['Corrige vulnerabilidades', 'Lo hace más lento', 'No es necesario', 'Solo estética'], c: 0 },
    { q: 'Correo sospechoso:', o: ['No hacer clic en enlaces', 'Dar contraseña', 'Reenviar a todos', 'Descargar adjuntos'], c: 0 }
  ]
};

const MODULE_QUESTIONS = {
  'matematicas-divertidas': [
    [
      { q: '¿Qué es una suma?', o: ['Juntar cantidades', 'Quitar cantidades', 'Repartir', 'Multiplicar'], c: 0 },
      { q: '2 + 3 = ?', o: ['5', '6', '4', '7'], c: 0 },
      { q: '8 - 3 = ?', o: ['5', '6', '4', '11'], c: 0 },
      { q: '3 × 4 = ?', o: ['12', '7', '9', '8'], c: 0 },
      { q: 'Si tienes 8 manzanas y te comes 3, ¿cuántas quedan?', o: ['5', '6', '4', '11'], c: 0 }
    ],
    [
      { q: '12 ÷ 4 = ?', o: ['3', '4', '2', '8'], c: 0 },
      { q: '5 lápices + 3 lápices = ?', o: ['8', '7', '9', '6'], c: 0 },
      { q: '10 - 4 = ?', o: ['6', '5', '7', '4'], c: 0 },
      { q: '3+3+3+3 es lo mismo que:', o: ['3 × 4', '3 + 4', '3 ÷ 4', '3 - 4'], c: 0 },
      { q: 'Repartir galletas entre amigos se llama:', o: ['División', 'Suma', 'Resta', 'Multiplicación'], c: 0 }
    ]
  ],
  'lectura-escritura': [[
    { q: 'Para leer mejor, primero debes:', o: ['Leer el título y mirar imágenes', 'Saltar al final', 'No subrayar nada', 'Leer solo una palabra'], c: 0 },
    { q: 'Un texto narrativo:', o: ['Cuenta una historia', 'Solo informa datos', 'Es una canción', 'No tiene personajes'], c: 0 },
    { q: 'Un cuento necesita:', o: ['Personajes, lugar y problema', 'Solo números', 'Solo dibujos', 'Nada especial'], c: 0 },
    { q: 'Palabra aguda lleva tilde cuando termina en:', o: ['N, S o vocal', 'Solo consonante', 'Nunca lleva', 'Siempre lleva'], c: 0 },
    { q: 'Un texto expositivo sirve para:', o: ['Informar', 'Contar un cuento de miedo', 'Cantar', 'Dibujar'], c: 0 }
  ]],
  'ciencias-naturales': [[
    { q: 'Los seres vivos:', o: ['Nacen, crecen y se alimentan', 'Solo se mueven', 'No cambian', 'No necesitan agua'], c: 0 },
    { q: 'La evaporación forma:', o: ['Nubes', 'Rocas', 'Fuego', 'Metal'], c: 0 },
    { q: 'Las plantas producen oxígeno con:', o: ['Fotosíntesis', 'Digestión', 'Evaporación', 'Fotografía'], c: 0 },
    { q: 'Para germinar frijoles necesitas:', o: ['Algodón húmedo y luz', 'Solo oscuridad', 'Agua hirviendo', 'Sal'], c: 0 },
    { q: 'El ciclo del agua incluye:', o: ['Evaporación y lluvia', 'Solo ríos', 'Solo nieve', 'Solo lagos'], c: 0 }
  ]],
  'historia-geografia-primaria': [[
    { q: 'México está formado por:', o: ['Estados, municipios y localidades', 'Solo ciudades', 'Un solo pueblo', 'Islas únicamente'], c: 0 },
    { q: 'La bandera de México es:', o: ['Tricolor (verde, blanco y rojo)', 'Solo azul', 'Solo amarilla', 'Sin colores'], c: 0 },
    { q: 'El escudo nacional tiene un águila sobre:', o: ['Un nopal', 'Un león', 'Un caballo', 'Una montaña'], c: 0 },
    { q: 'Los recursos naturales de México incluyen:', o: ['Ríos, montañas y mares', 'Solo edificios', 'Solo carreteras', 'Nada natural'], c: 0 },
    { q: 'Tu escuela forma parte de:', o: ['Tu comunidad', 'Otro país', 'Solo tu casa', 'El espacio'], c: 0 }
  ]],
  'formacion-civica-primaria': [[
    { q: 'En la escuela practicamos:', o: ['Respeto y solidaridad', 'Violencia', 'Mentiras', 'Robar'], c: 0 },
    { q: 'Los niños tienen derecho a:', o: ['Educación, salud y jugar', 'No estudiar nunca', 'Faltar siempre', 'Gritar en clase'], c: 0 },
    { q: 'Para resolver conflictos debemos:', o: ['Hablar con calma y escuchar', 'Golpear', 'Gritar', 'Ignorar siempre'], c: 0 },
    { q: 'Cuidar espacios públicos es:', o: ['Participar en la comunidad', 'Opcional e inútil', 'Prohibido', 'Solo para adultos'], c: 0 },
    { q: 'Tus deberes incluyen:', o: ['Estudiar y respetar a los demás', 'No hacer tarea', 'Romper reglas', 'No ir a clase'], c: 0 }
  ]],
  'matematicas-secundaria': [[
    { q: '1/2 en decimal es:', o: ['0.5', '0.2', '1.2', '2.0'], c: 0 },
    { q: 'Si 3 cuadernos cuestan $45, 5 cuestan:', o: ['$75', '$45', '$60', '$90'], c: 0 },
    { q: 'x + 5 = 12, entonces x =', o: ['7', '5', '12', '17'], c: 0 },
    { q: 'Área de un rectángulo =', o: ['Base × altura', 'Base + altura', 'Base ÷ altura', 'Base - altura'], c: 0 },
    { q: '1/4 + 2/4 =', o: ['3/4', '2/4', '1/4', '4/4 siempre'], c: 0 }
  ]],
  'espanol-secundaria': [[
    { q: 'El sujeto de una oración:', o: ['Realiza la acción', 'Es siempre un verbo', 'No existe', 'Solo son adjetivos'], c: 0 },
    { q: 'Un texto argumentativo busca:', o: ['Convencer al lector', 'Solo contar un cuento', 'Listar números', 'No tiene propósito'], c: 0 },
    { q: 'Conectores como "sin embargo" sirven para:', o: ['Unir ideas en un párrafo', 'Terminar el texto', 'Borrar palabras', 'Solo decorar'], c: 0 },
    { q: 'Palabra esdrujula lleva tilde:', o: ['Siempre', 'Nunca', 'Solo si termina en n', 'Solo los lunes'], c: 0 },
    { q: 'El predicado de una oración:', o: ['Dice algo del sujeto', 'Es el nombre', 'Es solo un signo', 'No importa'], c: 0 }
  ]],
  'ciencias-secundaria': [[
    { q: 'La célula es:', o: ['La unidad básica de la vida', 'Un tipo de roca', 'Un planeta', 'Un gas'], c: 0 },
    { q: 'Las plantas tienen cloroplastos para:', o: ['Fotosíntesis', 'Respirar como animales', 'Moverse', 'Dormir'], c: 0 },
    { q: 'Velocidad se calcula como:', o: ['Distancia / tiempo', 'Tiempo × distancia', 'Distancia + tiempo', 'Tiempo - distancia'], c: 0 },
    { q: 'La evaporación es cambio de:', o: ['Líquido a gas', 'Sólido a líquido', 'Gas a sólido', 'No hay cambio'], c: 0 },
    { q: 'En una cadena alimenticia, las plantas son:', o: ['Productores', 'Descomponedores', 'Solo consumidores', 'No participan'], c: 0 }
  ]],
  'historia-secundaria': [[
    { q: 'Tenochtitlan fue una gran ciudad de los:', o: ['Mexicas', 'Romanos', 'Egipcios', 'Vikingos'], c: 0 },
    { q: 'La Independencia de México inició en:', o: ['1810', '1521', '1910', '1600'], c: 0 },
    { q: 'El Grito de Dolores lo dio:', o: ['Miguel Hidalgo', 'Benito Juárez', 'Porfirio Díaz', 'Cuauhtémoc'], c: 0 },
    { q: 'La Conquista española ocurrió alrededor de:', o: ['1519-1521', '1810', '1910', '2000'], c: 0 },
    { q: 'Benito Juárez está relacionado con:', o: ['Leyes de Reforma', 'La Conquista', 'Revolución de 1910', 'Imperio azteca'], c: 0 }
  ]],
  'geografia-secundaria': [[
    { q: 'El Eje Neovolcánico está en:', o: ['México', 'Europa', 'Antártida', 'Australia'], c: 0 },
    { q: 'La altitud influye en:', o: ['El clima de una región', 'Solo el color del cielo', 'Nada', 'Solo los océanos'], c: 0 },
    { q: 'Migración campo-ciudad significa:', o: ['Personas que se mueven a ciudades', 'Animales que vuelan', 'Solo turismo', 'No existe'], c: 0 },
    { q: 'México exporta productos como:', o: ['Petróleo y automóviles', 'Solo nieve', 'Solo hielo', 'Nada'], c: 0 },
    { q: 'Sierra Madre Occidental es parte del:', o: ['Relieve de México', 'Océano Pacífico', 'Espacio exterior', 'Clima tropical únicamente'], c: 0 }
  ]],
  'ingles-intermedio': [[
    { q: 'Present Simple se usa para:', o: ['Hábitos y hechos generales', 'Solo el pasado', 'Solo el futuro', 'Nunca se usa'], c: 0 },
    { q: '"I study English every day" está en:', o: ['Present Simple', 'Past Simple', 'Future', 'Present Continuous'], c: 0 },
    { q: '"Wake up" significa:', o: ['Despertarse', 'Acostarse', 'Desayunar', 'Estudiar'], c: 0 },
    { q: 'Past Simple de "go" es:', o: ['Went', 'Goed', 'Gone', 'Going'], c: 0 },
    { q: 'En un correo formal se escribe:', o: ['Dear Mr. Smith', 'Hey dude!', 'Yo!', 'Nothing'], c: 0 }
  ]],
  'matematicas-preparatoria': [[
    { q: 'En y = mx + b, la m es:', o: ['Pendiente', 'Intercepto', 'Variable y', 'El origen'], c: 0 },
    { q: 'lim(x→2) x² =', o: ['4', '2', '0', '8'], c: 0 },
    { q: 'Derivada de x² es:', o: ['2x', 'x', 'x²', '0'], c: 0 },
    { q: 'sin(θ) en triángulo rectángulo =', o: ['Opuesto / hipotenusa', 'Adyacente / hipotenusa', 'Opuesto / adyacente', 'Hipotenusa / opuesto'], c: 0 },
    { q: '2x = 10, entonces x =', o: ['5', '2', '20', '10'], c: 0 }
  ]],
  'fisica-preparatoria': [[
    { q: 'Segunda ley de Newton: F =', o: ['ma', 'mv', 'm/a', 'a/m'], c: 0 },
    { q: 'Energía cinética Ec =', o: ['½mv²', 'mgh', 'mv', 'F/d'], c: 0 },
    { q: 'Ley de Ohm:', o: ['V = IR', 'V = I/R', 'V = R/I', 'V = I + R'], c: 0 },
    { q: 'Velocidad es cambio de:', o: ['Posición en el tiempo', 'Masa', 'Color', 'Temperatura solamente'], c: 0 },
    { q: 'Energía potencial gravitacional Ep =', o: ['mgh', '½mv²', 'ma', 'IR'], c: 0 }
  ]],
  'quimica-organica': [[
    { q: 'Los compuestos orgánicos contienen:', o: ['Carbono e hidrógeno', 'Solo oxígeno', 'Solo hierro', 'Solo sodio'], c: 0 },
    { q: 'El grupo -OH corresponde a:', o: ['Alcohol', 'Ácido', 'Amina', 'Aldehído'], c: 0 },
    { q: 'Metano (CH₄) es un:', o: ['Hidrocarburo', 'Metal', 'Gas noble siempre', 'Sal'], c: 0 },
    { q: 'Grupo -COOH es:', o: ['Ácido carboxílico', 'Alcohol', 'Amina', 'Éter'], c: 0 },
    { q: 'La química orgánica estudia principalmente:', o: ['Compuestos del carbono', 'Solo agua', 'Solo rocas', 'Solo aire'], c: 0 }
  ]],
  'biologia-preparatoria': [[
    { q: 'La herencia se transmite por:', o: ['Genes y ADN', 'Solo el clima', 'Solo la ropa', 'La edad únicamente'], c: 0 },
    { q: 'Darwin propuso:', o: ['Selección natural', 'Fotosíntesis', 'Ley de Ohm', 'Teoría atómica'], c: 0 },
    { q: 'El sistema circulatorio transporta:', o: ['Sangre y nutrientes', 'Solo aire del estómago', 'Solo agua de lluvia', 'Nada'], c: 0 },
    { q: 'Biodiversidad significa:', o: ['Variedad de seres vivos', 'Un solo animal', 'Solo plantas', 'No hay vida'], c: 0 },
    { q: 'Gen dominante vs recesivo explica:', o: ['Cómo se heredan rasgos', 'Solo el clima', 'Solo mapas', 'Solo historia'], c: 0 }
  ]],
  'historia-mexico-preparatoria': [[
    { q: 'La Revolución Mexicana inició en:', o: ['1910', '1810', '1521', '2000'], c: 0 },
    { q: 'La Constitución de 1917 se promulgó tras:', o: ['La Revolución', 'La Conquista', 'La Independencia', 'El Porfiriato solamente'], c: 0 },
    { q: 'Petroleos Mexicanos se nacionalizó en:', o: ['1938', '1910', '1810', '2020'], c: 0 },
    { q: 'Emiliano Zapata luchó por:', o: ['Tierra y justicia agraria', 'Solo la corona española', 'Conquistar Europa', 'Nada en México'], c: 0 },
    { q: 'México en el siglo XXI enfrenta retos de:', o: ['Globalización y derechos humanos', 'Solo edad de piedra', 'Sin cambios', 'Solo imperio azteca'], c: 0 }
  ]],
  'literatura-preparatoria': [[
    { q: 'El romanticismo en literatura enfatiza:', o: ['Emoción e individualidad', 'Solo matemáticas', 'Solo ciencia', 'Solo deportes'], c: 0 },
    { q: 'Una metáfora es:', o: ['Comparar sin "como"', 'Solo contar datos', 'Un número', 'Un mapa'], c: 0 },
    { q: 'Realismo mágico se asocia con autores como:', o: ['Rulfo y García Márquez', 'Solo Newton', 'Solo Einstein', 'Ningún escritor'], c: 0 },
    { q: 'Un ensayo argumentativo incluye:', o: ['Tesis, argumentos y conclusión', 'Solo rimas', 'Solo dibujos', 'Solo tablas'], c: 0 },
    { q: 'Personificación es:', o: ['Dar cualidades humanas a objetos', 'Solo sumar', 'Solo dividir', 'Un verbo irregular'], c: 0 }
  ]]
};

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractHeading(content) {
  const m = (content || '').match(/<h3[^>]*>(.*?)<\/h3>/i);
  return m ? stripHtml(m[1]) : null;
}

function shuffleQuestion(q, seed) {
  const { options, correctIndex } = shuffleQuestionOptions(q.o, q.c ?? 0, seed);
  return { q: q.q, o: options, c: correctIndex, difficulty: q.difficulty || 1 };
}

function generateFromLessons(lessons, moduleNum = 1) {
  const study = (lessons || []).filter(l => l && l.title);
  if (study.length === 0) return null;

  const questions = [];
  const distractors = ['Tema de otro módulo', 'No se estudió', 'Contenido diferente', 'Sin relación'];

  for (const lesson of study) {
    const heading = extractHeading(lesson.content) || lesson.title;
    const plain = stripHtml(lesson.content);
    const sentences = plain.split(/(?<=[.!?])\s+/).filter(s => s.length > 12);

    const opts1 = [heading, ...distractors.map(d => `${d} (${lesson.title})`)].slice(0, 4);
    questions.push(shuffleQuestion({
      q: `Según "${lesson.title}", ¿cuál es el tema principal?`,
      o: opts1, c: 0, difficulty: moduleNum
    }, hashSeed(lesson.title, 1)));

    if (sentences[0]) {
      const snippet = sentences[0].slice(0, 65);
      const opts2 = [snippet, 'Concepto no visto', 'Lección de otro curso', 'Información incorrecta'];
      questions.push(shuffleQuestion({
        q: `¿Qué aprendiste en "${lesson.title}"?`,
        o: opts2, c: 0, difficulty: moduleNum + 1
      }, hashSeed(lesson.title, 2)));
    }

    if (sentences[1] && moduleNum >= 2) {
      questions.push(shuffleQuestion({
        q: `En "${lesson.title}", ¿cuál idea es clave?`,
        o: [sentences[1].slice(0, 60), 'Ninguna', 'Solo introducción', 'Tema previo'],
        c: 0, difficulty: moduleNum + 2
      }, hashSeed(lesson.title, 3)));
    }
  }

  while (questions.length < 8) {
    const l = study[questions.length % study.length];
    const h = extractHeading(l.content) || l.title;
    questions.push(shuffleQuestion({
      q: `La lección "${l.title}" trata sobre:`,
      o: [h, 'Matemáticas avanzadas', 'Programación', 'Ningún tema'],
      c: 0, difficulty: moduleNum
    }, hashSeed(l.title, questions.length)));
  }

  return questions.slice(0, 10);
}

function getQuestionPool(slug, moduleNum, lessons) {
  const lessonList = Array.isArray(lessons) ? lessons : [];
  const titles = lessonList.map(l => (typeof l === 'string' ? l : l.title));
  let pool = [];

  if (TECH_QUESTIONS[slug]) {
    const tech = TECH_QUESTIONS[slug].map((q, i) => shuffleQuestion({ ...q, difficulty: 1 + moduleNum - 1 }, hashSeed(slug, i, moduleNum)));
    const mod2 = expandBank(TECH_QUESTIONS[slug], Math.min(moduleNum, 3));
    pool = [...tech, ...mod2.map((q, i) => shuffleQuestion(q, hashSeed(slug, i, moduleNum, 99)))];
  } else {
    const bank = MODULE_QUESTIONS[slug];
    if (bank) {
      if (bank[moduleNum - 1]) {
        pool = bank[moduleNum - 1].map((q, i) => shuffleQuestion({ ...q, difficulty: moduleNum }, hashSeed(slug, moduleNum, i)));
      } else if (bank[0]) {
        pool = expandBank(bank[0], moduleNum).map((q, i) => shuffleQuestion(q, hashSeed(slug, moduleNum, i)));
      }
    }
  }

  if (pool.length < 6) {
    const generated = generateFromLessons(lessonList.filter(l => typeof l !== 'string'), moduleNum);
    if (generated) pool = [...pool, ...generated];
  }

  if (pool.length < 5) {
    const topic = titles.join(', ') || 'este módulo';
    const fallback = [
      { q: `¿Cuál es el tema central de este apartado?`, o: [titles[0] || 'El contenido estudiado', 'Ninguno', 'Otro curso', 'No estudié'], c: 0 },
      { q: `¿Qué lecciones incluye este apartado?`, o: [topic, 'Ninguna', 'Otro examen', 'Salté todo'], c: 0 },
      { q: `El concepto principal pertenece a:`, o: ['Este curso', 'Otro nivel escolar', 'No se enseñó', 'Otro país'], c: 0 },
      { q: `Para aprobar debes demostrar:`, o: [titles[titles.length - 1] || 'los temas estudiados', 'Nada', 'Solo adivinar', 'Otros cursos'], c: 0 },
      { q: `¿Qué debiste repasar antes del examen?`, o: ['Las lecciones anteriores', 'Otros exámenes', 'Nada', 'Solo el título'], c: 0 },
      { q: `Integración de conceptos:`, o: [titles[0] || 'Contenido del curso', 'Otro tema', 'Sin estudiar', 'Examen anterior'], c: 0 },
      { q: `Evaluación de comprensión:`, o: [titles[titles.length - 1] || 'Temas estudiados', 'Nada', 'Solo suerte', 'Otros cursos'], c: 0 },
      { q: `Repaso final:`, o: [topic, 'Vacío', 'Irrelevante', 'Omitido'], c: 0 }
    ].map((q, i) => shuffleQuestion({ ...q, difficulty: moduleNum }, hashSeed(slug, moduleNum, i, 42)));
    pool = [...pool, ...fallback];
  }

  const seen = new Set();
  return pool.filter(q => {
    const key = q.q.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getQuestionsForModule(slug, moduleNum, lessons) {
  return getQuestionPool(slug, moduleNum, lessons).slice(0, 8);
}

module.exports = { getQuestionsForModule, getQuestionPool, generateFromLessons };
