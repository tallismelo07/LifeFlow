// ============================================================
//  server.js — LifeFlow Backend v4
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

const SEED_USERS = [
  { username: 'tallis', password: '0724', role: 'admin', name: 'Tallis', avatar: 'T', color: '#5B8DEF' },
  { username: 'yasmin', password: '1234', role: 'user',  name: 'Yasmin', avatar: 'Y', color: '#F0556A' },
  { username: 'pedro',  password: '123',  role: 'user',  name: 'Pedro',  avatar: 'P', color: '#2DD4BF' },
];

// ── Rate limiting simples (sem deps extras) ──────────────────

const loginAttempts = new Map();
const MAX_ATTEMPTS  = 10;
const WINDOW_MS     = 15 * 60 * 1000;

function checkRateLimit(username) {
  const now   = Date.now();
  const entry = loginAttempts.get(username);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(username, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

function resetRateLimit(username) { loginAttempts.delete(username); }

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of loginAttempts) {
    if (now > v.resetAt) loginAttempts.delete(k);
  }
}, 30 * 60 * 1000);

// ── Banco de dados SQLite ────────────────────────────────────

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

function initDB() {
  // ── Tabela users ─────────────────────────────────────────
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
      last_seen  TEXT,
      is_online  INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Migração segura: adiciona last_seen se ainda não existir
  const cols = db.prepare('PRAGMA table_info(users)').all();
  if (!cols.find((c) => c.name === 'last_seen')) {
    db.exec('ALTER TABLE users ADD COLUMN last_seen TEXT');
    console.log('✓ Coluna last_seen adicionada');
  }

  // ── Tabela user_data ──────────────────────────────────────
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

  // ── Tabela feedbacks ──────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      message    TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('✓ Tabelas criadas/verificadas');

  // ── Seed users ────────────────────────────────────────────
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
      insertUser.run({ ...seed, password: bcrypt.hashSync(seed.password, SALT_ROUNDS) });
      insertData.run({ username: seed.username });
      console.log(`✓ Usuário verificado: ${seed.username}`);
    }
  });

  seedAll(SEED_USERS);
  console.log(`✓ Banco SQLite pronto: ${DB_PATH}`);
}

// ── Prepared statements ──────────────────────────────────────

const stmts = {};

