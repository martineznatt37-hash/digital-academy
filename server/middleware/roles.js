const db = require('../db');

function loadUserRole(req, res, next) {
  if (!req.user?.id) return res.status(401).json({ error: 'No autenticado' });
  const row = db.prepare('SELECT id, name, email, role, education_level, level FROM users WHERE id = ?').get(req.user.id);
  if (!row) return res.status(401).json({ error: 'Usuario no encontrado' });
  req.user = row;
  next();
}

function adminMiddleware(req, res, next) {
  loadUserRole(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso solo para administradores' });
    next();
  });
}

function teacherMiddleware(req, res, next) {
  loadUserRole(req, res, () => {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso solo para maestros' });
    }
    next();
  });
}

module.exports = { loadUserRole, adminMiddleware, teacherMiddleware };
