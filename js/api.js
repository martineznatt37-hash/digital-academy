const API_BASE = window.location.protocol === 'file:'
  ? 'http://localhost:3001/api'
  : '/api';

const Auth = {
  getToken() {
    return localStorage.getItem('da_token');
  },
  setToken(token) {
    localStorage.setItem('da_token', token);
    window.dispatchEvent(new CustomEvent('da-auth-change'));
  },
  clearToken() {
    localStorage.removeItem('da_token');
    localStorage.removeItem('da_user');
    window.dispatchEvent(new CustomEvent('da-auth-change'));
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('da_user'));
    } catch {
      return null;
    }
  },
  setUser(user) {
    localStorage.setItem('da_user', JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('da-auth-change'));
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  requireAuth(redirectTo = 'login.html') {
    if (!this.isLoggedIn()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  }
};

async function api(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = Auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || 'Error en la solicitud');
    err.status = res.status;
    throw err;
  }
  return data;
}

function getInitials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function formatDate(dateStr) {
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return formatDate(dateStr);
}

function educationToCourseLevel(edu) {
  const map = {
    Primaria: 'primaria',
    Secundaria: 'secundaria',
    Preparatoria: 'preparatoria',
    'Capacitación tecnológica': 'capacitacion'
  };
  return map[edu] || null;
}

function levelLabel(level) {
  if (level >= 10) return 'Estudiante experto';
  if (level >= 7) return 'Estudiante avanzado';
  if (level >= 4) return 'Estudiante intermedio';
  return 'Estudiante principiante';
}

function updateNavAuth() {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions || !Auth.isLoggedIn()) return;

  const user = Auth.getUser();
  const loginBtn = navActions.querySelector('a[href="login.html"]');
  const registerBtn = navActions.querySelector('a[href="register.html"]');
  if (loginBtn) loginBtn.textContent = user?.name?.split(' ')[0] || 'Mi perfil';
  if (loginBtn) {
    loginBtn.href = user?.role === 'admin' ? 'admin.html' : user?.role === 'teacher' ? 'teacher.html' : 'profile.html';
  }
  if (registerBtn) registerBtn.textContent = 'Cerrar sesión';
  if (registerBtn) {
    registerBtn.href = '#';
    registerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.clearToken();
      window.location.href = 'index.html';
    });
  }
}

window.API = { api, Auth, getInitials, formatDate, timeAgo, levelLabel, educationToCourseLevel, updateNavAuth };