function prepareStatements() {
  stmts.findByUsername = db.prepare('SELECT * FROM users WHERE username = ?');
  stmts.findById       = db.prepare('SELECT * FROM users WHERE id = ?');

  stmts.setOnline  = db.prepare(
    'UPDATE users SET is_online = 1, last_login = ?, last_seen = ? WHERE id = ?'
  );
  stmts.setOffline = db.prepare(
    'UPDATE users SET is_online = 0 WHERE id = ?'
  );
  stmts.touchSeen  = db.prepare(
    'UPDATE users SET is_online = 1, last_seen = ? WHERE id = ?'
  );

  stmts.getAllUsers = db.prepare(
    'SELECT id, username, role, name, avatar, color, last_login, last_seen, is_online FROM users'
  );
  stmts.getUserData = db.prepare(
    'SELECT * FROM user_data WHERE user_id = ?'
  );
  stmts.upsertData = db.prepare(`
    INSERT INTO user_data
      (user_id, tasks, habits, agenda, notes, goals, study_items, transactions, updated_at)
    VALUES
      (@user_id, @tasks, @habits, @agenda, @notes, @goals, @study_items, @transactions, datetime('now'))
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

  stmts.insertFeedback = db.prepare(
    'INSERT INTO feedbacks (user_id, message) VALUES (?, ?)'
  );
  stmts.getAllFeedbacks = db.prepare(`
    SELECT f.id, f.message, f.created_at,
           u.name AS user_name, u.username, u.avatar, u.color
    FROM feedbacks f
    JOIN users u ON u.id = f.user_id
    ORDER BY f.created_at DESC
  `);
}

// ── Helpers ──────────────────────────────────────────────────

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

function safeUser(u) {
  const { password: _, ...safe } = u;
  safe.is_online = Boolean(safe.is_online);
  return safe;
}

// ── Middlewares ──────────────────────────────────────────────

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token não enviado.' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Acesso negado.' });
  next();
}

// ── Express app ──────────────────────────────────────────────

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));
app.use((req, _res, next) => {
  console.log(`${new Date().toLocaleTimeString('pt-BR')}  ${req.method} ${req.path}`);
  next();
});

// ════════════════════════════════════════════════════════════
//  ROTAS PÚBLICAS
// ════════════════════════════════════════════════════════════

app.get('/', (_req, res) =>
  res.json({ name: 'LifeFlow API', status: 'ok', version: '4.0.0' })
);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString(), db: 'sqlite' })
);

// ── Login ────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password)
    return res.status(400).json({ error: 'Usuário e senha obrigatórios.' });
  if (typeof username !== 'string' || username.length > 64)
    return res.status(400).json({ error: 'Usuário inválido.' });
  if (typeof password !== 'string' || password.length > 128)
    return res.status(400).json({ error: 'Senha inválida.' });

  const key  = username.trim().toLowerCase();

  if (!checkRateLimit(key))
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde 15 minutos.' });

  const user = stmts.findByUsername.get(key);
  if (!user)
    return res.status(401).json({ error: 'Usuário ou senha incorretos.' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return res.status(401).json({ error: 'Usuário ou senha incorretos.' });

  resetRateLimit(key);

  const now = new Date().toISOString();
  stmts.setOnline.run(now, now, user.id);

  const payload = {
    id: user.id, username: user.username, role: user.role,
    name: user.name, avatar: user.avatar, color: user.color,
  };

  return res.json({ token: jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY }), user: payload });
});

// ════════════════════════════════════════════════════════════
//  ROTAS AUTENTICADAS
// ════════════════════════════════════════════════════════════

// ── Sessão ───────────────────────────────────────────────────
app.post('/api/logout', auth, (req, res) => {
  stmts.setOffline.run(req.user.id);
  return res.json({ ok: true });
});

app.get('/api/me', auth, (req, res) => {
  const user = stmts.findById.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  return res.json({ user: safeUser(user) });
});

app.patch('/api/heartbeat', auth, (req, res) => {
  stmts.touchSeen.run(new Date().toISOString(), req.user.id);
  return res.json({ ok: true });
});

// ── Dados do usuário ─────────────────────────────────────────
app.get('/api/data', auth, (req, res) => {
  const row = stmts.getUserData.get(req.user.id);
  return res.json({ data: parseUserData(row) });
});

app.post('/api/data', auth, (req, res) => {
  const d = req.body?.data;
  if (!d || typeof d !== 'object' || Array.isArray(d))
    return res.status(400).json({ error: 'Dados inválidos.' });

  for (const f of ['tasks', 'habits', 'agenda', 'notes', 'goals', 'studyItems', 'transactions']) {
    if (d[f] !== undefined && !Array.isArray(d[f]))
      return res.status(400).json({ error: `Campo "${f}" deve ser array.` });
  }

  stmts.upsertData.run({
    user_id:      req.user.id,
    tasks:        JSON.stringify(d.tasks        ?? []),
    habits:       JSON.stringify(d.habits       ?? []),
    agenda:       JSON.stringify(d.agenda       ?? []),
    notes:        JSON.stringify(d.notes        ?? []),
    goals:        JSON.stringify(d.goals        ?? []),
    study_items:  JSON.stringify(d.studyItems   ?? []),
    transactions: JSON.stringify(d.transactions ?? []),
  });

  return res.json({ ok: true });
});

// ── Alterar senha (PATCH — padrão REST) ──────────────────────
app.patch('/api/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
  if (typeof newPassword !== 'string' || newPassword.length < 3)
    return res.status(400).json({ error: 'Nova senha deve ter pelo menos 3 caracteres.' });
  if (newPassword.length > 128)
    return res.status(400).json({ error: 'Nova senha muito longa.' });

  const user = stmts.findById.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(401).json({ error: 'Senha atual incorreta.' });

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.user.id);

  return res.json({ ok: true });
});

// Alias POST para compatibilidade com código anterior
app.post('/api/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
  if (typeof newPassword !== 'string' || newPassword.length < 3)
    return res.status(400).json({ error: 'Nova senha deve ter pelo menos 3 caracteres.' });

  const user = stmts.findById.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(401).json({ error: 'Senha atual incorreta.' });

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.user.id);
  return res.json({ ok: true });
});

// ── Feedback ─────────────────────────────────────────────────
app.post('/api/feedback', auth, (req, res) => {
  const { message } = req.body || {};

  if (!message || typeof message !== 'string')
    return res.status(400).json({ error: 'Mensagem é obrigatória.' });
  if (message.trim().length < 3)
    return res.status(400).json({ error: 'Mensagem muito curta.' });
  if (message.length > 2000)
    return res.status(400).json({ error: 'Mensagem muito longa (máx 2000 caracteres).' });

  stmts.insertFeedback.run(req.user.id, message.trim());
  return res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════
//  ROTAS ADMIN
// ════════════════════════════════════════════════════════════

// ── Lista de usuários ────────────────────────────────────────
app.get('/api/users', auth, adminOnly, (_req, res) => {
  const users = stmts.getAllUsers.all().map((u) => ({
    ...u,
    is_online: Boolean(u.is_online),
  }));
  return res.json({ users });
});

// ── Atividade dos usuários ───────────────────────────────────
app.get('/api/admin/activity', auth, adminOnly, (_req, res) => {
  const users = stmts.getAllUsers.all().map((u) => ({
    id:         u.id,
    username:   u.username,
    name:       u.name,
    avatar:     u.avatar,
    color:      u.color,
    role:       u.role,
    is_online:  Boolean(u.is_online),
    last_login: u.last_login,
    last_seen:  u.last_seen,
  }));
  return res.json({ users });
});

// ── Feedbacks (lista para admin) ─────────────────────────────
app.get('/api/feedbacks', auth, adminOnly, (_req, res) => {
  const feedbacks = stmts.getAllFeedbacks.all();
  return res.json({ feedbacks });
});

// ── Reset de senha (admin — sem precisar da senha atual) ──────
app.patch('/api/reset-password', auth, adminOnly, async (req, res) => {
  const { username, newPassword } = req.body || {};

  if (!username || !newPassword)
    return res.status(400).json({ error: 'username e newPassword são obrigatórios.' });
  if (typeof newPassword !== 'string' || newPassword.length < 3)
    return res.status(400).json({ error: 'Nova senha deve ter pelo menos 3 caracteres.' });

  const user = stmts.findByUsername.get(username.trim().toLowerCase());
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, user.id);

  return res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════
//  ERROR HANDLERS
// ════════════════════════════════════════════════════════════

app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Erro interno do servidor.' });
});

// ════════════════════════════════════════════════════════════
//  START
// ════════════════════════════════════════════════════════════

initDB();
prepareStatements();

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 LifeFlow Backend v4');
  console.log(`   http://localhost:${PORT}`);
  console.log('');
  console.log('📋 Endpoints:');
  console.log('   POST   /api/login');
  console.log('   POST   /api/logout');
  console.log('   GET    /api/me');
  console.log('   PATCH  /api/heartbeat');
  console.log('   GET    /api/data');
  console.log('   POST   /api/data');
  console.log('   PATCH  /api/change-password');
  console.log('   POST   /api/feedback');
  console.log('   GET    /api/users           (admin)');
  console.log('   GET    /api/admin/activity  (admin)');
  console.log('   GET    /api/feedbacks       (admin)');
  console.log('   PATCH  /api/reset-password  (admin)');
  console.log('');
  console.log('👤 Usuários seed:');
  console.log('   tallis / 0724  (admin)');
  console.log('   yasmin / 1234');
  console.log('   pedro  / 123');
  console.log('');
});
