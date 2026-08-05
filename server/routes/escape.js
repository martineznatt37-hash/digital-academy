/**
 * API Escape del Hacker
 * ---------------------
 * Endpoints bajo /api/escape:
 *   POST /register       → crear cuenta
 *   POST /login          → iniciar sesión (multi-dispositivo, no saca otras sesiones)
 *   GET  /me             → perfil del token actual
 *   POST /save           → guardar récord / nivel / desbloqueos
 *   POST /heartbeat      → sumar tiempo de juego (segundos)
 *   POST /admin/login    → login panel administrador
 *   GET  /admin/players  → listado de jugadores (solo admin)
 *
 * Seguridad: bcrypt + JWT. Admin = usuarios en ESCAPE_ADMIN_USERS
 * o ESCAPE_ADMIN_USER + ESCAPE_ADMIN_PASSWORD.
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

db.exec(`
  CREATE TABLE IF NOT EXISTS escape_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    record INTEGER NOT NULL DEFAULT 0,
    partidas INTEGER NOT NULL DEFAULT 0,
    max_nivel INTEGER NOT NULL DEFAULT 1,
    unlocked TEXT NOT NULL DEFAULT '[]',
    play_time_sec INTEGER NOT NULL DEFAULT 0,
    last_seen_at TEXT,
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function ensureColumn(table, column, typeSql) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeSql}`);
  }
}
ensureColumn('escape_players', 'play_time_sec', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('escape_players', 'last_seen_at', 'TEXT');
ensureColumn('escape_players', 'last_login_at', 'TEXT');

function adminUsernames() {
  const raw = process.env.ESCAPE_ADMIN_USERS || process.env.ESCAPE_ADMIN_USER || 'vibrantemoto,admin';
  return String(raw)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminUsername(usuario) {
  return adminUsernames().includes(String(usuario || '').toLowerCase());
}

function newDeviceId() {
  return crypto.randomBytes(8).toString('hex');
}

function publicPlayer(row) {
  let unlocked = [];
  try { unlocked = JSON.parse(row.unlocked || '[]'); } catch (_) { unlocked = []; }
  return {
    id: row.id,
    usuario: row.username,
    nombre: row.username,
    record: row.record || 0,
    partidas: row.partidas || 0,
    maxNivel: row.max_nivel || 1,
    unlocked,
    playTimeSec: row.play_time_sec || 0,
    lastSeenAt: row.last_seen_at || null,
    lastLoginAt: row.last_login_at || null,
    createdAt: row.created_at || null,
    isAdmin: isAdminUsername(row.username)
  };
}

function adminPlayerRow(row) {
  const p = publicPlayer(row);
  return {
    ...p,
    updatedAt: row.updated_at || null
  };
}

function issuePlayerToken(row, deviceId) {
  return jwt.sign(
    {
      escapeId: row.id,
      usuario: row.username,
      deviceId: deviceId || newDeviceId(),
      role: 'player'
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function readAuth(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.slice(7), JWT_SECRET);
  } catch {
    return null;
  }
}

function requirePlayer(req, res) {
  const payload = readAuth(req);
  if (!payload || !payload.escapeId) {
    res.status(401).json({ error: 'No autenticado' });
    return null;
  }
  const row = db.prepare('SELECT * FROM escape_players WHERE id = ?').get(payload.escapeId);
  if (!row) {
    res.status(404).json({ error: 'Jugador no encontrado' });
    return null;
  }
  return { payload, row };
}

function requireAdmin(req, res) {
  const payload = readAuth(req);
  if (!payload || payload.role !== 'admin') {
    res.status(403).json({ error: 'Solo administrador' });
    return null;
  }
  return payload;
}

function touchLogin(rowId) {
  db.prepare(`
    UPDATE escape_players
    SET last_login_at = datetime('now'), last_seen_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(rowId);
}

/** Registro */
router.post('/register', (req, res) => {
  const usuario = String(req.body.usuario || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }
  if (usuario.length < 3 || usuario.length > 16) {
    return res.status(400).json({ error: 'El usuario debe tener entre 3 y 16 caracteres' });
  }
  if (!/^[a-z0-9_]+$/.test(usuario)) {
    return res.status(400).json({ error: 'Solo letras, números y guion bajo' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
  }

  const existing = db.prepare('SELECT id FROM escape_players WHERE username = ?').get(usuario);
  if (existing) {
    return res.status(409).json({ error: 'Ese usuario ya existe' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO escape_players (username, password_hash, last_login_at, last_seen_at)
    VALUES (?, ?, datetime('now'), datetime('now'))
  `).run(usuario, hash);

  const row = db.prepare('SELECT * FROM escape_players WHERE id = ?').get(result.lastInsertRowid);
  const deviceId = String(req.body.deviceId || newDeviceId());
  const token = issuePlayerToken(row, deviceId);
  res.status(201).json({ token, deviceId, player: publicPlayer(row) });
});

/**
 * Login: emite un JWT nuevo por dispositivo.
 * NO invalida otras sesiones (varios celulares/PC a la vez).
 */
router.post('/login', (req, res) => {
  const usuario = String(req.body.usuario || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const row = db.prepare('SELECT * FROM escape_players WHERE username = ?').get(usuario);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  touchLogin(row.id);
  const updated = db.prepare('SELECT * FROM escape_players WHERE id = ?').get(row.id);
  const deviceId = String(req.body.deviceId || newDeviceId());
  const token = issuePlayerToken(updated, deviceId);
  res.json({ token, deviceId, player: publicPlayer(updated) });
});

router.get('/me', (req, res) => {
  const auth = requirePlayer(req, res);
  if (!auth) return;
  db.prepare(`UPDATE escape_players SET last_seen_at = datetime('now') WHERE id = ?`).run(auth.row.id);
  const row = db.prepare('SELECT * FROM escape_players WHERE id = ?').get(auth.row.id);
  res.json({ player: publicPlayer(row) });
});

router.post('/save', (req, res) => {
  const auth = requirePlayer(req, res);
  if (!auth) return;
  const row = auth.row;

  const record = Math.max(row.record || 0, Number(req.body.record) || 0);
  const partidas = Math.max(row.partidas || 0, Number(req.body.partidas) || 0);
  const maxNivel = Math.max(row.max_nivel || 1, Number(req.body.maxNivel) || 1);
  let unlocked = [];
  try { unlocked = JSON.parse(row.unlocked || '[]'); } catch (_) { unlocked = []; }
  const incoming = Array.isArray(req.body.unlocked) ? req.body.unlocked : [];
  unlocked = Array.from(new Set([...unlocked, ...incoming]));

  let playExtra = Math.floor(Number(req.body.playSeconds) || 0);
  if (!Number.isFinite(playExtra) || playExtra < 0) playExtra = 0;
  playExtra = Math.min(playExtra, 120); // máx 2 min por request (anti-abuso)
  const playTime = (row.play_time_sec || 0) + playExtra;

  db.prepare(`
    UPDATE escape_players
    SET record = ?, partidas = ?, max_nivel = ?, unlocked = ?,
        play_time_sec = ?, last_seen_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(record, partidas, maxNivel, JSON.stringify(unlocked), playTime, row.id);

  const updated = db.prepare('SELECT * FROM escape_players WHERE id = ?').get(row.id);
  res.json({ player: publicPlayer(updated) });
});

/** Heartbeat de tiempo en partida (no interrumpe otras sesiones). */
router.post('/heartbeat', (req, res) => {
  const auth = requirePlayer(req, res);
  if (!auth) return;
  let playExtra = Math.floor(Number(req.body.playSeconds) || 0);
  if (!Number.isFinite(playExtra) || playExtra < 0) playExtra = 0;
  playExtra = Math.min(playExtra, 90);
  const maxNivel = Math.max(auth.row.max_nivel || 1, Number(req.body.maxNivel) || 1);
  const record = Math.max(auth.row.record || 0, Number(req.body.record) || 0);

  db.prepare(`
    UPDATE escape_players
    SET play_time_sec = play_time_sec + ?,
        max_nivel = ?,
        record = ?,
        last_seen_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(playExtra, maxNivel, record, auth.row.id);

  const updated = db.prepare('SELECT * FROM escape_players WHERE id = ?').get(auth.row.id);
  res.json({ player: publicPlayer(updated) });
});

/**
 * Admin login:
 * 1) Usuario listado en ESCAPE_ADMIN_USERS + su contraseña de juego
 * 2) O ESCAPE_ADMIN_USER + ESCAPE_ADMIN_PASSWORD (cuenta dedicada)
 */
router.post('/admin/login', (req, res) => {
  const usuario = String(req.body.usuario || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const envUser = String(process.env.ESCAPE_ADMIN_USER || '').trim().toLowerCase();
  const envPass = process.env.ESCAPE_ADMIN_PASSWORD || '';
  if (envUser && envPass && usuario === envUser && password === envPass) {
    const token = jwt.sign({ role: 'admin', usuario }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, admin: { usuario } });
  }

  if (!isAdminUsername(usuario)) {
    return res.status(403).json({ error: 'Esta cuenta no es administrador' });
  }

  const row = db.prepare('SELECT * FROM escape_players WHERE username = ?').get(usuario);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  const token = jwt.sign({ role: 'admin', usuario, escapeId: row.id }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, admin: { usuario } });
});

router.get('/admin/players', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const rows = db.prepare(`
    SELECT * FROM escape_players
    ORDER BY datetime(COALESCE(last_seen_at, updated_at, created_at)) DESC
  `).all();
  res.json({
    total: rows.length,
    players: rows.map(adminPlayerRow)
  });
});

router.get('/admin/stats', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const total = db.prepare('SELECT COUNT(*) AS n FROM escape_players').get().n;
  const tiempo = db.prepare('SELECT COALESCE(SUM(play_time_sec),0) AS s FROM escape_players').get().s;
  const topNivel = db.prepare('SELECT COALESCE(MAX(max_nivel),1) AS n FROM escape_players').get().n;
  res.json({ totalJugadores: total, tiempoTotalSec: tiempo, nivelMaxGlobal: topNivel });
});

module.exports = router;
