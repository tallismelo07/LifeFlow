// ============================================================
//  server.js — LifeFlow Backend v7
//  Node.js + Express + JWT + bcryptjs + SQLite (better-sqlite3)
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

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'lifeflow.db');

const SEED_USERS = [
  { username: 'tallis', password: '0724', role: 'admin', name: 'Tallis', avatar: 'T', color: '#5B8DEF' },
  { username: 'yasmin', password: '1234', role: 'user',  name: 'Yasmin', avatar: 'Y', color: '#F0556A' },
  { username: 'pedro',  password: '123',  role: 'user',  name: 'Pedro',  avatar: 'P', color: '#2DD4BF' },
];

// ── Rate limiting simples ────────────────────────────────────

const loginAttempts = new Map();
const MAX_ATTEMPTS  = 10;
const WINDOW_MS     = 15 * 60 * 1000;

function checkRateLimit(key) {
  const now   = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

function resetRateLimit(key) { loginAttempts.delete(key); }

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of loginAttempts) {
    if (now > v.resetAt) loginAttempts.delete(k);
  }
}, 30 * 60 * 1000);

// ── Banco de dados SQLite ────────────────────────────────────

const db = new Database(DB_PATH);

// Performance e durabilidade
db.pragma('journal_mode = WAL');       // Write-Ahead Log: leituras não bloqueiam escritas
db.pragma('synchronous  = NORMAL');    // NORMAL é seguro com WAL; FULL é mais lento sem benefício real
db.pragma('foreign_keys = ON');
db.pragma('cache_size   = -32000');    // 32 MB de cache em memória
db.pragma('temp_store   = MEMORY');    // tabelas temporárias na RAM
db.pragma('mmap_size    = 268435456'); // 256 MB mmap para leitura rápida
db.pragma('wal_autocheckpoint = 1000');

// ── Timestamp helper — SEMPRE ISO8601 UTC com sufixo Z ───────
function nowISO() { return new Date().toISOString(); }

// ── Log no banco (helper) ────────────────────────────────────

let _logStmt = null;
function logDB(level, message, source = 'system', userId = null) {
  try {
    if (!_logStmt) {
      _logStmt = db.prepare(
        'INSERT INTO logs (level, message, source, user_id, created_at) VALUES (?, ?, ?, ?, ?)'
      );
    }
    _logStmt.run(level, String(message).slice(0, 500), source, userId || null, nowISO());
  } catch { /* nunca falha */ }
}

// ── Init do banco ────────────────────────────────────────────

function initDB() {
  // ── Tabelas ─────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT    UNIQUE NOT NULL,
      password   TEXT    NOT NULL,
      role       TEXT    NOT NULL DEFAULT 'user',
      name       TEXT    NOT NULL,
      avatar     TEXT    NOT NULL,
      color      TEXT    NOT NULL DEFAULT '#5B8DEF',
      email      TEXT    NOT NULL DEFAULT '',
      last_login TEXT,
      last_seen  TEXT,
      is_online  INTEGER NOT NULL DEFAULT 0
    )
  `);

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
      cards        TEXT    NOT NULL DEFAULT '[]',
      updated_at   TEXT    NOT NULL DEFAULT '',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      message    TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT '',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      level      TEXT    NOT NULL DEFAULT 'info',
      message    TEXT    NOT NULL,
      source     TEXT    NOT NULL DEFAULT 'system',
      user_id    INTEGER,
      created_at TEXT    NOT NULL DEFAULT ''
    )
  `);

  // ── Índices para melhor performance ─────────────────────────
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_data_user_id  ON user_data (user_id);
    CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id  ON feedbacks (user_id);
    CREATE INDEX IF NOT EXISTS idx_feedbacks_created  ON feedbacks (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_logs_created       ON logs (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_logs_user_id       ON logs (user_id);
    CREATE INDEX IF NOT EXISTS idx_logs_level         ON logs (level);
  `);

  // ── Migrações — adiciona colunas que possam estar faltando ──
  const userCols     = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  const userDataCols = db.prepare('PRAGMA table_info(user_data)').all().map((c) => c.name);

  if (!userCols.includes('email')) {
    db.exec("ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT ''");
    console.log('✓ Migração: coluna users.email adicionada');
  }
  if (!userDataCols.includes('cards')) {
    db.exec("ALTER TABLE user_data ADD COLUMN cards TEXT NOT NULL DEFAULT '[]'");
    console.log('✓ Migração: coluna user_data.cards adicionada');
  }
  if (!userDataCols.includes('notes')) {
    db.exec("ALTER TABLE user_data ADD COLUMN notes TEXT NOT NULL DEFAULT '[]'");
    console.log('✓ Migração: coluna user_data.notes adicionada');
  }

  // ── Seed dos usuários iniciais ───────────────────────────────
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, password, role, name, avatar, color)
    VALUES (@username, @password, @role, @name, @avatar, @color)
  `);
  const ensureData = db.prepare(`
    INSERT OR IGNORE INTO user_data (user_id, updated_at)
    SELECT id, '' FROM users WHERE username = @username
  `);

  const seedTx = db.transaction((seeds) => {
    for (const s of seeds) {
      insertUser.run({ ...s, password: bcrypt.hashSync(s.password, SALT_ROUNDS) });
      ensureData.run({ username: s.username });
    }
  });

  seedTx(SEED_USERS);
  console.log(`✓ Banco pronto: ${DB_PATH}`);
}

