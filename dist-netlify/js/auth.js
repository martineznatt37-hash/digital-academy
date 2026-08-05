/* Auth page interactions */
document.addEventListener('DOMContentLoaded', () => {
  const { api, Auth } = window.API;

  if (Auth.isLoggedIn()) {
    const u = Auth.getUser();
    window.location.href = u?.role === 'admin' ? 'admin.html' : u?.role === 'teacher' ? 'teacher.html' : 'profile.html';
    return;
  }

  function showError(form, message) {
    let err = form.querySelector('.auth-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'auth-error';
      err.style.cssText = 'background:#FEE2E2;color:#DC2626;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:.875rem';
      form.prepend(err);
    }
    err.textContent = message;
  }

  const loginForm = document.getElementById('login-form');
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Iniciando sesión...';
    btn.disabled = true;

    try {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      Auth.setToken(data.token);
      Auth.setUser(data.user);
      window.location.href = data.user.role === 'admin' ? 'admin.html' : data.user.role === 'teacher' ? 'teacher.html' : 'profile.html';
    } catch (err) {
      showError(loginForm, err.message);
      btn.textContent = original;
      btn.disabled = false;
    }
  });

  const registerForm = document.getElementById('register-form');
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = registerForm.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Creando cuenta...';
    btn.disabled = true;

    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('name').value,
          email: document.getElementById('email').value,
          password: document.getElementById('password').value,
          education_level: document.getElementById('level').value
        })
      });
      Auth.setToken(data.token);
      Auth.setUser(data.user);
      window.location.href = 'profile.html';
    } catch (err) {
      showError(registerForm, err.message);
      btn.textContent = original;
      btn.disabled = false;
    }
  });

  const recoverForm = document.getElementById('recover-form');
  recoverForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = recoverForm.querySelector('button[type="submit"]');
    btn.textContent = 'Enlace enviado ✓';
    btn.disabled = true;
  });

  const passwordInput = document.getElementById('password');
  const strengthBar = document.querySelector('.password-strength-bar');
  if (passwordInput && strengthBar) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      let strength = 0;
      if (val.length >= 6) strength += 25;
      if (val.length >= 10) strength += 25;
      if (/[A-Z]/.test(val)) strength += 25;
      if (/[0-9]/.test(val)) strength += 25;
      strengthBar.style.width = strength + '%';
      strengthBar.style.background =
        strength < 50 ? 'var(--danger)' : strength < 75 ? 'var(--warning)' : 'var(--success)';
    });
  }
});
