document.addEventListener('DOMContentLoaded', async () => {
  const { api, Auth, formatDate, timeAgo } = window.API;
  if (!Auth.isLoggedIn()) { window.location.href = 'login.html'; return; }

  let user = Auth.getUser();
  if (user?.role !== 'teacher' && user?.role !== 'admin') {
    try {
      const me = await api('/auth/me');
      Auth.setUser(me);
      user = me;
      if (me.role === 'admin') { window.location.href = 'admin.html'; return; }
      if (me.role !== 'teacher') { window.location.href = 'profile.html'; return; }
    } catch { window.location.href = 'login.html'; return; }
  }

  const statusLabels = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    confirmed: 'Confirmada',
    cancelled: 'Rechazada'
  };

  function switchTab(tab) {
    document.querySelectorAll('.teacher-nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.teacher-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`panel-${tab}`).classList.add('active');
    const titles = { overview: 'Resumen', users: 'Usuarios', sessions: 'Mis asesorías', profile: 'Mi perfil', notifications: 'Notificaciones' };
    document.getElementById('teacher-title').textContent = titles[tab] || 'Panel';
  }

  document.querySelectorAll('.teacher-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('teacher-logout').onclick = () => {
    Auth.clearToken();
    window.location.href = 'login.html';
  };

  let allUsers = [];

  function renderUsersTable(list) {
    const el = document.getElementById('users-table');
    if (!list.length) {
      el.innerHTML = '<p class="teacher-empty">Aún no hay estudiantes registrados.</p>';
      return;
    }
    el.innerHTML = `<table class="teacher-table"><thead><tr>
      <th>#</th><th>Nombre</th><th>Correo (Gmail)</th><th>Contraseña</th><th>Nivel escolar</th><th>Cursos</th><th>Fecha de registro</th>
    </tr></thead><tbody>${list.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.name}</td>
        <td><a href="mailto:${u.email}">${u.email}</a></td>
        <td><code class="teacher-password">${u.password || '—'}</code></td>
        <td>${u.education_level || '—'}</td>
        <td>${u.enrollments ?? 0}</td>
        <td>${u.created_at ? formatDate(u.created_at.slice(0, 10)) : '—'}</td>
      </tr>`).join('')}</tbody></table>`;
  }

  function filterUsers() {
    const query = (document.getElementById('teacher-users-search')?.value || '').trim().toLowerCase();
    const filtered = !query ? allUsers : allUsers.filter(u =>
      u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
    );
    renderUsersTable(filtered);
  }

  async function loadUsers() {
    try {
      allUsers = await api('/teachers/users');
      filterUsers();
    } catch (err) {
      document.getElementById('users-table').innerHTML =
        `<p class="teacher-empty">No se pudieron cargar los registros. Reinicia el servidor (<code>cd server && npm start</code>) y recarga la página.</p>`;
    }
  }

  document.getElementById('teacher-users-search')?.addEventListener('input', filterUsers);

  let data;
  try {
    data = await api('/teachers/dashboard');
  } catch (err) {
    const msg = err.status === 404
      ? 'No encontramos tu perfil de maestro. Si ya te registraste, cierra sesión e inicia de nuevo.'
      : err.message || 'No se pudo cargar el panel de maestro.';
    document.querySelector('.teacher-main').innerHTML = `
      <div class="teacher-alert teacher-alert-error" style="display:block">
        ${msg}
        ${err.status === 404 ? '' : ' <a href="register-teacher.html">Registrarme como maestro</a>'}
      </div>`;
    return;
  }

  const { profile, sessions, stats, notifications } = data;

  document.getElementById('teacher-user').textContent = data.user.name;
  document.getElementById('teacher-subtitle').textContent =
    `${profile.subject} · ${profile.levels.map(l => l.charAt(0).toUpperCase() + l.slice(1)).join(', ')}`;

  const badge = document.getElementById('teacher-status-badge');
  badge.textContent = statusLabels[profile.status] || profile.status;
  badge.className = `badge badge-${profile.status}`;

  const alert = document.getElementById('teacher-alert');
  if (profile.status === 'pending') {
    alert.hidden = false;
    alert.className = 'teacher-alert teacher-alert-warn';
    alert.textContent = 'Tu registro está pendiente de aprobación. Un administrador revisará tu solicitud pronto.';
  } else if (profile.status === 'rejected') {
    alert.hidden = false;
    alert.className = 'teacher-alert teacher-alert-error';
    alert.textContent = 'Tu solicitud fue rechazada. Contacta al administrador para más información.';
  } else {
    alert.hidden = false;
    alert.className = 'teacher-alert teacher-alert-success';
    alert.textContent = '¡Perfil aprobado! Ya puedes recibir asesorías de estudiantes.';
  }

  document.getElementById('teacher-stats').innerHTML = `
    <div class="teacher-stat-card"><strong>${stats.upcoming}</strong><span>Próximas sesiones</span></div>
    <div class="teacher-stat-card"><strong>${stats.pending}</strong><span>Por confirmar</span></div>
    <div class="teacher-stat-card"><strong>${stats.confirmed}</strong><span>Confirmadas</span></div>
    <div class="teacher-stat-card"><strong>${stats.completed}</strong><span>Completadas</span></div>
    <div class="teacher-stat-card"><strong>${stats.total}</strong><span>Total asesorías</span></div>
    <div class="teacher-stat-card"><strong>${stats.registeredStudents ?? 0}</strong><span>Usuarios registrados</span></div>`;

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = sessions.filter(s => s.status === 'confirmed' && s.date >= today).slice(0, 5);
  document.getElementById('teacher-upcoming').innerHTML = upcoming.length ? `
    <h3>Próximas asesorías</h3>
    ${upcoming.map(s => `
      <div style="padding:10px 0;border-bottom:1px solid #EFF6FF">
        <strong>${s.subject}</strong> — ${s.student_name}<br>
        <small style="color:#64748B">📅 ${formatDate(s.date)} · 🕐 ${s.time_slot} · ${s.level}</small>
      </div>`).join('')}` : '<h3>Próximas asesorías</h3><p class="teacher-empty">No tienes sesiones próximas.</p>';

  await loadUsers();

  const sessionsEl = document.getElementById('sessions-table');
  if (!sessions.length) {
    sessionsEl.innerHTML = '<p class="teacher-empty">Aún no tienes asesorías asignadas.</p>';
  } else {
    sessionsEl.innerHTML = `<table class="teacher-table"><thead><tr>
      <th>Estudiante</th><th>Materia</th><th>Nivel</th><th>Fecha</th><th>Horario</th><th>Estado</th><th>Notas</th>
    </tr></thead><tbody>${sessions.map(s => `
      <tr class="${s.status === 'pending' ? 'row-pending' : ''}">
        <td>${s.student_name}<br><small>${s.student_email || ''}</small></td>
        <td>${s.subject}</td><td>${s.level}</td>
        <td>${s.date}</td><td>${s.time_slot}</td>
        <td><span class="badge badge-${s.status}">${statusLabels[s.status] || s.status}</span></td>
        <td>${s.notes || '—'}</td>
      </tr>`).join('')}</tbody></table>`;
  }

  document.getElementById('teacher-profile-card').innerHTML = `
    <dl class="teacher-profile-grid">
      <div><dt>Nombre</dt><dd>${data.user.name}</dd></div>
      <div><dt>Correo</dt><dd>${data.user.email}</dd></div>
      <div><dt>Materia</dt><dd>${profile.subject}</dd></div>
      <div><dt>Niveles</dt><dd>${profile.levels.map(l => l.charAt(0).toUpperCase() + l.slice(1)).join(', ')}</dd></div>
      <div><dt>Estado</dt><dd><span class="badge badge-${profile.status}">${statusLabels[profile.status]}</span></dd></div>
      <div><dt>Experiencia</dt><dd>${profile.bio || 'Sin descripción'}</dd></div>
    </dl>`;

  const notifEl = document.getElementById('teacher-notifications');
  if (!notifications.length) {
    notifEl.innerHTML = '<p class="teacher-empty">No tienes notificaciones.</p>';
  } else {
    notifEl.innerHTML = notifications.map(n => `
      <div class="teacher-notif-item">
        <strong>${n.title}</strong>
        <p>${n.body}</p>
        <small>${timeAgo(n.created_at)}</small>
      </div>`).join('');
  }
});