// ── Prepared statements ──────────────────────────────────────

const stmts = {};

function prepareStatements() {
  stmts.findByUsername = db.prepare('SELECT * FROM users WHERE username = ?');
  stmts.findById       = db.prepare('SELECT * FROM users WHERE id = ?');
  stmts.setOnline      = db.prepare('UPDATE users SET is_online=1, last_login=?, last_seen=? WHERE id=?');
  stmts.setOffline     = db.prepare('UPDATE users SET is_online=0 WHERE id=?');
  stmts.touchSeen      = db.prepare('UPDATE users SET is_online=1, last_seen=? WHERE id=?');
  stmts.getAllUsers     = db.prepare(
    'SELECT id,username,role,name,avatar,color,email,last_login,last_seen,is_online FROM users ORDER BY name'
  );
  stmts.getUserData = db.prepare('SELECT * FROM user_data WHERE user_id = ?');

  stmts.upsertData = db.prepare(`
    INSERT INTO user_data
      (user_id, tasks, habits, agenda, notes, goals, study_items, transactions, cards, updated_at)
    VALUES
      (@user_id, @tasks, @habits, @agenda, @notes, @goals, @study_items, @transactions, @cards, @updated_at)
    ON CONFLICT(user_id) DO UPDATE SET
      tasks        = @tasks,
      habits       = @habits,
      agenda       = @agenda,
      notes        = @notes,
      goals        = @goals,
      study_items  = @study_items,
      transactions = @transactions,
      cards        = @cards,
      updated_at   = @updated_at
  `);

  stmts.insertFeedback = db.prepare('INSERT INTO feedbacks (user_id, message, created_at) VALUES (?, ?, ?)');
  stmts.getAllFeedbacks = db.prepare(`
    SELECT f.id, f.message, f.created_at,
           u.name AS user_name, u.username, u.avatar, u.color
    FROM feedbacks f
    JOIN users u ON u.id = f.user_id
    ORDER BY f.created_at DESC
    LIMIT 500
  `);
  stmts.getLogs = db.prepare(`
    SELECT l.id, l.level, l.message, l.source, l.created_at, u.username
    FROM logs l
    LEFT JOIN users u ON u.id = l.user_id
    ORDER BY l.created_at DESC
    LIMIT ?
  `);
}

// ── Helpers ──────────────────────────────────────────────────

const DATA_FIELDS = ['tasks', 'habits', 'agenda', 'notes', 'goals', 'studyItems', 'transactions', 'cards'];

function parseUserData(row) {
  if (!row) return {
    tasks: [], habits: [], agenda: [], notes: [],
    goals: [], studyItems: [], transactions: [], cards: [],
    updated_at: null,
  };
  return {
    tasks:        safeJSON(row.tasks,        []),
    habits:       safeJSON(row.habits,       []),
    agenda:       safeJSON(row.agenda,       []),
    notes:        safeJSON(row.notes,        []),
    goals:        safeJSON(row.goals,        []),
    studyItems:   safeJSON(row.study_items,  []),
    transactions: safeJSON(row.transactions, []),
    cards:        safeJSON(row.cards,        []),
    updated_at:   row.updated_at || null,
  };
}

