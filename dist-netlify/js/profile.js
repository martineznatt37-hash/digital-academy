/* Profile page — dynamic data from API */
document.addEventListener('DOMContentLoaded', async () => {
  const { api, Auth, getInitials, formatDate, timeAgo, levelLabel, educationToCourseLevel } = window.API;

  if (!Auth.requireAuth()) return;

  const u = Auth.getUser();
  if (u?.role === 'teacher') { window.location.href = 'teacher.html'; return; }
  if (u?.role === 'admin') { window.location.href = 'admin.html'; return; }

  const navItems = document.querySelectorAll('.profile-nav-item');
  const panels = document.querySelectorAll('.profile-panel');

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const target = item.dataset.panel;
      navItems.forEach((n) => n.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));
      item.classList.add('active');
      document.getElementById(target)?.classList.add('active');
    });
  });

  document.querySelector('.nav-notif')?.addEventListener('click', () => {
    navItems.forEach((n) => n.classList.remove('active'));
    panels.forEach((p) => p.classList.remove('active'));
    document.querySelector('[data-panel="notifications"]')?.classList.add('active');
    document.getElementById('notifications')?.classList.add('active');
    api('/profile/notifications/read-all', { method: 'PUT' }).catch(() => {});
    document.querySelector('.nav-notif .badge')?.classList.remove('active');
  });

  document.querySelector('[data-panel="notifications"]')?.addEventListener('click', () => {
    api('/profile/notifications/read-all', { method: 'PUT' }).catch(() => {});
    document.querySelector('.nav-notif .badge')?.classList.remove('active');
  });

  document.querySelector('.nav-actions a[href="login.html"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    Auth.clearToken();
    window.location.href = 'login.html';
  });

  let profileChart = null;
  let chartPeriod = 'weekly';
  let profileData = null;
  let catalogData = [];
  let catalogFilter = 'all';

  document.querySelector('.go-catalog')?.addEventListener('click', () => {
    navItems.forEach((n) => n.classList.remove('active'));
    panels.forEach((p) => p.classList.remove('active'));
    document.querySelector('[data-panel="catalog"]')?.classList.add('active');
    document.getElementById('catalog')?.classList.add('active');
  });

  document.querySelectorAll('.catalog-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.catalog-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      catalogFilter = tab.dataset.level;
      renderCatalog();
    });
  });
  document.querySelectorAll('.chart-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-toggle-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      chartPeriod = btn.dataset.period;
      if (profileData) renderChart(profileData.weeklyActivity, profileData.monthlyActivity, profileData.achievements);
    });
  });

  async function loadCatalog() {
    try {
      catalogData = await api('/courses');
      const userLevel = Auth.getUser() ? educationToCourseLevel(Auth.getUser().education_level) : null;
      if (userLevel) {
        catalogFilter = userLevel;
        const tabs = document.querySelector('.catalog-tabs');
        if (tabs) tabs.style.display = 'none';
      }
      renderCatalog();
    } catch {
      document.getElementById('catalog-grid').innerHTML = '<p style="color:var(--gray-500)">No se pudieron cargar los cursos.</p>';
    }
  }

  async function enrollInCourse(slug, btn) {
    const original = btn.textContent;
    btn.textContent = 'Inscribiendo...';
    btn.disabled = true;
    try {
      await api(`/courses/${slug}/enroll`, { method: 'POST' });
      await loadCatalog();
      await loadProfile();
      btn.textContent = '¡Inscrito!';
      setTimeout(() => { window.location.href = `course.html?slug=${slug}`; }, 600);
    } catch (err) {
      btn.textContent = err.message;
      btn.disabled = false;
      setTimeout(() => { btn.textContent = original; }, 2500);
    }
  }

  function renderCatalog() {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;

    const filtered = catalogFilter === 'all'
      ? catalogData
      : catalogData.filter(c => c.level === catalogFilter);

    if (filtered.length === 0) {
      grid.innerHTML = '<p style="color:var(--gray-500)">No hay cursos en este nivel.</p>';
      return;
    }

    grid.innerHTML = filtered.map(c => {
      const levelLabel = c.level.charAt(0).toUpperCase() + c.level.slice(1);
      const enrolled = c.enrolled;
      const done = c.progress_percent === 100;
      let actionBtn;
      if (!enrolled) {
        actionBtn = `<button class="btn btn-primary btn-sm enroll-btn" data-slug="${c.slug}">Inscribirme</button>`;
      } else if (done) {
        actionBtn = `<a href="course.html?slug=${c.slug}" class="btn btn-outline btn-sm">Ver curso ✓</a>`;
      } else {
        actionBtn = `<a href="course.html?slug=${c.slug}" class="btn btn-primary btn-sm">Continuar (${c.progress_percent}%)</a>`;
      }

      const thumbStyle = c.cover_image
        ? `background-image:url('${c.cover_image}');background-size:cover;background-position:center`
        : `background:${c.gradient}`;
      const thumbContent = c.cover_image ? '' : c.emoji;

      return `
        <div class="catalog-card" data-level="${c.level}">
          <div class="catalog-card-thumb" style="${thumbStyle}">${thumbContent}</div>
          <div class="catalog-card-body">
            <span class="catalog-level">${levelLabel}</span>
            <h4>${c.title}</h4>
            <p>${c.description}</p>
            <div class="catalog-meta">
              <span>📚 ${c.lesson_count} lecciones</span>
              <span>⏱ ${c.duration_hours}h</span>
            </div>
            ${enrolled ? `<div class="catalog-progress"><div class="progress-bar"><div class="progress-fill" style="width:${c.progress_percent}%"></div></div></div>` : ''}
            <div class="catalog-actions">${actionBtn}</div>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.enroll-btn').forEach(btn => {
      btn.addEventListener('click', () => enrollInCourse(btn.dataset.slug, btn));
    });
  }

  async function loadProfile() {
    try {
      const data = await api('/profile');
      profileData = data;
      renderProfile(data);
    } catch {
      Auth.clearToken();
      window.location.href = 'login.html';
    }
  }

  function renderProfile(data) {
    const { user, stats, enrollments, certificates, favorites, notifications, achievements, tutoring, weeklyActivity, monthlyActivity, pet } = data;

    Auth.setUser(user);

    document.querySelector('.profile-avatar').textContent = getInitials(user.name);
    document.querySelector('.profile-info h1').textContent = user.name;
    document.querySelector('.profile-info p').textContent = `${user.email} · ${user.education_level}`;
    document.querySelector('.profile-level').textContent = `🏅 Nivel ${stats.level} · ${levelLabel(stats.level)}`;

    document.querySelector('#overview .mini-stat:nth-child(1) .value').textContent = `${stats.progress}%`;
    document.querySelector('#overview .mini-stat:nth-child(2) .value').textContent = stats.courses;
    document.querySelector('#overview .mini-stat:nth-child(3) .value').textContent = `${stats.studyHours}h`;
    document.querySelector('#overview .mini-stat:nth-child(4) .value').textContent = stats.level;

    renderChart(weeklyActivity, monthlyActivity, achievements);
    renderCourses(enrollments);
    renderCertificates(certificates);
    renderFavorites(favorites);
    renderTutoring(tutoring);
    renderNotifications(notifications);
    renderPet(pet);

    document.getElementById('s-name').value = user.name;
    document.getElementById('s-email').value = user.email;
    const levelDisplay = document.getElementById('s-level-display');
    if (levelDisplay) {
      levelDisplay.textContent = user.education_level;
    }

    const unread = notifications.filter(n => !n.read).length;
    const badge = document.querySelector('.nav-notif .badge');
    if (badge && unread > 0) badge.classList.add('active');
    else if (badge) badge.classList.remove('active');
  }

  function renderChart(weeklyActivity, monthlyActivity, achievements) {
    const ctx = document.getElementById('profileChart');
    if (!ctx) return;

    const isWeekly = chartPeriod === 'weekly';
    const labels = isWeekly ? weeklyActivity.map(w => w.day) : monthlyActivity.map(w => w.week);
    const hours = isWeekly ? weeklyActivity.map(w => w.hours) : monthlyActivity.map(w => w.hours);

    if (profileChart) profileChart.destroy();
    profileChart = new Chart(ctx, {
      type: isWeekly ? 'line' : 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Horas',
          data: hours,
          borderColor: '#2563EB',
          backgroundColor: isWeekly ? 'rgba(37,99,235,.1)' : 'rgba(37,99,235,.7)',
          fill: isWeekly,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#7C3AED',
          borderRadius: isWeekly ? 0 : 8
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

    const achContainer = document.querySelector('#overview .achievements');
    if (achContainer) {
      if (achievements.length === 0) {
        achContainer.innerHTML = '<p style="color:var(--gray-500);font-size:.875rem">Completa lecciones y cursos para desbloquear logros.</p>';
      } else {
        achContainer.innerHTML = achievements.slice(0, 4).map(a => `
          <div class="achievement">
            <div class="achievement-icon">${a.type === 'certificate' ? '🎓' : '🏆'}</div>
            <div><strong>${a.title}</strong><span>${timeAgo(a.earned_at)}</span></div>
          </div>
        `).join('');
      }
    }
  }

  function renderCourses(enrollments) {
    const container = document.getElementById('my-courses-list');
    if (!container) return;

    if (enrollments.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Aún no tienes cursos inscritos.</p>
          <button class="btn btn-primary btn-sm go-catalog-inline">Explorar cursos disponibles</button>
        </div>`;
      container.querySelector('.go-catalog-inline')?.addEventListener('click', () => {
        document.querySelector('[data-panel="catalog"]')?.click();
      });
      return;
    }

    container.innerHTML = enrollments.map(e => {
      const done = e.progress_percent === 100;
      return `
        <div class="course-history-item">
          <div class="course-history-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:var(--gray-100);border-radius:8px;width:64px;height:64px">${e.emoji}</div>
          <div class="course-history-info">
            <h4>${e.title}</h4>
            <p>${e.level.charAt(0).toUpperCase() + e.level.slice(1)} · ${e.lesson_count} lecciones · ${e.duration_hours}h</p>
          </div>
          <div class="course-progress-wrap">
            <div class="progress-bar"><div class="progress-fill" style="width:${e.progress_percent}%"></div></div>
            <span>${done ? 'Completado ✓' : e.progress_percent + '%'}</span>
          </div>
          <a href="course.html?slug=${e.slug}" class="btn btn-outline btn-sm">${done ? 'Repasar' : 'Continuar'}</a>
        </div>
      `;
    }).join('');
  }

  function renderCertificates(certificates) {
    const container = document.querySelector('#certificates');
    const heading = container.querySelector('h2');
    container.innerHTML = '';
    container.appendChild(heading);

    if (certificates.length === 0) {
      container.innerHTML += '<p style="color:var(--gray-500)">Completa todos los módulos de un curso (aprobando cada examen con 8/10) para obtener tu certificado.</p>';
      return;
    }

    certificates.forEach(c => {
      container.innerHTML += `
        <div class="certificate-card">
          <div class="certificate-icon">🎓</div>
          <div class="certificate-info">
            <h4>${c.title}</h4>
            <p>Completado el ${formatDate(c.issued_at)} · ${c.level.charAt(0).toUpperCase() + c.level.slice(1)}${c.final_score != null ? ` · <strong>${c.final_score}/10</strong>` : ''}</p>
          </div>
          <button class="btn btn-outline btn-sm cert-download-btn" data-cert-id="${c.id}">Descargar</button>
        </div>
      `;
    });

    container.querySelectorAll('.cert-download-btn').forEach(btn => {
      btn.addEventListener('click', () => downloadCertificate(btn.dataset.certId, btn));
    });
  }

  async function downloadCertificate(certId, btn) {
    const original = btn.textContent;
    btn.textContent = 'Descargando...';
    btn.disabled = true;
    try {
      const token = Auth.getToken();
      const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3001/api' : '/api';
      const res = await fetch(`${apiBase}/profile/certificates/${certId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('No se pudo descargar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado-${certId}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      btn.textContent = '¡Descargado!';
      setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2000);
    } catch (err) {
      btn.textContent = err.message;
      setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2500);
    }
  }

  function renderFavorites(favorites) {
    const container = document.querySelector('#favorites');
    const heading = container.querySelector('h2');
    container.innerHTML = '';
    container.appendChild(heading);

    if (favorites.length === 0) {
      container.innerHTML += '<p style="color:var(--gray-500)">Marca cursos como favoritos desde la página del curso.</p>';
      return;
    }

    favorites.forEach(f => {
      container.innerHTML += `
        <div class="favorite-card">
          <div style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:var(--gray-100);border-radius:6px;width:80px;height:60px">${f.emoji}</div>
          <div class="course-history-info">
            <h4>${f.title}</h4>
            <p>${f.level.charAt(0).toUpperCase() + f.level.slice(1)} · ${f.lesson_count} lecciones · ⭐ Guardado</p>
          </div>
          <a href="course.html?slug=${f.slug}" class="btn btn-primary btn-sm">${f.progress_percent > 0 ? 'Continuar' : 'Ver curso'}</a>
        </div>
      `;
    });
  }

  function renderTutoring(sessions) {
    const container = document.getElementById('tutoring-list');
    if (!container) return;

    const active = sessions.filter(s => s.status !== 'cancelled');
    if (active.length === 0) {
      container.innerHTML = '<p style="color:var(--gray-500)">No tienes asesorías agendadas. <a href="index.html#asesorias">Agendar una</a></p>';
      return;
    }

    container.innerHTML = active.map(s => {
      const isPast = s.date < new Date().toISOString().slice(0, 10);
      const statusLabel = s.status === 'cancelled' ? 'Cancelada' : s.status === 'pending' ? 'Pendiente' : isPast ? 'Completada' : 'Confirmada';
      const statusClass = s.status === 'cancelled' ? 'cancelled' : s.status === 'pending' ? 'pending' : isPast ? 'completed' : 'confirmed';
      return `
        <div class="tutoring-item" data-id="${s.id}">
          <div class="tutoring-item-icon">👨‍🏫</div>
          <div class="tutoring-item-info">
            <h4>${s.subject} — ${s.level}</h4>
            <p>📅 ${formatDate(s.date)} · 🕐 ${s.time_slot}</p>
            <p>Asesor: ${s.advisor}${s.notes ? ` · ${s.notes}` : ''}</p>
          </div>
          <div class="tutoring-item-actions">
            <span class="tutoring-status ${statusClass}">${statusLabel}</span>
            ${!isPast && s.status !== 'cancelled' ? `<button class="btn btn-outline btn-sm cancel-tutoring" data-id="${s.id}">Cancelar</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.cancel-tutoring').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Cancelar esta asesoría?')) return;
        try {
          await api(`/tutoring/${btn.dataset.id}`, { method: 'DELETE' });
          loadProfile();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  }

  function renderPet(pet) {
    const container = document.getElementById('pet-container');
    const mini = document.getElementById('pet-mini');
    if (!container) return;

    const petEmoji = (type) => ({ owl: '🦉', wolf: '🐺', dinosaur: '🦕' }[type] || '🐾');

    if (pet?.pending_choice) {
      container.innerHTML = `
        <div class="pet-locked">
          <div class="pet-locked-icon">🎉🦉🐺🦕</div>
          <h3>¡Elige tu mascota!</h3>
          <p>Obtuviste 10/10 en tu primer módulo. Elige entre <strong>búho</strong>, <strong>lobo</strong> o <strong>dinosaurio</strong>.</p>
          <button class="btn btn-primary btn-sm" id="open-pet-choice">Elegir ahora</button>
        </div>`;
      container.querySelector('#open-pet-choice')?.addEventListener('click', () => {
        window.petWidget?.showChoiceModal(true);
      });
      if (mini) mini.innerHTML = '<div class="pet-mini-card">🎉 Elige tu mascota</div>';
      return;
    }

    if (!pet || !pet.unlocked) {
      container.innerHTML = `
        <div class="pet-locked">
          <div class="pet-locked-icon">🔒🦉🐺🦕</div>
          <h3>Mascota bloqueada</h3>
          <p>Obtén <strong>10/10</strong> en el examen del <strong>primer módulo</strong> de cualquier curso para desbloquear tu mascota.</p>
          <a href="#" class="btn btn-primary btn-sm go-catalog">Ir a explorar cursos</a>
        </div>`;
      container.querySelector('.go-catalog')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('[data-panel="catalog"]')?.click();
      });
      if (mini) mini.innerHTML = '';
      return;
    }

    const mood = pet.happiness >= 80 ? '😊' : pet.happiness >= 50 ? '🙂' : pet.happiness >= 30 ? '😐' : '😢';
    const pet3d = window.PetRenderer?.build(pet.pet_type, 'large') || '🐾';
    const hunger = pet.hunger ?? 100;
    const energy = pet.energy ?? 100;
    const sleep = pet.sleep ?? 100;

    container.innerHTML = `
      <div class="pet-card">
        <div class="pet-card-3d">${pet3d}</div>
        <div class="pet-mood">${mood}</div>
        <h3>${pet.name}</h3>
        <p class="pet-subtitle">Tu compañero interactivo de estudio</p>
        <div class="pet-stats">
          <div class="pet-stat">
            <span class="pet-stat-label">Felicidad</span>
            <div class="progress-bar"><div class="progress-fill" style="width:${pet.happiness}%"></div></div>
            <span class="pet-stat-value">${pet.happiness}%</span>
          </div>
          <div class="pet-stat">
            <span class="pet-stat-label">Hambre</span>
            <div class="progress-bar"><div class="progress-fill" style="width:${hunger}%;background:#F59E0B"></div></div>
            <span class="pet-stat-value">${hunger}%</span>
          </div>
          <div class="pet-stat">
            <span class="pet-stat-label">Energía</span>
            <div class="progress-bar"><div class="progress-fill" style="width:${energy}%;background:#10B981"></div></div>
            <span class="pet-stat-value">${energy}%</span>
          </div>
          <div class="pet-stat">
            <span class="pet-stat-label">Sueño</span>
            <div class="progress-bar"><div class="progress-fill" style="width:${sleep}%;background:#6366F1"></div></div>
            <span class="pet-stat-value">${sleep}%</span>
          </div>
          <div class="pet-stat">
            <span class="pet-stat-label">Comida recibida</span>
            <span class="pet-stat-value">🍎 ${pet.food_count}</span>
          </div>
        </div>
        <p class="pet-hint">Haz clic en tu mascota flotante para alegrarla. Responder exámenes la alimenta. Si tiene sueño, haz clic para despertarla.</p>
      </div>`;

    if (mini) {
      const mini3d = window.PetRenderer?.build(pet.pet_type) || petEmoji(pet.pet_type);
      mini.innerHTML = `
        <div class="pet-mini-card" data-panel="pet" role="button">
          <span class="pet-mini-3d">${mini3d}</span>
          <div><strong>${pet.name}</strong> · Felicidad ${pet.happiness}% · 🍎 ${pet.food_count}</div>
        </div>`;
      mini.querySelector('.pet-mini-card')?.addEventListener('click', () => {
        document.querySelector('[data-panel="pet"]')?.click();
      });
    }
  }

  function renderNotifications(notifications) {
    const container = document.querySelector('#notifications');
    const heading = container.querySelector('h2');
    container.innerHTML = '';
    container.appendChild(heading);

    if (notifications.length === 0) {
      container.innerHTML += '<p style="color:var(--gray-500)">No tienes notificaciones.</p>';
      return;
    }

    notifications.forEach(n => {
      container.innerHTML += `
        <div class="notification-item ${n.read ? 'read' : 'unread'}">
          <div class="notification-dot"></div>
          <div class="notification-content">
            <strong>${n.title}</strong>
            <p>${n.body}</p>
            <time>${timeAgo(n.created_at)}</time>
          </div>
        </div>
      `;
    });
  }

  const settingsForm = document.getElementById('settings-form');
  settingsForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = settingsForm.querySelector('button[type="submit"]');
    try {
      const user = await api('/profile/settings', {
        method: 'PUT',
        body: JSON.stringify({
          name: document.getElementById('s-name').value,
          email: document.getElementById('s-email').value
        })
      });
      Auth.setUser(user);
      btn.textContent = '¡Guardado!';
      loadProfile();
      setTimeout(() => { btn.textContent = 'Guardar cambios'; }, 2000);
    } catch (err) {
      btn.textContent = err.message;
      setTimeout(() => { btn.textContent = 'Guardar cambios'; }, 3000);
    }
  });

  if (window.initSearch) window.initSearch('.nav-search input');

  await Promise.all([loadProfile(), loadCatalog()]);
  setInterval(loadProfile, 15000);
});
