document.addEventListener('DOMContentLoaded', async () => {
  const { api, Auth, formatDate } = window.API;
  if (!Auth.isLoggedIn()) { window.location.href = 'login.html'; return; }

  let user = Auth.getUser();
  if (user?.role !== 'admin') {
    try {
      const me = await api('/auth/me');
      Auth.setUser(me);
      user = me;
      if (me.role !== 'admin') { window.location.href = 'index.html'; return; }
    } catch { window.location.href = 'login.html'; return; }
  }

  document.getElementById('admin-user').textContent = user?.name || 'Admin';

  const roleLabels = {
    student: 'Estudiante',
    teacher: 'Maestro',
    admin: 'Administrador'
  };

  let allUsers = [];

  const statusLabels = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    confirmed: 'Confirmada',
    cancelled: 'Rechazada'
  };

  function escapeHtml(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(msg, type = 'success') {
    const toast = document.getElementById('admin-toast');
    toast.textContent = msg;
    toast.className = `admin-toast admin-toast-${type}`;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.hidden = true; }, 3500);
  }

  function switchTab(tab) {
    document.querySelectorAll('.admin-nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`panel-${tab}`).classList.add('active');
    document.getElementById('admin-title').textContent =
      tab === 'dashboard' ? 'Resumen'
        : tab === 'users' ? 'Usuarios'
        : tab === 'teachers' ? 'Maestros'
        : 'Asesorías';

    if (tab === 'users' && allUsers.length === 0) loadUsers();
  }

  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('admin-logout').onclick = () => {
    Auth.clearToken();
    window.location.href = 'login.html';
  };

  async function loadStats() {
    try {
      const s = await api('/admin/stats');
      document.getElementById('admin-stats').innerHTML = `
        <div class="admin-stat-card"><strong>${s.pendingTeachers ?? 0}</strong><span>Maestros pendientes</span></div>
        <div class="admin-stat-card"><strong>${s.approvedTeachers ?? 0}</strong><span>Maestros aprobados</span></div>
        <div class="admin-stat-card"><strong>${s.pendingTutoring ?? 0}</strong><span>Asesorías pendientes</span></div>
        <div class="admin-stat-card"><strong>${s.totalUsers ?? s.totalStudents ?? 0}</strong><span>Usuarios registrados</span></div>
        <div class="admin-stat-card"><strong>${s.totalStudents ?? 0}</strong><span>Estudiantes</span></div>
        <div class="admin-stat-card"><strong>${s.totalTutoring ?? 0}</strong><span>Total asesorías</span></div>`;

      const pendingEl = document.getElementById('admin-pending-actions');
      const usersBtn = '<button type="button" class="btn btn-outline btn-sm" data-go="users">Ver usuarios registrados</button>';
      if (s.pendingTeachers || s.pendingTutoring) {
        pendingEl.innerHTML = `
          <h3>Acciones pendientes</h3>
          <div class="admin-pending-btns">
            ${s.pendingTeachers ? `<button type="button" class="btn btn-primary btn-sm" data-go="teachers">Revisar ${s.pendingTeachers} maestro(s)</button>` : ''}
            ${s.pendingTutoring ? `<button type="button" class="btn btn-primary btn-sm" data-go="tutoring">Revisar ${s.pendingTutoring} asesoría(s)</button>` : ''}
            ${usersBtn}
          </div>`;
      } else {
        pendingEl.innerHTML = `
          <p class="admin-all-clear">No hay solicitudes pendientes por revisar.</p>
          <div class="admin-pending-btns" style="margin-top:12px">${usersBtn}</div>`;
      }
      pendingEl.querySelectorAll('[data-go]').forEach(btn => {
        btn.onclick = () => switchTab(btn.dataset.go);
      });
    } catch (err) {
      document.getElementById('admin-stats').innerHTML =
        '<p class="admin-empty">No se pudo cargar el resumen. Reinicia el servidor.</p>';
      showToast(err.message || 'Error al cargar estadísticas', 'error');
    }
  }

  function renderUsersTable(list) {
    const el = document.getElementById('users-table');
    if (!list.length) {
      el.innerHTML = '<p class="admin-empty">No hay usuarios que coincidan con la búsqueda.</p>';
      return;
    }

    el.innerHTML = `<table class="admin-table"><thead><tr>
      <th>#</th><th>Nombre</th><th>Correo</th><th>Contraseña</th><th>Rol</th><th>Nivel escolar</th><th>Cursos</th><th>Horas</th><th>Registro</th>
    </tr></thead><tbody>${list.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${escapeHtml(u.name)}</td>
        <td><a href="mailto:${escapeHtml(u.email)}">${escapeHtml(u.email)}</a></td>
        <td><code class="admin-password">${escapeHtml(u.password || '—')}</code></td>
        <td><span class="badge badge-${u.role || 'student'}">${roleLabels[u.role] || roleLabels.student}</span></td>
        <td>${escapeHtml(u.education_level || '—')}</td>
        <td>${u.enrollments ?? 0}</td>
        <td>${u.study_hours ?? 0}h</td>
        <td>${u.created_at ? formatDate(String(u.created_at).slice(0, 10)) : '—'}</td>
      </tr>`).join('')}</tbody></table>
      <p class="admin-table-note">${list.length} usuario(s) mostrado(s)</p>`;
  }

  function filterUsers() {
    const query = (document.getElementById('users-search')?.value || '').trim().toLowerCase();
    const role = document.getElementById('users-role-filter')?.value || '';
    const filtered = allUsers.filter(u => {
      const userRole = u.role || 'student';
      const matchRole = !role || userRole === role;
      const matchQuery = !query
        || String(u.name || '').toLowerCase().includes(query)
        || String(u.email || '').toLowerCase().includes(query)
        || String(u.password || '').toLowerCase().includes(query);
      return matchRole && matchQuery;
    });
    renderUsersTable(filtered);
  }

  async function loadUsers() {
    const el = document.getElementById('users-table');
    el.innerHTML = '<p class="admin-empty">Cargando registros...</p>';
    try {
      const data = await api('/admin/users');
      if (!Array.isArray(data)) throw new Error('Respuesta inválida del servidor');
      allUsers = data;
      filterUsers();
    } catch (err) {
      allUsers = [];
      el.innerHTML = `
        <p class="admin-empty admin-error">
          No se pudieron cargar los registros de usuarios.<br>
          <small>${escapeHtml(err.message || 'Error de conexión')}</small><br>
          <button type="button" class="btn btn-primary btn-sm" id="retry-users" style="margin-top:12px">Reintentar</button>
        </p>`;
      document.getElementById('retry-users')?.addEventListener('click', loadUsers);
      showToast('Error al cargar usuarios', 'error');
    }
  }

  document.getElementById('users-search')?.addEventListener('input', filterUsers);
  document.getElementById('users-role-filter')?.addEventListener('change', filterUsers);

  async function loadTeachers() {
    const el = document.getElementById('teachers-table');
    try {
      const teachers = await api('/admin/teachers');
      if (!teachers.length) { el.innerHTML = '<p class="admin-empty">No hay registros de maestros.</p>'; return; }

      const sorted = [...teachers].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return 0;
      });

      el.innerHTML = `<table class="admin-table"><thead><tr>
        <th>Nombre</th><th>Correo</th><th>Contraseña</th><th>Materia</th><th>Niveles</th><th>Estado</th><th>Acciones</th>
      </tr></thead><tbody>${sorted.map(t => `
        <tr class="${t.status === 'pending' ? 'row-pending' : ''}">
          <td>${escapeHtml(t.name)}</td>
          <td>${escapeHtml(t.email)}</td>
          <td><code class="admin-password">${escapeHtml(t.password || '—')}</code></td>
          <td>${escapeHtml(t.subject)}</td>
          <td>${(t.levels || []).map(l => l.charAt(0).toUpperCase() + l.slice(1)).join(', ')}</td>
          <td><span class="badge badge-${t.status}">${statusLabels[t.status] || t.status}</span></td>
          <td class="admin-actions">${t.status === 'pending' ? `
            <button type="button" class="btn btn-primary btn-sm" data-approve="${t.id}">Aceptar</button>
            <button type="button" class="btn btn-outline btn-sm" data-reject="${t.id}">Rechazar</button>` : '—'}</td>
        </tr>`).join('')}</tbody></table>`;

      el.querySelectorAll('[data-approve]').forEach(btn => {
        btn.onclick = async () => {
          btn.disabled = true;
          try {
            await api(`/admin/teachers/${btn.dataset.approve}/approve`, { method: 'PUT' });
            showToast('Maestro aceptado. Se envió notificación al profesor.');
            loadTeachers();
            loadStats();
          } catch (e) {
            showToast(e.message, 'error');
            btn.disabled = false;
          }
        };
      });
      el.querySelectorAll('[data-reject]').forEach(btn => {
        btn.onclick = async () => {
          if (!confirm('¿Rechazar este maestro? Se le enviará una notificación.')) return;
          btn.disabled = true;
          try {
            await api(`/admin/teachers/${btn.dataset.reject}/reject`, { method: 'PUT' });
            showToast('Maestro rechazado. Se envió notificación al profesor.', 'warn');
            loadTeachers();
            loadStats();
          } catch (e) {
            showToast(e.message, 'error');
            btn.disabled = false;
          }
        };
      });
    } catch (err) {
      el.innerHTML = `<p class="admin-empty">Error al cargar maestros: ${escapeHtml(err.message)}</p>`;
    }
  }

  async function loadTutoring() {
    const el = document.getElementById('tutoring-table');
    try {
      const sessions = await api('/admin/tutoring');
      if (!sessions.length) { el.innerHTML = '<p class="admin-empty">No hay asesorías registradas.</p>'; return; }

      const sorted = [...sessions].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return b.date.localeCompare(a.date);
      });

      el.innerHTML = `<table class="admin-table"><thead><tr>
        <th>Estudiante</th><th>Maestro</th><th>Materia</th><th>Nivel</th><th>Fecha</th><th>Horario</th><th>Estado</th><th>Acciones</th>
      </tr></thead><tbody>${sorted.map(s => `
        <tr class="${s.status === 'pending' ? 'row-pending' : ''}">
          <td>${escapeHtml(s.student_name)}<br><small>${escapeHtml(s.student_email || '')}</small></td>
          <td>${escapeHtml(s.advisor || s.teacher_name || '—')}</td>
          <td>${escapeHtml(s.subject)}</td><td>${escapeHtml(s.level)}</td><td>${escapeHtml(s.date)}</td><td>${escapeHtml(s.time_slot)}</td>
          <td><span class="badge badge-${s.status}">${statusLabels[s.status] || s.status}</span></td>
          <td class="admin-actions">${s.status === 'pending' ? `
            <button type="button" class="btn btn-primary btn-sm" data-accept="${s.id}">Aceptar</button>
            <button type="button" class="btn btn-outline btn-sm" data-reject-t="${s.id}">Rechazar</button>` : '—'}</td>
        </tr>`).join('')}</tbody></table>`;

      el.querySelectorAll('[data-accept]').forEach(btn => {
        btn.onclick = async () => {
          btn.disabled = true;
          try {
            await api(`/admin/tutoring/${btn.dataset.accept}/accept`, { method: 'PUT' });
            showToast('Asesoría aceptada. Notificación enviada al estudiante y al maestro.');
            loadTutoring();
            loadStats();
          } catch (e) {
            showToast(e.message, 'error');
            btn.disabled = false;
          }
        };
      });
      el.querySelectorAll('[data-reject-t]').forEach(btn => {
        btn.onclick = async () => {
          if (!confirm('¿Rechazar esta asesoría? Se notificará al estudiante.')) return;
          btn.disabled = true;
          try {
            await api(`/admin/tutoring/${btn.dataset.rejectT}/reject`, { method: 'PUT' });
            showToast('Asesoría rechazada. Notificación enviada al estudiante.', 'warn');
            loadTutoring();
            loadStats();
          } catch (e) {
            showToast(e.message, 'error');
            btn.disabled = false;
          }
        };
      });
    } catch (err) {
      el.innerHTML = `<p class="admin-empty">Error al cargar asesorías: ${escapeHtml(err.message)}</p>`;
    }
  }

  await loadStats();
  await loadUsers();
  await loadTeachers();
  await loadTutoring();
});
