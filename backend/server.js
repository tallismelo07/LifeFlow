// ============================================================
//  server.js — LifeFlow Backend
//  Node.js + Express + JWT + bcryptjs + SQLite (better-sqlite3)
//  Porta: 3001
// ============================================================

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const cors     = require('cors');
const path     = require('path');
const Database = require('better-sqlite3');

// ── Configurações ────────────────────────────────────────────

const PORT        = process.env.PORT || 3001;
const JWT_SECRET  = process.env.JWT_SECRET || 'lifeflow-secret-2024-mude-em-producao';
const JWT_EXPIRY  = '7d';
const SALT_ROUNDS = 10;
const DB_PATH     = path.join(__dirname, 'lifeflow.db');

// Rate limiting simples para login (sem dependências externas)
const loginAttempts = new Map(); // username → { count, resetAt }
const MAX_ATTEMPTS  = 10;
const WINDOW_MS     = 15 * 60 * 1000; // 15 minutos

function checkRateLimit(username) {
  const now  = Date.now();
  const entry = loginAttempts.get(username);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(username, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

function resetRateLimit(username) {
  loginAttempts.delete(username);
}

// Limpa entradas expiradas a cada 30 min
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of loginAttempts) {
    if (now > v.resetAt) loginAttempts.delete(k);
  }
}, 30 * 60 * 1000);

const SEED_USERS = [
  { username: 'tallis', password: '0724', role: 'admin', name: 'Tallis', avatar: 'T', color: '#5B8DEF' },
  { username: 'yasmin', password: '1234', role: 'user',  name: 'Yasmin', avatar: 'Y', color: '#F0556A' },
  { username: 'pedro',  password: '123',  role: 'user',  name: 'Pedro',  avatar: 'P', color: '#2DD4BF' },
];

// ── Banco de dados SQLite ────────────────────────────────────

const db = new Database(DB_PATH);

// Otimizações de performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