function safeJSON(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

function countItems(data) {
  return DATA_FIELDS.reduce((n, k) => n + ((data[k] || []).length), 0);
}

function safeUser(u) {
  const { password: _, ...safe } = u;
  safe.is_online = Boolean(safe.is_online);
  return safe;
}

// ── Middlewares ──────────────────────────────────────────────

function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token não enviado.' });
  try {
    req.user = jwt.verify(h.split(' ')[1], JWT_SECRET);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Sessão expirada. Faça login novamente.' : 'Token inválido.';
    return res.status(401).json({ error: msg });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Acesso negado.' });
  next();
}

// ── Express app ──────────────────────────────────────────────

const app = express();

const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

app.use((req, _res, next) => {
  console.log(`${new Date().toLocaleTimeString('pt-BR')}  ${req.method} ${req.path}`);
  next();
});

// ════════════════════════════════════════════════════════════
//  ROTAS PÚBLICAS
// ════════════════════════════════════════════════════════════

app.get('/', (_req, res) =>
  res.json({ name: 'LifeFlow API', status: 'ok', version: '7.0.0' })
);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', time: nowISO(), db: DB_PATH, version: '7.0.0' })
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

  const key = username.trim().toLowerCase();
  if (!checkRateLimit(key)) {
    logDB('warn', `Rate limit atingido: ${key}`, 'auth');
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde 15 minutos.' });
  }

  const user = stmts.findByUsername.get(key);
  if (!user) {
    logDB('warn', `Login falhou (usuário não existe): ${key}`, 'auth');
    return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    logDB('warn', `Login falhou (senha errada): ${key}`, 'auth', user.id);
    return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
  }

  resetRateLimit(key);
  const now = nowISO();
  stmts.setOnline.run(now, now, user.id);
  logDB('info', `Login OK: ${key}`, 'auth', user.id);

  const payload = {
    id: user.id, username: user.username, role: user.role,
    name: user.name, avatar: user.avatar, color: user.color,
  };
  return res.json({ token: jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY }), user: payload });
});

// ════════════════════════════════════════════════════════════
//  ROTAS AUTENTICADAS
// ════════════════════════════════════════════════════════════

app.post('/api/logout', auth, (req, res) => {
  stmts.setOffline.run(req.user.id);
  logDB('info', `Logout: ${req.user.username}`, 'auth', req.user.id);
  return res.json({ ok: true });
});

app.get('/api/me', auth, (req, res) => {
  const user = stmts.findById.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  return res.json({ user: safeUser(user) });
});

app.patch('/api/heartbeat', auth, (req, res) => {
  stmts.touchSeen.run(nowISO(), req.user.id);
  return res.json({ ok: true });
});

// ── GET /api/data ─────────────────────────────────────────────
app.get('/api/data', auth, (req, res) => {
  const row  = stmts.getUserData.get(req.user.id);
  const data = parseUserData(row);
  console.log(`[GET /api/data] user=${req.user.username} total=${countItems(data)} itens`);
  return res.json({ data });
});

// ── POST /api/data ────────────────────────────────────────────
app.post('/api/data', auth, (req, res) => {
  const incoming = req.body?.data;

  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return res.status(400).json({ error: 'Campo "data" é obrigatório e deve ser objeto.' });
  }

  // Valida que todos os campos enviados são arrays
  for (const f of DATA_FIELDS) {
    const key = f === 'studyItems' ? 'studyItems' : f;
    if (incoming[key] !== undefined && !Array.isArray(incoming[key])) {
      return res.status(400).json({ error: `Campo "${key}" deve ser array.` });
    }
  }

  const incomingTotal = countItems(incoming);

  // Busca o estado atual no banco
  const existing     = stmts.getUserData.get(req.user.id);
  const currentData  = parseUserData(existing);
  const currentTotal = countItems(currentData);

  // Proteção anti-wipe: não sobrescreve dados existentes com payload vazio
  if (incomingTotal === 0 && currentTotal > 0) {
    logDB('warn',
      `Anti-wipe: recusado (0 itens recebidos, banco tem ${currentTotal}). user=${req.user.username}`,
      'data', req.user.id
    );
    return res.json({ ok: true, protected: true });
  }

  const toSave = {
    user_id:      req.user.id,
    tasks:        JSON.stringify(incoming.tasks        ?? currentData.tasks),
    habits:       JSON.stringify(incoming.habits       ?? currentData.habits),
    agenda:       JSON.stringify(incoming.agenda       ?? currentData.agenda),
    notes:        JSON.stringify(incoming.notes        ?? currentData.notes),
    goals:        JSON.stringify(incoming.goals        ?? currentData.goals),
    study_items:  JSON.stringify(incoming.studyItems   ?? currentData.studyItems),
    transactions: JSON.stringify(incoming.transactions ?? currentData.transactions),
    cards:        JSON.stringify(incoming.cards        ?? currentData.cards),
    updated_at:   nowISO(),
  };

  stmts.upsertData.run(toSave);
  console.log(`[POST /api/data] ✓ user=${req.user.username} total=${incomingTotal} itens`);
  return res.json({ ok: true, total: incomingTotal });
});

// ── PATCH /api/user/profile ───────────────────────────────────
app.patch('/api/user/profile', auth, (req, res) => {
  const { name, email } = req.body || {};
  if (!name || typeof name !== 'string' || name.trim().length < 2)
    return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres.' });

  const cleanName  = name.trim().slice(0, 64);
  const cleanEmail = String(email || '').trim().slice(0, 128);

  db.prepare('UPDATE users SET name=?, email=? WHERE id=?').run(cleanName, cleanEmail, req.user.id);
  logDB('info', `Perfil atualizado: ${req.user.username} → "${cleanName}"`, 'profile', req.user.id);
  return res.json({ ok: true, name: cleanName, email: cleanEmail });
});

