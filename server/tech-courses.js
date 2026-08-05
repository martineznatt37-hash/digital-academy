/* Tech training courses — 4 lessons per module + exam */
module.exports = {
  courses: [
    { slug: 'uso-basico-computadoras', title: 'Uso básico de computadoras', description: 'Encender, apagar, usar el mouse y teclado, y navegar por el escritorio con confianza.', level: 'capacitacion', emoji: '🖥️', gradient: 'linear-gradient(135deg,#DBEAFE,#93C5FD)', lesson_count: 4, duration_hours: 6 },
    { slug: 'navegacion-internet', title: 'Navegación en Internet', description: 'Buscar información, usar navegadores web y visitar sitios de forma segura.', level: 'capacitacion', emoji: '🌐', gradient: 'linear-gradient(135deg,#D1FAE5,#6EE7B7)', lesson_count: 4, duration_hours: 5 },
    { slug: 'correo-electronico', title: 'Correo electrónico', description: 'Crear una cuenta, enviar y recibir mensajes, y organizar tu bandeja de entrada.', level: 'capacitacion', emoji: '📧', gradient: 'linear-gradient(135deg,#FEF3C7,#FDE68A)', lesson_count: 4, duration_hours: 4 },
    { slug: 'microsoft-office', title: 'Microsoft Office', description: 'Word, Excel y PowerPoint: crea documentos, hojas de cálculo y presentaciones.', level: 'capacitacion', emoji: '📄', gradient: 'linear-gradient(135deg,#EDE9FE,#C4B5FD)', lesson_count: 4, duration_hours: 8 },
    { slug: 'google-drive', title: 'Google Drive', description: 'Guarda archivos en la nube, comparte documentos y colabora con otros en línea.', level: 'capacitacion', emoji: '☁️', gradient: 'linear-gradient(135deg,#DBEAFE,#60A5FA)', lesson_count: 4, duration_hours: 5 },
    { slug: 'seguridad-digital', title: 'Seguridad digital', description: 'Protege tus contraseñas, identifica amenazas en línea y navega de forma segura.', level: 'capacitacion', emoji: '🔒', gradient: 'linear-gradient(135deg,#FEE2E2,#FECACA)', lesson_count: 4, duration_hours: 4 }
  ],
  lessons: {
    'uso-basico-computadoras': [
      { title: 'Partes de la computadora', content: '<h3>Conoce tu equipo</h3><p><strong>Monitor:</strong> muestra la imagen. <strong>CPU:</strong> el cerebro. <strong>Teclado:</strong> para escribir. <strong>Mouse:</strong> para señalar y hacer clic.</p><h4>Tipos de computadora</h4><ul><li>Desktop (escritorio)</li><li>Laptop (portátil)</li><li>Tablet</li></ul>', duration: 20 },
      { title: 'Encender y apagar', content: '<h3>Prender tu PC</h3><p>1. Presiona el botón de encendido<br>2. Espera a que cargue el escritorio<br>3. Para apagar: Menú Inicio → Apagar</p><p><strong>Importante:</strong> No apagues directamente el botón si puedes evitarlo.</p>', duration: 15 },
      { title: 'Mouse y teclado', content: '<h3>Usar el mouse</h3><p><strong>Clic izquierdo:</strong> seleccionar. <strong>Doble clic:</strong> abrir. <strong>Clic derecho:</strong> menú de opciones.</p><h3>Teclado básico</h3><p>Enter = confirmar, Espacio = separar palabras, Backspace = borrar, Mayús = mayúsculas.</p>', duration: 25 },
      { title: 'El escritorio y ventanas', content: '<h3>Escritorio de Windows</h3><p>Iconos, barra de tareas, botón Inicio. Abre programas haciendo doble clic.</p><h4>Manejar ventanas</h4><ul><li>Minimizar (−)</li><li>Maximizar (□)</li><li>Cerrar (×)</li></ul>', duration: 25 }
    ],
    'navegacion-internet': [
      { title: '¿Qué es Internet?', content: '<h3>Internet</h3><p>Red global de computadoras conectadas. Permite buscar información, ver videos, enviar mensajes y más.</p><p>Necesitas un <strong>navegador</strong> (Chrome, Firefox, Edge) y conexión WiFi o datos.</p>', duration: 20 },
      { title: 'Usar el navegador', content: '<h3>Barra de direcciones</h3><p>Escribe la dirección (URL) del sitio, ej: <code>www.google.com</code> y presiona Enter.</p><h4>Botones útiles</h4><ul><li>← Atrás</li><li>→ Adelante</li><li>↻ Recargar</li><li>★ Favoritos</li></ul>', duration: 20 },
      { title: 'Buscar información', content: '<h3>Motores de búsqueda</h3><p>Google, Bing. Escribe palabras clave específicas: "recetas de tacos fáciles" en lugar de solo "comida".</p><p>Evalúa fuentes: sitios .edu, .gov y medios reconocidos son más confiables.</p>', duration: 25 },
      { title: 'Navegar con seguridad', content: '<h3>Señales de sitios seguros</h3><p>Busca el candado 🔒 y <strong>https://</strong> en la barra de direcciones.</p><ul><li>No descargues archivos desconocidos</li><li>No compartas datos personales en sitios sospechosos</li><li>Cierra ventanas emergentes extrañas</li></ul>', duration: 25 }
    ],
    'correo-electronico': [
      { title: 'Crear una cuenta de correo', content: '<h3>Proveedores populares</h3><p>Gmail, Outlook, Yahoo. Visita su página y elige "Crear cuenta".</p><p>Necesitarás: nombre, contraseña segura y un teléfono para verificación.</p>', duration: 20 },
      { title: 'Interfaz del correo', content: '<h3>Bandeja de entrada</h3><p><strong>Recibidos:</strong> mensajes nuevos. <strong>Enviados:</strong> lo que mandaste. <strong>Spam:</strong> correo no deseado.</p><p>Lee, responde y archiva tus mensajes.</p>', duration: 20 },
      { title: 'Enviar un correo', content: '<h3>Redactar mensaje</h3><p>1. Clic en "Nuevo" o "Redactar"<br>2. <strong>Para:</strong> dirección del destinatario<br>3. <strong>Asunto:</strong> tema breve<br>4. Escribe el mensaje<br>5. Enviar</p>', duration: 25 },
      { title: 'Adjuntos y organización', content: '<h3>Archivos adjuntos</h3><p>Usa el icono de clip 📎 para enviar fotos o documentos (máx. ~25MB en Gmail).</p><h4>Organiza tu correo</h4><ul><li>Crea carpetas/etiquetas</li><li>Marca importantes con estrella</li><li>Elimina spam regularmente</li></ul>', duration: 25 }
    ],
    'microsoft-office': [
      { title: 'Introducción a Word', content: '<h3>Microsoft Word</h3><p>Procesador de textos para cartas, tareas y documentos.</p><ul><li>Escribir y formatear texto</li><li>Negrita, cursiva, subrayado</li><li>Insertar imágenes y tablas</li><li>Guardar con Ctrl+S</li></ul>', duration: 25 },
      { title: 'Excel básico', content: '<h3>Hojas de cálculo</h3><p>Las celdas tienen filas (números) y columnas (letras). A1 es la primera celda.</p><p><strong>Fórmulas:</strong> =SUMA(A1:A5), =PROMEDIO(B1:B10)</p>', duration: 30 },
      { title: 'PowerPoint', content: '<h3>Presentaciones</h3><p>Cada diapositiva es una pantalla. Usa diseños, transiciones y animaciones con moderación.</p><p>Consejo: poco texto, imágenes claras, fuente legible.</p>', duration: 25 },
      { title: 'Guardar y compartir', content: '<h3>Formatos de archivo</h3><p>.docx (Word), .xlsx (Excel), .pptx (PowerPoint). También puedes exportar a PDF.</p><p>Guarda en OneDrive para acceder desde cualquier dispositivo.</p>', duration: 20 }
    ],
    'google-drive': [
      { title: '¿Qué es Google Drive?', content: '<h3>Almacenamiento en la nube</h3><p>Guarda archivos en servidores de Google, accede desde PC, tablet o celular. 15 GB gratis con cuenta Gmail.</p>', duration: 15 },
      { title: 'Subir y organizar archivos', content: '<h3>Gestionar archivos</h3><p>Arrastra archivos a Drive o usa "Nuevo → Subir". Crea carpetas para organizar por proyecto o materia.</p>', duration: 20 },
      { title: 'Google Docs, Sheets y Slides', content: '<h3>Suite ofimática online</h3><p>Similar a Office pero en el navegador. Edición colaborativa en tiempo real con otras personas.</p>', duration: 25 },
      { title: 'Compartir y colaborar', content: '<h3>Compartir archivos</h3><p>Clic derecho → Compartir. Elige permisos: ver, comentar o editar. Genera un enlace o invita por correo.</p>', duration: 25 }
    ],
    'seguridad-digital': [
      { title: 'Contraseñas seguras', content: '<h3>Crea contraseñas fuertes</h3><ul><li>Mínimo 12 caracteres</li><li>Letras, números y símbolos</li><li>Diferente para cada cuenta</li><li>Usa un gestor de contraseñas</li></ul><p>Nunca compartas tu contraseña.</p>', duration: 20 },
      { title: 'Phishing y estafas', content: '<h3>Correos fraudulentos</h3><p>Señales: urgencia, errores ortográficos, remitente extraño, piden datos personales.</p><p>No hagas clic en enlaces sospechosos. Verifica directamente en el sitio oficial.</p>', duration: 25 },
      { title: 'Privacidad en redes', content: '<h3>Protege tu información</h3><ul><li>Revisa configuración de privacidad</li><li>No publiques tu dirección o teléfono</li><li>Cuidado con lo que compartes de otros</li></ul>', duration: 20 },
      { title: 'Antivirus y actualizaciones', content: '<h3>Mantén tu PC segura</h3><p>Instala actualizaciones del sistema. Usa antivirus confiable. Haz respaldos de archivos importantes.</p>', duration: 20 }
    ]
  }
};