function initDB() {
  // Cria tabela de usuários
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT    UNIQUE NOT NULL,
      password   TEXT    NOT NULL,
      role       TEXT    NOT NULL DEFAULT 'user',
      name       TEXT    NOT NULL,
      avatar     TEXT    NOT NULL,
      color      TEXT    NOT NULL,
      last_login TEXT,
      is_online  INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Cria tabela de dados por usuário
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_data (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL UNIQUE,
      tasks        TEXT    NOT NULL DEFAULT '[]',
      habits       TEXT    NOT NULL DEFAULT '[]',
      agenda       TEXT    NOT NULL DEFAULT '[]',
      notes        TEXT    NOT NULL DEFAULT '[]',
      goals        TEXT    NOT NULL DEFAULT '[]',
      study_items  TEXT    NOT NULL DEFAULT '[]',
      transactions TEXT    NOT NULL DEFAULT '[]',
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('✓ Tabelas criadas/verificadas');

  // Insere usuários seed se não existirem
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, password, role, name, avatar, color)
    VALUES (@username, @password, @role, @name, @avatar, @color)
  `);

  const insertData = db.prepare(`
    INSERT OR IGNORE INTO user_data (user_id)
    SELECT id FROM users WHERE username = @username
  `);

  const seedAll = db.transaction((seeds) => {
    for (const seed of seeds) {
      const hash = bcrypt.hashSync(seed.password, SALT_ROUNDS);
      insertUser.run({ ...seed, password: hash });
      insertData.run({ username: seed.username });
      console.log(`✓ Usuário verificado: ${seed.username}`);
    }
  });

  seedAll(SEED_USERS);
  console.log(`✓ Banco SQLite pronto: ${DB_PATH}`);
}

// ── Helpers de dados ─────────────────────────────────────────

const stmts = {
  findUserByUsername: null,
  findUserById:       null,
  setOnline:          null,
  setOffline:         null,
  updateLastLogin:    null,
  getAllUsers:        null,
  getUserData:        null,
  upsertUserData:     null,
};

function prepareStatements() {
  stmts.findUserByUsername = db.prepare(
    'SELECT * FROM users WHERE username = ?'
  );
  stmts.findUserById = db.prepare(
    'SELECT * FROM users WHERE id = ?'
  );
  stmts.setOnline = db.prepare(
    'UPDATE users SET is_online = 1, last_login = ? WHERE id = ?'
  );
  stmts.setOffline = db.prepare(
    'UPDATE users SET is_online = 0 WHERE id = ?'
  );
  stmts.updateLastLogin = db.prepare(
    'UPDATE users SET last_login = ? WHERE id = ?'
  );
  stmts.getAllUsers = db.prepare(
    'SELECT id, username, role, name, avatar, color, last_login, is_online FROM users'
  );
  stmts.getUserData = db.prepare(
    'SELECT * FROM user_data WHERE user_id = ?'
  );
  stmts.upsertUserData = db.prepare(`
    INSERT INTO user_data (user_id, tasks, habits, agenda, notes, goals, study_items, transactions, updated_at)
    VALUES (@user_id, @tasks, @habits, @agenda, @notes, @goals, @study_items, @transactions, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      tasks        = @tasks,
      habits       = @habits,
      agenda       = @agenda,
      notes        = @notes,
      goals        = @goals,
      study_items  = @study_items,
      transactions = @transactions,
      updated_at   = datetime('now')
  `);
}

function parseUserData(row) {
  if (!row) return { tasks: [], habits: [], agenda: [], notes: [], goals: [], studyItems: [], transactions: [] };
  return {
    tasks:        JSON.parse(row.tasks        || '[]'),
    habits:       JSON.parse(row.habits       || '[]'),
    agenda:       JSON.parse(row.agenda       || '[]'),
    notes:        JSON.parse(row.notes        || '[]'),
    goals:        JSON.parse(row.goals        || '[]'),
    studyItems:   JSON.parse(row.study_items  || '[]'),
    transactions: JSON.parse(row.transactions || '[]'),
  };
}

function safeUser(user) {
  const { password: _, ...safe } = user;
  safe.is_online = Boolean(safe.is_online);
  return safe;
}

// ── Middlewares ──────────────────────────────────────────────

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não enviado.' });
  }
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado.' });
  }
  next();
}

// ── App Express ──────────────────────────────────────────────

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));

app.use((req, _res, next) => {
  console.log(`${new Date().toLocaleTimeString('pt-BR')}  ${req.method} ${req.path}`);
  next();
});

// ── Rotas ────────────────────────────────────────────────────

// GET / — health visual
app.get('/', (_req, res) => {
  res.json({ name: 'LifeFlow API', status: 'ok', version: '3.0.0' });
});

// GET /api/health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), db: 'sqlite' });
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha obrigatórios.' });
  }

  if (typeof username !== 'string' || username.length > 64) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  if (typeof password !== 'string' || password.length > 128) {
    return res.status(400).json({ error: 'Senha inválida.' });
  }

  const key = username.trim().toLowerCase();

  if (!checkRateLimit(key)) {
    return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' });
  }

  const user = stmts.findUserByUsername.get(key);

  if (!user) {
    return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
  }

  resetRateLimit(key);

  const now = new Date().toISOString();
  stmts.setOnline.run(now, user.id);

  const payload = {
    id:       user.id,
    username: user.username,
    role:     user.role,
    name:     user.name,
    avatar:   user.avatar,
    color:    user.color,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

  return res.json({ token, user: payload });
});

// POST /api/logout
app.post('/api/logout', authMiddleware, (req, res) => {
  stmts.setOffline.run(req.user.id);
  return res.json({ ok: true });
});

// GET /api/me
app.get('/api/me', authMiddleware, (req, res) => {
  const user = stmts.findUserById.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  return res.json({ user: safeUser(user) });
});

// PATCH /api/heartbeat
app.patch('/api/heartbeat', authMiddleware, (req, res) => {
  stmts.setOnline.run(new Date().toISOString(), req.user.id);
  return res.json({ ok: true });
});

// GET /api/users (admin)
app.get('/api/users', authMiddleware, adminMiddleware, (_req, res) => {
  const users = stmts.getAllUsers.all().map((u) => ({
    ...u,
    is_online: Boolean(u.is_online),
  }));
  return res.json({ users });
});

// GET /api/data
app.get('/api/data', authMiddleware, (req, res) => {
  const row  = stmts.getUserData.get(req.user.id);
  const data = parseUserData(row);
  return res.json({ data });
});

// POST /api/change-password
app.post('/api/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 3) {
    return res.status(400).json({ error: 'Nova senha deve ter pelo menos 3 caracteres.' });
  }
  if (newPassword.length > 128) {
    return res.status(400).json({ error: 'Nova senha muito longa.' });
  }

  const user = stmts.findUserById.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Senha atual incorreta.' });
  }

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, user.id);

  return res.json({ ok: true });
});

// POST /api/data
app.post('/api/data', authMiddleware, (req, res) => {
  const newData = req.body?.data;

  if (!newData || typeof newData !== 'object' || Array.isArray(newData)) {
    return res.status(400).json({ error: 'Dados inválidos.' });
  }

  const ARRAY_FIELDS = ['tasks', 'habits', 'agenda', 'notes', 'goals', 'studyItems', 'transactions'];
  for (const field of ARRAY_FIELDS) {
    const val = newData[field];
    if (val !== undefined && !Array.isArray(val)) {
      return res.status(400).json({ error: `Campo "${field}" deve ser um array.` });
    }
  }

  stmts.upsertUserData.run({
    user_id:      req.user.id,
    tasks:        JSON.stringify(newData.tasks        ?? []),
    habits:       JSON.stringify(newData.habits       ?? []),
    agenda:       JSON.stringify(newData.agenda       ?? []),
    notes:        JSON.stringify(newData.notes        ?? []),
    goals:        JSON.stringify(newData.goals        ?? []),
    study_items:  JSON.stringify(newData.studyItems   ?? []),
    transactions: JSON.stringify(newData.transactions ?? []),
  });

  return res.json({ ok: true });
});

// ── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// ── Error handler global ──────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Erro interno do servidor.' });
});

// ── Start ────────────────────────────────────────────────────

initDB();
prepareStatements();

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 LifeFlow Backend v3 rodando!');
  console.log(`   URL: http://localhost:${PORT}`);
  console.log('');
  console.log('📋 Endpoints:');
  console.log('   POST  /api/login');
  console.log('   POST  /api/logout');
  console.log('   GET   /api/me');
  console.log('   PATCH /api/heartbeat');
  console.log('   GET   /api/users  (admin)');
  console.log('   GET   /api/data');
  console.log('   POST  /api/data');
  console.log('');
  console.log('👤 Usuários:');
  console.log('   tallis / 0724  (admin)');
  console.log('   yasmin / 1234');
  console.log('   pedro  / 123');
  console.log('');
});
