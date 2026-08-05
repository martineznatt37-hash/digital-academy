/* Digital Academy — Main JavaScript */

let studyChart = null;

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initRevealAnimations();
  initTutoringForm();
  initProgressBars();
  initMobileMenu();
  loadCoursesFromAPI();
  loadTechCourses();
  loadTestimonials();
  initUserStats();
  initPublicStats();
  if (window.API) window.API.updateNavAuth();
});

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

function initRevealAnimations() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  reveals.forEach((el) => observer.observe(el));
}

function initCourseTabs() {
  const tabs = document.querySelectorAll('.course-tab');
  const cards = document.querySelectorAll('.course-card');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.replaceWith(tab.cloneNode(true));
  });

  document.querySelectorAll('.course-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.course-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const level = tab.dataset.level;
      document.querySelectorAll('.course-card').forEach((card) => {
        const show = level === 'all' || card.dataset.level === level;
        card.style.display = show ? '' : 'none';
        if (show) card.style.animation = 'fadeUp .4s ease both';
      });
    });
  });
}

function renderCourseCard(c) {
  const levelLabel = c.level.charAt(0).toUpperCase() + c.level.slice(1);
  const bgStyle = c.cover_image
    ? `background-image:url('${c.cover_image}');background-size:cover;background-position:center`
    : `background:${c.gradient}`;
  return `
    <article class="course-card" data-level="${c.level}" data-slug="${c.slug}">
      <div class="course-card-image" style="${bgStyle}">
        ${c.cover_image ? '' : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem">${c.emoji}</div>`}
        <span class="course-level">${levelLabel}</span>
      </div>
      <div class="course-card-body">
        <h3>${c.title}</h3>
        <p>${c.description}</p>
        <div class="course-meta">
          <span>📚 ${c.lesson_count} lecciones</span>
          <span>⏱ ${c.duration_hours} horas</span>
        </div>
        <a href="course.html?slug=${c.slug}" class="btn btn-primary btn-sm" style="width:100%">Ver curso</a>
      </div>
    </article>
  `;
}

async function loadTechCourses() {
  const grid = document.querySelector('.tech-grid');
  if (!grid || !window.API) return;

  try {
    const courses = await window.API.api('/courses');
    const tech = courses.filter(c => c.level === 'capacitacion');
    if (tech.length === 0) return;

    grid.innerHTML = tech.map(c => `
      <a href="course.html?slug=${c.slug}" class="tech-card">
        ${c.cover_image ? `<div class="tech-card-cover" style="background-image:url('${c.cover_image}')"></div>` : `<div class="tech-card-icon">${c.emoji}</div>`}
        <h3>${c.title}</h3>
        <p>${c.description}</p>
        <span class="level">${c.lesson_count} lecciones · ${c.duration_hours}h</span>
      </a>
    `).join('');
  } catch {
    /* keep static fallback */
  }
}

async function loadTestimonials() {
  const grid = document.getElementById('testimonials-grid');
  if (!grid || !window.API) return;

  try {
    const reviews = await window.API.api('/reviews');
    if (reviews.length === 0) {
      grid.innerHTML = '<p style="color:var(--gray-500);grid-column:1/-1;text-align:center">Completa un curso y deja tu opinión. ¡Aparecerá aquí!</p>';
      return;
    }

    grid.innerHTML = reviews.map(r => {
      const initials = window.API.getInitials(r.userName);
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      return `
        <div class="testimonial-card">
          <div class="testimonial-stars">${stars}</div>
          <p class="testimonial-text">"${r.comment}"</p>
          <div class="testimonial-author">
            <div class="testimonial-avatar">${initials}</div>
            <div><strong>${r.userName}</strong><span>${r.educationLevel} · ${r.courseTitle}</span></div>
          </div>
        </div>`;
    }).join('');
  } catch {
    grid.innerHTML = '<p style="color:var(--gray-500);grid-column:1/-1;text-align:center">Completa un curso para ver opiniones reales.</p>';
  }
}

async function loadCoursesFromAPI() {
  const grid = document.querySelector('.courses-grid');
  if (!grid || !window.API) return;

  try {
    const courses = await window.API.api('/courses');
    grid.innerHTML = courses.map(renderCourseCard).join('');

    const user = window.API.Auth.getUser();
    const userLevel = user ? window.API.educationToCourseLevel(user.education_level) : null;

    if (userLevel) {
      const hint = document.getElementById('courses-level-hint');
      if (hint) {
        hint.textContent = `Cursos de ${user.education_level}`;
        hint.style.display = 'block';
      }
      const tabs = document.querySelector('.course-tabs');
      if (tabs) tabs.style.display = 'none';
    } else {
      initCourseTabs();
    }
  } catch {
    initCourseTabs();
    document.querySelectorAll('.course-card').forEach((card, i) => {
      const slugs = [
        'matematicas-divertidas', 'ciencias-naturales', 'lectura-escritura',
        'algebra-basica', 'introduccion-programacion', 'ingles-intermedio',
        'calculo-diferencial', 'fundamentos-ia', 'quimica-organica'
      ];
      if (slugs[i]) {
        card.dataset.slug = slugs[i];
        const link = card.querySelector('a.btn');
        if (link) link.href = `course.html?slug=${slugs[i]}`;
      }
    });
  }
}

async function initPublicStats() {
  const studentsEl = document.getElementById('stat-students');
  const coursesEl = document.getElementById('stat-courses');
  const satisfactionEl = document.getElementById('stat-satisfaction');
  if (!studentsEl) return;

  const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3001/api' : '/api';
  try {
    const data = await fetch(`${apiBase}/stats/public`).then(r => r.json());
    studentsEl.textContent = data.activeStudents > 0 ? data.activeStudents.toLocaleString('es-MX') : '0';
    coursesEl.textContent = String(data.coursesAvailable);
    satisfactionEl.textContent = data.satisfaction != null ? `${data.satisfaction}%` : '—';
  } catch {
    studentsEl.textContent = '0';
    coursesEl.textContent = '—';
    satisfactionEl.textContent = '—';
  }
}

async function initUserStats() {
  const statsGrid = document.querySelector('.stats-grid');
  const chartCtx = document.getElementById('studyChart');
  if (!statsGrid || !window.API) return;

  if (!window.API.Auth.isLoggedIn()) {
    statsGrid.insertAdjacentHTML('beforebegin',
      '<p class="stats-login-hint" style="text-align:center;color:var(--gray-500);margin-bottom:24px"><a href="login.html">Inicia sesión</a> para ver tus estadísticas en tiempo real.</p>'
    );
    renderDefaultChart(chartCtx);
    return;
  }

  async function loadStats() {
    try {
      const data = await window.API.api('/profile');
      const { stats, weeklyActivity, achievements, enrollments } = data;

      const completed = enrollments.filter(e => e.progress_percent === 100).length;
      const cards = statsGrid.querySelectorAll('.stat-card');
      if (cards[0]) {
        cards[0].querySelector('.value').textContent = `${stats.progress}%`;
        cards[0].querySelector('.progress-fill').dataset.width = stats.progress;
        cards[0].querySelector('.progress-fill').style.width = `${stats.progress}%`;
      }
      if (cards[1]) {
        cards[1].querySelector('.value').textContent = completed;
        cards[1].querySelector('.progress-fill').dataset.width = Math.min(completed * 10, 100);
        cards[1].querySelector('.progress-fill').style.width = `${Math.min(completed * 10, 100)}%`;
      }
      if (cards[2]) {
        cards[2].querySelector('.value').textContent = `${stats.studyHours}h`;
        cards[2].querySelector('.progress-fill').dataset.width = Math.min(stats.studyHours, 100);
        cards[2].querySelector('.progress-fill').style.width = `${Math.min(stats.studyHours, 100)}%`;
      }
      if (cards[3]) {
        cards[3].querySelector('.value').textContent = `Nivel ${stats.level}`;
        cards[3].querySelector('.progress-fill').dataset.width = Math.min(stats.level * 10, 100);
        cards[3].querySelector('.progress-fill').style.width = `${Math.min(stats.level * 10, 100)}%`;
      }

      renderStatsChart(chartCtx, weeklyActivity);

      const achContainer = document.querySelector('#estadisticas .achievements');
      if (achContainer) {
        if (achievements.length === 0) {
          achContainer.innerHTML = '<p style="color:var(--gray-500);font-size:.875rem">Completa cursos para desbloquear logros.</p>';
        } else {
          achContainer.innerHTML = achievements.slice(0, 4).map(a => `
            <div class="achievement">
              <div class="achievement-icon">${a.type === 'certificate' ? '🎓' : '🏆'}</div>
              <div><strong>${a.title}</strong><span>${window.API.timeAgo(a.earned_at)}</span></div>
            </div>
          `).join('');
        }
      }
    } catch {
      renderDefaultChart(chartCtx);
    }
  }

  await loadStats();
  setInterval(loadStats, 15000);
}

function renderStatsChart(ctx, weeklyActivity) {
  if (!ctx || typeof Chart === 'undefined') return;
  const labels = weeklyActivity.map(w => w.day);
  const hours = weeklyActivity.map(w => w.hours);
  const maxVal = Math.max(...hours, 1);

  if (studyChart) studyChart.destroy();
  studyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Horas',
        data: hours,
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: Math.ceil(maxVal + 1), grid: { color: '#F3F4F6' }, ticks: { callback: v => v + 'h' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderDefaultChart(ctx) {
  if (!ctx || typeof Chart === 'undefined') return;
  if (studyChart) studyChart.destroy();
  studyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      datasets: [{
        label: 'Horas',
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#F3F4F6' }, ticks: { callback: v => v + 'h' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function initTutoringForm() {
  const form = document.getElementById('tutoring-form');
  if (!form || !window.API) return;

  const fechaInput = document.getElementById('fecha');
  const asesorSelect = document.getElementById('asesor');
  const nivelSelect = document.getElementById('nivel');
  const materiaSelect = document.getElementById('materia');
  let allTeachers = [];

  if (fechaInput) {
    fechaInput.min = new Date().toISOString().slice(0, 10);
  }

  const levelMap = {
    Primaria: 'primaria',
    Secundaria: 'secundaria',
    Preparatoria: 'preparatoria'
  };

  async function loadTeachers() {
    try {
      const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3001/api' : '/api';
      allTeachers = await fetch(`${apiBase}/teachers/approved`).then(r => r.json());
      filterTeachers();
    } catch {
      if (asesorSelect) asesorSelect.innerHTML = '<option value="">No hay maestros disponibles aún</option>';
    }
  }

  function filterTeachers() {
    if (!asesorSelect) return;
    const level = levelMap[nivelSelect?.value] || '';
    const subject = materiaSelect?.value || '';
    let list = allTeachers;
    if (level) list = list.filter(t => t.levels.includes(level));
    if (subject) list = list.filter(t => t.subject === subject);

    if (!list.length) {
      asesorSelect.innerHTML = '<option value="">No hay maestros para este nivel/materia</option>';
      return;
    }
    asesorSelect.innerHTML = '<option value="">Selecciona un maestro</option>' +
      list.map(t => `<option value="${t.id}">${t.name} — ${t.subject}</option>`).join('');
  }

  nivelSelect?.addEventListener('change', filterTeachers);
  materiaSelect?.addEventListener('change', filterTeachers);
  loadTeachers();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!window.API.Auth.isLoggedIn()) {
      if (confirm('Debes iniciar sesión para agendar una asesoría. ¿Ir al login?')) {
        window.location.href = 'login.html';
      }
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Agendando...';
    btn.disabled = true;

    let errEl = form.querySelector('.tutoring-error');
    if (errEl) errEl.remove();

    try {
      await window.API.api('/tutoring', {
        method: 'POST',
        body: JSON.stringify({
          subject: document.getElementById('materia').value,
          level: document.getElementById('nivel').value,
          date: document.getElementById('fecha').value,
          time_slot: document.getElementById('horario').value,
          teacher_id: parseInt(document.getElementById('asesor').value, 10),
          notes: document.getElementById('notas').value
        })
      });

      btn.textContent = '¡Solicitud enviada!';
      btn.style.background = 'var(--success)';
      form.reset();
      filterTeachers();

      let successEl = form.querySelector('.tutoring-success');
      if (!successEl) {
        successEl = document.createElement('div');
        successEl.className = 'tutoring-success';
        successEl.style.cssText = 'background:#D1FAE5;color:#059669;padding:12px;border-radius:8px;margin-bottom:16px;font-size:.875rem';
        form.prepend(successEl);
      }
      successEl.innerHTML = 'Tu solicitud fue enviada y está <strong>pendiente de confirmación</strong>. <a href="profile.html" style="color:#059669;font-weight:600">Ver en mi perfil →</a>';

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.disabled = false;
        successEl?.remove();
      }, 5000);
    } catch (err) {
      errEl = document.createElement('div');
      errEl.className = 'tutoring-error';
      errEl.style.cssText = 'background:#FEE2E2;color:#DC2626;padding:12px;border-radius:8px;margin-bottom:16px;font-size:.875rem';
      errEl.textContent = err.message;
      form.prepend(errEl);
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

function initProgressBars() {
  const bars = document.querySelectorAll('.progress-fill[data-width]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.style.width = entry.target.dataset.width + '%';
      });
    },
    { threshold: 0.5 }
  );
  bars.forEach((bar) => {
    bar.style.width = '0%';
    observer.observe(bar);
  });
}

function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => navLinks.classList.toggle('mobile-open'));
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => navLinks.classList.remove('mobile-open'));
  });
}

function initSearch(inputSelector) {
  const input = document.querySelector(inputSelector);
  if (!input || !window.API) return;

  input.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    const query = input.value.trim();
    if (!query) return;

    try {
      const results = await window.API.api(`/courses/search?q=${encodeURIComponent(query)}`);
      if (results.length === 0) {
        alert(`No se encontraron cursos para "${query}"`);
        return;
      }
      if (results.length === 1) {
        window.location.href = `course.html?slug=${results[0].slug}`;
        return;
      }
      const list = results.map(c => `• ${c.title}`).join('\n');
      const pick = prompt(`Resultados para "${query}":\n\n${list}\n\nEscribe el número del curso (1-${results.length}):`);
      const idx = parseInt(pick, 10) - 1;
      if (idx >= 0 && idx < results.length) {
        window.location.href = `course.html?slug=${results[idx].slug}`;
      }
    } catch {
      alert('Error al buscar. Asegúrate de que el servidor esté activo.');
    }
  });
}

window.initSearch = initSearch;
initSearch('.nav-search input');
