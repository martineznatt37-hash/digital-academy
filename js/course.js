/* Course page logic — module-based progression */
document.addEventListener('DOMContentLoaded', async () => {
  const { api, Auth } = window.API;
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    window.location.href = 'index.html#cursos';
    return;
  }

  let courseData = null;
  let currentLessonId = null;
  let selectedRating = 0;

  function checkReviewPrompt() {
    if (!courseData?.canReview || courseData?.userReview) return;
    const modal = document.getElementById('review-modal');
    if (!modal) return;
    modal.style.display = 'flex';

    const stars = document.querySelectorAll('#review-stars button');
    stars.forEach(btn => {
      btn.onclick = () => {
        selectedRating = parseInt(btn.dataset.r, 10);
        stars.forEach((b, i) => b.classList.toggle('active', i < selectedRating));
      };
    });

    document.getElementById('review-skip').onclick = () => { modal.style.display = 'none'; };
    document.getElementById('review-submit').onclick = submitReview;
  }

  async function submitReview() {
    const comment = document.getElementById('review-comment').value.trim();
    if (!selectedRating) { alert('Selecciona una calificación de 1 a 5 estrellas'); return; }
    if (!comment) { alert('Escribe tu opinión'); return; }

    try {
      await api('/reviews', {
        method: 'POST',
        body: JSON.stringify({ course_id: courseData.course.id, rating: selectedRating, comment })
      });
      document.getElementById('review-modal').style.display = 'none';
      alert('¡Gracias! Tu opinión fue publicada en la sección de Opiniones.');
      await loadCourse();
    } catch (err) {
      alert(err.message);
    }
  }

  async function loadCourse() {
    try {
      courseData = await api(`/courses/${slug}`);
      renderCourse();
    } catch {
      document.querySelector('.course-main').innerHTML = '<p>Curso no encontrado. <a href="index.html#cursos">Volver al catálogo</a></p>';
    }
  }

  function groupByModule(lessons) {
    const groups = {};
    for (const l of lessons) {
      const mod = l.module_num || Math.ceil(l.order_num / 4);
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(l);
    }
    return groups;
  }

  function renderCourse() {
    const { course, lessons, enrollment, lessonProgress, isFavorite, finalScore } = courseData;
    const progressMap = Object.fromEntries(lessonProgress.map(p => [p.lesson_id, p]));
    const modules = groupByModule(lessons);

    document.title = `${course.title} — Digital Academy`;
    document.querySelector('.course-hero h1').textContent = course.title;
    document.querySelector('.course-hero p').textContent = course.description;
    document.querySelector('.course-hero .course-level-badge').textContent =
      course.level.charAt(0).toUpperCase() + course.level.slice(1);

    const heroBg = document.getElementById('course-hero-bg');
    if (heroBg && course.cover_image) {
      heroBg.style.backgroundImage = `url('${course.cover_image}')`;
    }

    const moduleCount = Object.keys(modules).length;
    document.querySelector('.course-meta-info').innerHTML = `
      <span>📚 ${lessons.length} lecciones</span>
      <span>📦 ${moduleCount} módulo(s)</span>
      <span>⏱ ${course.duration_hours} horas</span>
      <span>📝 Examen cada 3-4 lecciones</span>
      <span>${course.emoji}</span>
    `;

    const progress = enrollment?.progress_percent || 0;
    document.querySelector('.course-progress-wrap .progress-fill').style.width = `${progress}%`;
    document.querySelector('.course-progress-text').textContent = `${progress}% completado`;

    let gradeBanner = document.getElementById('course-grade-banner');
    if (progress === 100 && finalScore != null) {
      if (!gradeBanner) {
        gradeBanner = document.createElement('div');
        gradeBanner.id = 'course-grade-banner';
        gradeBanner.className = 'course-grade-banner';
        document.querySelector('.course-progress-wrap')?.after(gradeBanner);
      }
      gradeBanner.innerHTML = `
        <div class="course-grade-inner">
          <span class="course-grade-icon">🏆</span>
          <div>
            <strong>¡Curso completado!</strong>
            <p>Calificación final: <span class="course-grade-score">${finalScore}/10</span> (promedio de exámenes)</p>
          </div>
          <a href="profile.html#certificates" class="btn btn-primary btn-sm">Ver certificado</a>
        </div>`;
      gradeBanner.style.display = 'block';
    } else if (gradeBanner) {
      gradeBanner.style.display = 'none';
    }

    const favBtn = document.getElementById('favorite-btn');
    if (favBtn) {
      favBtn.textContent = isFavorite ? '⭐ En favoritos' : '☆ Agregar a favoritos';
      favBtn.onclick = toggleFavorite;
    }

    const enrollBtn = document.getElementById('enroll-btn');
    if (enrollBtn) {
      if (!Auth.isLoggedIn()) {
        enrollBtn.textContent = 'Iniciar sesión para inscribirte';
        enrollBtn.onclick = () => { window.location.href = 'login.html'; };
      } else if (enrollment) {
        enrollBtn.textContent = 'Continuar aprendiendo';
        enrollBtn.onclick = () => openFirstIncomplete(lessons);
      } else {
        enrollBtn.textContent = 'Inscribirme gratis';
        enrollBtn.onclick = enrollCourse;
      }
    }

    const list = document.querySelector('.lesson-list');
    let html = '';
    for (const [mod, modLessons] of Object.entries(modules)) {
      const modPassed = modLessons[0]?.module_passed;
      const examLesson = modLessons.find(l => l.is_exam_lesson);
      const contentLessons = modLessons.filter(l => !l.is_exam_lesson);
      const contentReady = contentLessons.every(l => progressMap[l.id]?.viewed || progressMap[l.id]?.passed);
      const examUnlocked = !modPassed && contentReady && examLesson && !examLesson.locked;

      html += `<div class="module-header">
        <span>Módulo ${mod}${modPassed ? ' ✓' : ''}</span>
        ${examUnlocked ? `<button type="button" class="btn btn-primary btn-sm module-exam-btn" data-lesson-id="${examLesson.id}">📝 Presentar examen</button>` : ''}
        ${modPassed && examLesson ? `<span class="exam-badge">Aprobado ${examLesson.exam_score || ''}/10</span>` : ''}
      </div>`;
      html += modLessons.map(l => {
        const done = l.module_passed;
        const viewed = progressMap[l.id]?.viewed;
        const locked = l.locked;
        const isExam = l.is_exam_lesson;
        const scoreText = l.exam_score ? ` · ${l.exam_score}/10` : '';
        return `
          <div class="lesson-item ${done ? 'completed' : ''} ${locked ? 'locked' : ''} ${viewed && !done ? 'viewed' : ''}" data-lesson-id="${l.id}">
            <div class="lesson-num">${done ? '✓' : locked ? '🔒' : isExam ? '📝' : l.order_num}</div>
            <div class="lesson-info">
              <h4>${l.title}${isExam ? ' <em>(Examen)</em>' : ''}</h4>
              <span>${l.duration_minutes} min${done ? scoreText : ''}</span>
              ${done ? '<span class="exam-badge">Módulo aprobado</span>' : locked ? '<span class="exam-badge" style="color:var(--gray-400)">Bloqueado</span>' : isExam ? '<span class="exam-badge">Examen del módulo</span>' : ''}
            </div>
            ${!locked ? '<button class="btn btn-outline btn-sm lesson-open-btn">Abrir</button>' : ''}
          </div>`;
      }).join('');
    }
    list.innerHTML = html;

    list.querySelectorAll('.lesson-item').forEach(item => {
      const handler = () => {
        if (item.classList.contains('locked')) {
          alert('Completa las lecciones anteriores o aprueba el examen del módulo previo (8/10).');
          return;
        }
        openLesson(parseInt(item.dataset.lessonId, 10));
      };
      item.addEventListener('click', handler);
      item.querySelector('.lesson-open-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        handler();
      });
    });

    list.querySelectorAll('.module-exam-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showExam(parseInt(btn.dataset.lessonId, 10));
      });
    });

    renderCourseIntro(course, lessons, enrollment, modules);

    let reviewBanner = document.getElementById('review-banner');
    if (courseData.canReview && !courseData.userReview) {
      if (!reviewBanner) {
        reviewBanner = document.createElement('div');
        reviewBanner.id = 'review-banner';
        reviewBanner.className = 'review-banner';
        document.querySelector('.course-progress-wrap')?.after(reviewBanner);
      }
      reviewBanner.innerHTML = `
        <p>🎓 ¡Completaste este curso! Comparte tu opinión para ayudar a otros estudiantes.</p>
        <button type="button" class="btn btn-primary btn-sm" id="review-open-btn">Dejar mi opinión</button>`;
      reviewBanner.style.display = 'flex';
      document.getElementById('review-open-btn').onclick = checkReviewPrompt;
    } else if (reviewBanner) {
      reviewBanner.style.display = 'none';
    }
  }

  function renderCourseIntro(course, lessons, enrollment, modules) {
    const intro = document.getElementById('course-intro');
    const introContent = document.querySelector('.course-intro-content');
    const startBtn = document.getElementById('start-course-btn');
    if (!intro || !introContent) return;

    const passedModules = Object.values(modules).filter(m => m[0]?.module_passed).length;
    const moduleCount = Object.keys(modules).length;

    let moduleList = '';
    for (const [mod, modLessons] of Object.entries(modules)) {
      moduleList += `<li><strong>Módulo ${mod}:</strong> ${modLessons.map(l => l.title).join(' → ')} → <em>Examen</em></li>`;
    }

    introContent.innerHTML = `
      <p>${course.description}</p>
      <p><strong>Cómo funciona:</strong> Estudia las 3-4 lecciones de cada módulo y presenta el examen al final. Necesitas <strong>8/10</strong> para avanzar. Las preguntas están relacionadas con el contenido que acabas de ver.</p>
      <p>Obtén <strong>10/10</strong> en el primer módulo para desbloquear tu mascota (búho, lobo o dinosaurio).</p>
      <ul>${moduleList}</ul>
      ${enrollment ? `<p><strong>${passedModules}/${moduleCount}</strong> módulos aprobados</p>` : '<p>Inscríbete para acceder al contenido y exámenes.</p>'}
    `;

    if (!Auth.isLoggedIn()) {
      startBtn.textContent = 'Iniciar sesión para comenzar';
      startBtn.onclick = () => { window.location.href = 'login.html'; };
    } else if (!enrollment) {
      startBtn.textContent = 'Inscribirme y comenzar';
      startBtn.onclick = enrollCourse;
    } else {
      const next = lessons.find(l => !l.locked && !l.module_passed);
      startBtn.textContent = next ? `Continuar: ${next.title}` : 'Repasar curso';
      startBtn.onclick = () => openFirstIncomplete(lessons);
    }

    intro.style.display = currentLessonId ? 'none' : 'block';
  }

  async function enrollCourse() {
    try {
      await api(`/courses/${slug}/enroll`, { method: 'POST' });
      await loadCourse();
      if (courseData.lessons.length > 0) openLesson(courseData.lessons[0].id);
    } catch (err) {
      alert(err.message);
    }
  }

  async function toggleFavorite() {
    if (!Auth.isLoggedIn()) {
      window.location.href = 'login.html';
      return;
    }
    try {
      if (courseData.isFavorite) {
        await api(`/profile/favorites/${courseData.course.id}`, { method: 'DELETE' });
      } else {
        await api(`/profile/favorites/${courseData.course.id}`, { method: 'POST' });
      }
      await loadCourse();
    } catch (err) {
      alert(err.message);
    }
  }

  function openFirstIncomplete(lessons) {
    const next = lessons.find(l => !l.locked);
    openLesson(next ? next.id : lessons[0].id);
  }

  async function openLesson(lessonId) {
    if (!Auth.isLoggedIn()) {
      window.location.href = 'login.html';
      return;
    }

    if (!courseData?.enrollment) {
      alert('Primero debes inscribirte en el curso para acceder a las lecciones.');
      return;
    }

    currentLessonId = lessonId;
    hideExam();

    const viewer = document.querySelector('.lesson-viewer');
    const intro = document.getElementById('course-intro');
    if (intro) intro.style.display = 'none';
    viewer.style.display = 'block';
    viewer.scrollIntoView({ behavior: 'smooth' });

    try {
      const data = await api(`/courses/${slug}/lessons/${lessonId}`);
      await loadCourse();
      renderLesson(data);
    } catch (err) {
      if (err.status === 403) alert(err.message);
      else document.querySelector('.lesson-content').innerHTML = `<p>Error: ${err.message}</p>`;
    }
  }

  function getLessonMeta(lessonId) {
    return courseData?.lessons?.find(l => l.id === lessonId);
  }

  function renderLesson(data) {
    const { lesson, allLessons, is_exam_lesson, module_passed, module_num, exam_score, lessons_in_module } = data;
    document.querySelector('.lesson-viewer h2').textContent = lesson.title;

    let moduleBanner = '';
    if (is_exam_lesson) {
      moduleBanner = `<div class="module-exam-banner">📝 <strong>Lección final del Módulo ${module_num}.</strong> Estudia el contenido y luego presenta el examen (${lessons_in_module} lecciones en este módulo).</div>`;
    } else {
      const examLesson = courseData.lessons.find(l => l.is_exam_lesson && (l.module_num || Math.ceil(l.order_num / 4)) === module_num);
      moduleBanner = `<div class="module-info-banner">📦 Módulo ${module_num} — Avanza lección por lección hasta el examen del módulo.</div>`;
      if (examLesson && lesson.id !== examLesson.id) {
        moduleBanner += `<div class="module-info-banner" style="margin-top:8px;background:#F0FDF4;border-color:#10B981">✅ Al terminar esta lección, continúa hasta: <strong>${examLesson.title}</strong> (examen).</div>`;
      }
    }
    document.querySelector('.lesson-content').innerHTML = moduleBanner + lesson.content;

    window.courseChatContext = {
      courseSlug: slug,
      courseTitle: courseData?.course?.title,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      moduleNum: module_num,
      isExam: is_exam_lesson
    };

    const idx = allLessons.findIndex(l => l.id === lesson.id);
    const prev = allLessons[idx - 1];
    const next = allLessons[idx + 1];

    const prevBtn = document.getElementById('prev-lesson');
    const nextBtn = document.getElementById('next-lesson');
    const examBtn = document.getElementById('start-exam-btn');

    prevBtn.style.display = prev ? '' : 'none';
    prevBtn.disabled = false;
    prevBtn.onclick = () => openLesson(prev.id);

    examBtn.style.display = is_exam_lesson ? '' : 'none';

    if (is_exam_lesson) {
      examBtn.textContent = module_passed
        ? `✓ Módulo aprobado (${exam_score}/10) — Repetir examen`
        : '📝 Presentar examen del módulo';
      examBtn.onclick = () => showExam(lesson.id);
    }

    if (next) {
      const nextMeta = getLessonMeta(next.id);
      nextBtn.style.display = '';
      nextBtn.disabled = false;
      nextBtn.textContent = nextMeta?.is_exam_lesson ? 'Siguiente: Examen del módulo →' : 'Siguiente lección →';
      nextBtn.onclick = () => openLesson(next.id);
    } else if (module_passed) {
      nextBtn.style.display = 'none';
    } else {
      nextBtn.style.display = 'none';
    }
  }

  function hideExam() {
    document.getElementById('exam-viewer').style.display = 'none';
    document.querySelector('.lesson-viewer').style.display = 'block';
    document.getElementById('exam-result').style.display = 'none';
  }

  async function showExam(lessonId) {
    try {
      const examData = await api(`/courses/${slug}/lessons/${lessonId}/exam`);
      document.querySelector('.lesson-viewer').style.display = 'none';
      const examViewer = document.getElementById('exam-viewer');
      examViewer.style.display = 'block';
      examViewer.scrollIntoView({ behavior: 'smooth' });

      const diffLabel = examData.exam.difficulty ? ` · Dificultad: ${examData.exam.difficulty}` : '';
      document.getElementById('exam-title').textContent = examData.exam.title + diffLabel;
      const examSessionId = examData.session_id;
      const form = document.getElementById('exam-form');
      form.dataset.sessionId = examSessionId || '';
      const topicsEl = document.getElementById('exam-topics');
      if (topicsEl && examData.module_lessons) {
        topicsEl.innerHTML = `<strong>Temas del examen:</strong> ${examData.module_lessons.join(', ')}`;
        topicsEl.style.display = 'block';
      }

      form.innerHTML = examData.questions.map((q, i) => `
        <div class="exam-question" data-q-index="${i}">
          <h4>${i + 1}. ${q.question}</h4>
          <div class="exam-options">
            ${q.options.map((opt, j) => `
              <label class="exam-option" data-value="${j}">
                <input type="radio" name="q${i}" value="${j}" style="display:none">
                ${String.fromCharCode(65 + j)}. ${opt}
              </label>
            `).join('')}
          </div>
        </div>
      `).join('');

      form.querySelectorAll('.exam-option').forEach(opt => {
        opt.addEventListener('click', () => {
          const parent = opt.closest('.exam-options');
          parent.querySelectorAll('.exam-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          opt.querySelector('input').checked = true;
        });
      });

      document.getElementById('exam-result').style.display = 'none';
      document.getElementById('back-to-lesson').onclick = hideExam;

      form.onsubmit = async (e) => {
        e.preventDefault();
        await submitExam(lessonId, examData.questions.length, examSessionId);
      };
    } catch (err) {
      alert(err.message);
    }
  }

  async function submitExam(lessonId, totalQuestions, sessionId) {
    const form = document.getElementById('exam-form');
    const sid = sessionId || form?.dataset?.sessionId;
    if (!sid) {
      alert('Sesión de examen expirada. Abre el examen de nuevo e intenta otra vez.');
      return;
    }
    const answers = [];
    for (let i = 0; i < totalQuestions; i++) {
      const selected = form.querySelector(`input[name="q${i}"]:checked`);
      if (!selected) {
        alert(`Responde la pregunta ${i + 1}`);
        return;
      }
      answers.push(parseInt(selected.value, 10));
    }

    const submitBtn = form.closest('.exam-viewer').querySelector('[type="submit"]');
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    try {
      const result = await api(`/courses/${slug}/lessons/${lessonId}/exam`, {
        method: 'POST',
        body: JSON.stringify({ answers, session_id: sid })
      });

      result.results.forEach((r, i) => {
        const question = form.querySelector(`[data-q-index="${i}"]`);
        question.querySelectorAll('.exam-option').forEach((opt, j) => {
          if (j === r.correct_option) opt.classList.add('correct');
          else if (parseInt(opt.dataset.value, 10) === answers[i] && !r.correct) opt.classList.add('incorrect');
        });
      });

      const resultEl = document.getElementById('exam-result');
      resultEl.style.display = 'block';
      resultEl.className = `exam-result ${result.passed ? 'passed' : 'failed'}`;
      resultEl.innerHTML = `
        <div class="score-big">${result.score}/10</div>
        <p><strong>${result.message}</strong></p>
        <p>${result.correctCount} de ${result.totalQuestions} respuestas correctas</p>
        ${result.pendingPetChoice ? '<p class="pet-feed-msg">🎉 ¡Elige tu mascota! Búho, lobo o dinosaurio.</p>' : ''}
        ${result.petFed && !result.pendingPetChoice ? `<p class="pet-feed-msg">🍎 Alimentaste a tu mascota (+${result.correctCount})</p>` : ''}
        ${result.passed ? '<button class="btn btn-primary btn-sm" id="exam-continue">Continuar →</button>' : '<button class="btn btn-outline btn-sm" id="exam-retry">Intentar de nuevo</button>'}
        ${result.courseCompleted ? `<p style="margin-top:12px"><strong>Calificación final del curso: ${result.finalScore}/10</strong></p><p><a href="profile.html#certificates" class="btn btn-outline btn-sm">🎓 Ver y descargar certificado</a></p>` : ''}
      `;

      submitBtn.style.display = 'none';

      if (result.pendingPetChoice && window.petWidget) {
        window.petWidget.showChoiceModal(true);
      } else if (result.petFed && window.petWidget) {
        window.petWidget.refresh();
        window.petWidget.celebrate();
      }

      if (result.passed) {
        document.getElementById('exam-continue')?.addEventListener('click', async () => {
          await loadCourse();
          const idx = courseData.lessons.findIndex(l => l.id === lessonId);
          const next = courseData.lessons[idx + 1];
          if (next && !next.locked) openLesson(next.id);
          else hideExam();
        });
      } else {
        document.getElementById('exam-retry')?.addEventListener('click', () => showExam(lessonId));
      }

      await loadCourse();
      if (result.courseProgress === 100) {
        setTimeout(checkReviewPrompt, 1000);
      }
    } catch (err) {
      alert(err.message);
      submitBtn.textContent = 'Enviar examen';
      submitBtn.disabled = false;
    }
  }

  await loadCourse();
  if (window.API) window.API.updateNavAuth();
});