// ── PATCH /api/change-password ────────────────────────────────
app.patch('/api/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
  if (typeof newPassword !== 'string' || newPassword.length < 3)
    return res.status(400).json({ error: 'Nova senha deve ter pelo menos 3 caracteres.' });

  const user = stmts.findById.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    logDB('warn', `Troca de senha falhou: ${req.user.username}`, 'auth', req.user.id);
    return res.status(401).json({ error: 'Senha atual incorreta.' });
  }

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  db.prepare('UPDATE users SET password=? WHERE id=?').run(hash, req.user.id);
  logDB('info', `Senha alterada: ${req.user.username}`, 'auth', req.user.id);
  return res.json({ ok: true });
});

// Alias POST para compatibilidade
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
  db.prepare('UPDATE users SET password=? WHERE id=?').run(hash, req.user.id);
  return res.json({ ok: true });
});

// ── POST /api/feedback ────────────────────────────────────────
app.post('/api/feedback', auth, (req, res) => {
  const { message } = req.body || {};
  if (!message || typeof message !== 'string' || message.trim().length < 3)
    return res.status(400).json({ error: 'Mensagem inválida (mínimo 3 caracteres).' });
  if (message.length > 2000)
    return res.status(400).json({ error: 'Mensagem muito longa (máximo 2000 caracteres).' });

  stmts.insertFeedback.run(req.user.id, message.trim(), nowISO());
  logDB('info', `Feedback de ${req.user.username}`, 'feedback', req.user.id);
  return res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════
//  ROTAS ADMIN
// ════════════════════════════════════════════════════════════

app.get('/api/users', auth, adminOnly, (_req, res) => {
  const users = stmts.getAllUsers.all().map((u) => ({ ...u, is_online: Boolean(u.is_online) }));
  return res.json({ users });
});

app.get('/api/admin/activity', auth, adminOnly, (_req, res) => {
  const users = stmts.getAllUsers.all().map((u) => ({
    id: u.id, username: u.username, name: u.name,
    avatar: u.avatar, color: u.color, role: u.role,
    is_online: Boolean(u.is_online),
    last_login: u.last_login, last_seen: u.last_seen,
  }));
  return res.json({ users });
});

app.get('/api/feedbacks', auth, adminOnly, (_req, res) =>
  res.json({ feedbacks: stmts.getAllFeedbacks.all() })
);

app.get('/api/logs', auth, adminOnly, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 200, 500);
  return res.json({ logs: stmts.getLogs.all(limit) });
});

app.patch('/api/reset-password', auth, adminOnly, async (req, res) => {
  const { username, newPassword } = req.body || {};
  if (!username || !newPassword)
    return res.status(400).json({ error: 'username e newPassword são obrigatórios.' });
  if (typeof newPassword !== 'string' || newPassword.length < 3)
    return res.status(400).json({ error: 'Mínimo 3 caracteres.' });

  const user = stmts.findByUsername.get(username.trim().toLowerCase());
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  db.prepare('UPDATE users SET password=? WHERE id=?').run(hash, user.id);
  logDB('warn', `Reset de senha por admin para: ${username}`, 'admin', req.user.id);
  return res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════
//  ERROR HANDLERS
// ════════════════════════════════════════════════════════════

app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERRO INTERNO]', err.message || err);
  logDB('error', err.message || 'Erro interno', 'system');
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor.' });
});

// ════════════════════════════════════════════════════════════
//  START
// ════════════════════════════════════════════════════════════

initDB();
prepareStatements();

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 LifeFlow Backend v7');
  console.log(`   http://localhost:${PORT}`);
  console.log(`   DB: ${DB_PATH}`);
  console.log('');
  console.log('📋 Endpoints:');
  [
    'POST   /api/login',
    'POST   /api/logout',
    'GET    /api/me',
    'PATCH  /api/heartbeat',
    'GET    /api/data',
    'POST   /api/data',
    'PATCH  /api/user/profile',
    'PATCH  /api/change-password',
    'POST   /api/feedback',
    'GET    /api/users           (admin)',
    'GET    /api/admin/activity  (admin)',
    'GET    /api/feedbacks       (admin)',
    'GET    /api/logs            (admin)',
    'PATCH  /api/reset-password  (admin)',
  ].forEach((r) => console.log(`   ${r}`));
  console.log('');
  console.log('👤 Usuários:  tallis/0724 (admin)  yasmin/1234  pedro/123');
  console.log('');
});
