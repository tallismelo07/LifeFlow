// ============================================================
//  server.js — LifeFlow Backend v8
//  Node.js + Express + JWT + bcryptjs + SQLite + PDFKit
// ============================================================

const express    = require('express');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const cors       = require('cors');
const path       = require('path');
const Database   = require('better-sqlite3');
const PDFDocument = require('pdfkit');

// ── Configurações ─────────────────────────────────────────────

const PORT        = process.env.PORT || 3001;
const JWT_SECRET  = process.env.JWT_SECRET || 'lifeflow-secret-2024-mude-em-producao';
const JWT_EXPIRY  = '7d';
const SALT_ROUNDS = 10;
const DB_PATH     = process.env.DB_PATH || path.join(__dirname, 'lifeflow.db');

const SEED_USERS = [
  { username: 'tallis', password: '0724', role: 'admin', name: 'Tallis', avatar: 'T', color: '#5B8DEF' },
  { username: 'yasmin', password: '1234', role: 'user',  name: 'Yasmin', avatar: 'Y', color: '#F0556A' },
  { username: 'pedro',  password: '123',  role: 'user',  name: 'Pedro',  avatar: 'P', color: '#2DD4BF' },
];

// ── Rate limiting ─────────────────────────────────────────────

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
  for (const [k, v] of loginAttempts) if (now > v.resetAt) loginAttempts.delete(k);
}, 30 * 60 * 1000);

// ── Banco de dados ────────────────────────────────────────────

const db = new Database(DB_PATH);

db.pragma('journal_mode  = WAL');
db.pragma('synchronous   = NORMAL');
db.pragma('foreign_keys  = ON');
db.pragma('cache_size    = -32000');   // 32 MB cache
db.pragma('temp_store    = MEMORY');
db.pragma('mmap_size     = 268435456'); // 256 MB mmap
db.pragma('wal_autocheckpoint = 1000');

// ── Helpers ───────────────────────────────────────────────────

const nowISO = () => new Date().toISOString();

// ── Logger no banco ───────────────────────────────────────────

let _logStmt = null;
function logDB(level, message, source = 'system', userId = null) {
  try {
    if (!_logStmt) {
      _logStmt = db.prepare(
        'INSERT INTO logs (level, message, source, user_id, created_at) VALUES (?, ?, ?, ?, ?)'
      );
    }
    const msg = String(message).slice(0, 1000);
    _logStmt.run(level, msg, source, userId || null, nowISO());
    console.log(`[${level.toUpperCase()}] [${source}] ${msg}`);
  } catch { /* nunca falha */ }
}

// ── Init banco ────────────────────────────────────────────────

function initDB() {
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

  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_checkins (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL,
      date          TEXT    NOT NULL,
      produtividade INTEGER NOT NULL DEFAULT 0,
      dia_bom       INTEGER NOT NULL DEFAULT 0,
      dormiu_bem    INTEGER NOT NULL DEFAULT 0,
      promessas     INTEGER NOT NULL DEFAULT 0,
      diario        TEXT    NOT NULL DEFAULT '',
      created_at    TEXT    NOT NULL DEFAULT '',
      UNIQUE(user_id, date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Índices
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_data_user_id  ON user_data (user_id);
    CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id  ON feedbacks (user_id);
    CREATE INDEX IF NOT EXISTS idx_feedbacks_created  ON feedbacks (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_logs_created       ON logs (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_logs_user_id       ON logs (user_id);
    CREATE INDEX IF NOT EXISTS idx_logs_level         ON logs (level);
    CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON daily_checkins (user_id, date DESC);
  `);

  // Migrações
  const userCols     = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  const userDataCols = db.prepare('PRAGMA table_info(user_data)').all().map((c) => c.name);

  if (!userCols.includes('email'))
    db.exec("ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT ''");
  if (!userDataCols.includes('cards'))
    db.exec("ALTER TABLE user_data ADD COLUMN cards TEXT NOT NULL DEFAULT '[]'");
  if (!userDataCols.includes('notes'))
    db.exec("ALTER TABLE user_data ADD COLUMN notes TEXT NOT NULL DEFAULT '[]'");

  // Seed
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

// ── Prepared statements ───────────────────────────────────────

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
    FROM feedbacks f JOIN users u ON u.id = f.user_id
    ORDER BY f.created_at DESC LIMIT 500
  `);
  stmts.getLogs = db.prepare(`
    SELECT l.id, l.level, l.message, l.source, l.created_at, u.username
    FROM logs l LEFT JOIN users u ON u.id = l.user_id
    ORDER BY l.created_at DESC LIMIT ?
  `);
}

// ── JSON helpers ──────────────────────────────────────────────

function safeJSON(str, fallback) {
  if (!str) return fallback;
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch { return fallback; }
}

// ── DATA_FIELDS: mapeamento frontend ↔ coluna SQL ─────────────
const FIELD_MAP = [
  { front: 'tasks',        col: 'tasks'        },
  { front: 'habits',       col: 'habits'        },
  { front: 'agenda',       col: 'agenda'        },
  { front: 'notes',        col: 'notes'         },
  { front: 'goals',        col: 'goals'         },
  { front: 'studyItems',   col: 'study_items'   },
  { front: 'transactions', col: 'transactions'  },
  { front: 'cards',        col: 'cards'         },
];

function parseUserData(row) {
  if (!row) {
    return {
      tasks: [], habits: [], agenda: [], notes: [],
      goals: [], studyItems: [], transactions: [], cards: [],
      updated_at: null,
    };
  }
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

function countItems(data) {
  return FIELD_MAP.reduce((n, { front }) => n + ((data[front] || []).length), 0);
}

// ── Merge inteligente por campo ───────────────────────────────
//
// Regra por campo:
//   - incoming[f] undefined       → manter current[f] (campo não enviado)
//   - incoming[f] vazio + current >= FIELD_WIPE_THRESHOLD → manter current (proteção)
//   - caso contrário              → usar incoming[f] (dado legítimo do usuário)
//
// Isso protege contra: race condition de boot, campos zerados por engano.
// NÃO bloqueia: usuário que realmente apagou todos os itens de uma seção.

const FIELD_WIPE_THRESHOLD = 3; // protege campos com >= 3 itens

function mergeData(incoming, current) {
  const merged = {};
  const report = [];

  for (const { front } of FIELD_MAP) {
    const inc = incoming[front];
    const cur = current[front] || [];

    if (inc === undefined || inc === null) {
      // Campo não enviado → manter atual
      merged[front] = cur;
      continue;
    }

    if (!Array.isArray(inc)) {
      // Valor corrompido → manter atual e logar
      merged[front] = cur;
      report.push(`${front}: valor inválido, mantendo ${cur.length} itens`);
      continue;
    }

    if (inc.length === 0 && cur.length >= FIELD_WIPE_THRESHOLD) {
      // Campo vazio suspeito → manter atual
      merged[front] = cur;
      report.push(`${front}: recebeu [] com ${cur.length} itens no banco — mantendo atual`);
      continue;
    }

    // Dado legítimo
    merged[front] = inc;
    if (inc.length !== cur.length) {
      report.push(`${front}: ${cur.length} → ${inc.length}`);
    }
  }

  return { merged, report };
}

function safeUser(u) {
  const { password: _, ...safe } = u;
  safe.is_online = Boolean(safe.is_online);
  return safe;
}

// ── Middlewares ───────────────────────────────────────────────

function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token não enviado.' });
  try {
    req.user = jwt.verify(h.split(' ')[1], JWT_SECRET);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Sessão expirada. Faça login novamente.'
      : 'Token inválido.';
    return res.status(401).json({ error: msg });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Acesso negado.' });
  next();
}

// ── Express ───────────────────────────────────────────────────

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

// ══════════════════════════════════════════════════════════════
//  ROTAS PÚBLICAS
// ══════════════════════════════════════════════════════════════

app.get('/', (_req, res) =>
  res.json({ name: 'LifeFlow API', status: 'ok', version: '8.0.0' })
);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', time: nowISO(), db: DB_PATH, version: '8.0.0' })
);

// ── Login ─────────────────────────────────────────────────────
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
    logDB('warn', `Rate limit: ${key}`, 'auth');
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
  return res.json({
    token: jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY }),
    user: payload,
  });
});

// ══════════════════════════════════════════════════════════════
//  ROTAS AUTENTICADAS
// ══════════════════════════════════════════════════════════════

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
// Sempre lê do banco, nunca de cache.
app.get('/api/data', auth, (req, res) => {
  const row  = stmts.getUserData.get(req.user.id);
  const data = parseUserData(row);
  const total = countItems(data);

  logDB('info', `GET /api/data user=${req.user.username} total=${total}`, 'data', req.user.id);

  // Cache-control: sem cache — dados devem vir sempre do servidor
  res.set('Cache-Control', 'no-store');
  return res.json({ data });
});

// ── POST /api/data ────────────────────────────────────────────
// Merge inteligente por campo — nunca substitui tudo de uma vez.
app.post('/api/data', auth, (req, res) => {
  const incoming = req.body?.data;

  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    logDB('warn', `POST /api/data: payload inválido`, 'data', req.user.id);
    return res.status(400).json({ error: 'Campo "data" é obrigatório e deve ser objeto.' });
  }

  // Busca estado atual do banco (fonte de verdade)
  const existingRow  = stmts.getUserData.get(req.user.id);
  const currentData  = parseUserData(existingRow);
  const currentTotal = countItems(currentData);
  const incomingTotal = countItems(incoming);

  // Proteção total: 0 itens chegando vs banco com dados substanciais
  if (incomingTotal === 0 && currentTotal >= 5) {
    logDB('warn',
      `Anti-wipe total: recebeu 0 itens, banco tem ${currentTotal}. user=${req.user.username}`,
      'data', req.user.id
    );
    return res.json({ ok: true, protected: true, reason: 'anti-wipe-total' });
  }

  // Merge inteligente por campo
  const { merged, report } = mergeData(incoming, currentData);

  if (report.length > 0) {
    logDB('info',
      `Merge fields [${req.user.username}]: ${report.join(' | ')}`,
      'data', req.user.id
    );
  }

  // Sanitiza: garante que todos os campos são arrays sem nulos internos
  function sanitizeArr(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.filter((item) => item !== null && item !== undefined && typeof item === 'object');
  }

  const toSave = {
    user_id:      req.user.id,
    tasks:        JSON.stringify(sanitizeArr(merged.tasks)),
    habits:       JSON.stringify(sanitizeArr(merged.habits)),
    agenda:       JSON.stringify(sanitizeArr(merged.agenda)),
    notes:        JSON.stringify(sanitizeArr(merged.notes)),
    goals:        JSON.stringify(sanitizeArr(merged.goals)),
    study_items:  JSON.stringify(sanitizeArr(merged.studyItems)),
    transactions: JSON.stringify(sanitizeArr(merged.transactions)),
    cards:        JSON.stringify(sanitizeArr(merged.cards)),
    updated_at:   nowISO(),
  };

  stmts.upsertData.run(toSave);

  const savedTotal = countItems(merged);
  logDB('info',
    `POST /api/data ✓ user=${req.user.username} total=${savedTotal} (era ${currentTotal})`,
    'data', req.user.id
  );

  return res.json({ ok: true, total: savedTotal });
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
// Endpoint principal e único para troca de senha.
app.patch('/api/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
  }
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'Formato inválido.' });
  }
  if (newPassword.length < 3) {
    return res.status(400).json({ error: 'Nova senha deve ter pelo menos 3 caracteres.' });
  }
  if (newPassword.length > 128) {
    return res.status(400).json({ error: 'Nova senha muito longa.' });
  }

  // Busca usuário diretamente do banco (não confia no token para dados sensíveis)
  const user = stmts.findById.get(req.user.id);
  if (!user) {
    logDB('error', `change-password: usuário ${req.user.id} não encontrado`, 'auth', req.user.id);
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Valida senha atual
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    logDB('warn', `change-password falhou (senha errada): ${user.username}`, 'auth', user.id);
    return res.status(401).json({ error: 'Senha atual incorreta.' });
  }

  // Verifica que a nova senha é diferente da atual
  const samePwd = await bcrypt.compare(newPassword, user.password);
  if (samePwd) {
    return res.status(400).json({ error: 'A nova senha deve ser diferente da atual.' });
  }

  // Hash e salva
  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  db.prepare('UPDATE users SET password=? WHERE id=?').run(hash, user.id);

  logDB('info', `Senha alterada com sucesso: ${user.username}`, 'auth', user.id);
  return res.json({ ok: true, message: 'Senha alterada com sucesso.' });
});

// Alias POST (compatibilidade)
app.post('/api/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
  if (typeof newPassword !== 'string' || newPassword.length < 3)
    return res.status(400).json({ error: 'Mínimo 3 caracteres.' });

  const user  = stmts.findById.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(401).json({ error: 'Senha atual incorreta.' });

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  db.prepare('UPDATE users SET password=? WHERE id=?').run(hash, user.id);
  logDB('info', `Senha alterada (POST alias): ${user.username}`, 'auth', user.id);
  return res.json({ ok: true });
});

// ── POST /api/feedback ────────────────────────────────────────
app.post('/api/feedback', auth, (req, res) => {
  const { message } = req.body || {};
  if (!message || typeof message !== 'string' || message.trim().length < 3)
    return res.status(400).json({ error: 'Mensagem inválida (mínimo 3 caracteres).' });
  if (message.length > 2000)
    return res.status(400).json({ error: 'Mensagem muito longa.' });

  stmts.insertFeedback.run(req.user.id, message.trim(), nowISO());
  logDB('info', `Feedback de ${req.user.username}`, 'feedback', req.user.id);
  return res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════
//  RELATÓRIO FINANCEIRO EM PDF
// ══════════════════════════════════════════════════════════════

app.get('/api/finance/report', auth, (req, res) => {
  try {
    // Busca dados do usuário
    const userRow = stmts.findById.get(req.user.id);
    const dataRow = stmts.getUserData.get(req.user.id);
    const data    = parseUserData(dataRow);

    const transactions = data.transactions || [];
    const userName     = userRow?.name || req.user.username;
    const reportDate   = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    // Totais
    const totalIn  = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const totalOut = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    const balance  = totalIn - totalOut;

    const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

    const CATEGORY_LABELS = {
      alimentacao: 'Alimentação', assinatura: 'Assinatura', curso: 'Curso',
      salario: 'Salário', freelancer: 'Freelancer', saude: 'Saúde',
      transporte: 'Transporte', moradia: 'Moradia', lazer: 'Lazer', outro: 'Outro',
    };
    const BANK_LABELS = {
      nubank: 'Nubank', itau: 'Itaú', inter: 'Inter',
      bradesco: 'Bradesco', caixa: 'Caixa', outro: 'Outro',
    };

    const catLabel  = (v) => CATEGORY_LABELS[v] || v || 'Outro';
    const bankLabel = (v) => BANK_LABELS[v] || v || 'Outro';
    const txDate    = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-';

    // ── Gera o PDF ──────────────────────────────────────────────

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title:    'LifeFlow — Relatório Financeiro',
        Author:   'LifeFlow',
        Subject:  `Relatório de ${userName}`,
        Creator:  'LifeFlow Backend v8',
      },
    });

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="lifeflow-relatorio.pdf"`,
      'Cache-Control':       'no-store',
    });

    doc.pipe(res);

    const W    = 595 - 100; // largura útil (A4 = 595 - margens)
    const DARK = '#111111';
    const LITE = '#888888';
    const GRN  = '#1e7e4e';
    const RED  = '#b91c1c';
    const LINE = '#e0e0e0';

    // ── CABEÇALHO ─────────────────────────────────────────────
    doc.rect(50, 50, W, 70).fill('#111111');

    doc.fontSize(22).font('Helvetica-Bold').fillColor('#ffffff')
      .text('LifeFlow', 68, 65);
    doc.fontSize(10).font('Helvetica').fillColor('#aaaaaa')
      .text('Relatório Financeiro', 68, 92);

    doc.fontSize(9).fillColor('#cccccc')
      .text(`${userName}  ·  ${reportDate}`, 68, 108, { align: 'left' });

    // Total de transações no canto direito do header
    doc.fontSize(9).fillColor('#888888')
      .text(`${transactions.length} transações`, 50, 108, { width: W, align: 'right' });

    // ── CARDS DE RESUMO ───────────────────────────────────────
    const cardY = 140;
    const cardW = (W - 20) / 3;
    const cards = [
      { label: 'Total Entradas', value: fmt(totalIn),  color: GRN  },
      { label: 'Total Saídas',   value: fmt(totalOut), color: RED  },
      { label: 'Saldo Final',    value: fmt(balance),  color: balance >= 0 ? GRN : RED },
    ];

    cards.forEach((card, i) => {
      const x = 50 + i * (cardW + 10);
      doc.rect(x, cardY, cardW, 58).stroke(LINE).fillAndStroke('#fafafa', LINE);
      doc.fontSize(8).font('Helvetica').fillColor(LITE)
        .text(card.label.toUpperCase(), x + 12, cardY + 10, { width: cardW - 24 });
      doc.fontSize(14).font('Helvetica-Bold').fillColor(card.color)
        .text(card.value, x + 12, cardY + 26, { width: cardW - 24 });
    });

    // ── TABELA DE TRANSAÇÕES ──────────────────────────────────
    let y = cardY + 80;

    // Título da seção
    doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK)
      .text('Transações', 50, y);
    y += 18;

    // Header da tabela
    const cols = [
      { label: 'Data',      x: 50,  w: 60  },
      { label: 'Descrição', x: 115, w: 155 },
      { label: 'Categoria', x: 275, w: 85  },
      { label: 'Banco',     x: 365, w: 65  },
      { label: 'Tipo',      x: 435, w: 50  },
      { label: 'Valor',     x: 490, w: 60  },
    ];

    // Fundo do header
    doc.rect(50, y, W, 18).fill('#222222');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
    cols.forEach((c) => doc.text(c.label, c.x + 4, y + 5, { width: c.w }));
    y += 18;

    // Linhas de transações
    const sorted = [...transactions].sort((a, b) =>
      new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0)
    );

    if (sorted.length === 0) {
      doc.rect(50, y, W, 28).fill('#f9f9f9');
      doc.fontSize(9).font('Helvetica').fillColor(LITE)
        .text('Nenhuma transação registrada.', 50, y + 9, { width: W, align: 'center' });
      y += 28;
    }

    sorted.forEach((tx, i) => {
      // Verifica se precisa de nova página
      if (y > 730) {
        doc.addPage();
        y = 50;
        // Re-imprime header da tabela na nova página
        doc.rect(50, y, W, 18).fill('#222222');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
        cols.forEach((c) => doc.text(c.label, c.x + 4, y + 5, { width: c.w }));
        y += 18;
      }

      const rowH     = 20;
      const rowColor = i % 2 === 0 ? '#ffffff' : '#f7f7f7';
      doc.rect(50, y, W, rowH).fill(rowColor);

      // Linha separadora
      doc.moveTo(50, y + rowH).lineTo(50 + W, y + rowH).stroke(LINE);

      const isIncome = tx.type === 'income';
      const amount   = tx.amount || 0;
      const sign     = isIncome ? '+' : '-';

      doc.fontSize(8).font('Helvetica').fillColor(DARK);

      doc.text(txDate(tx.date),                   cols[0].x + 4, y + 6, { width: cols[0].w - 4 });
      doc.text(tx.title || tx.description || '-', cols[1].x + 4, y + 6, { width: cols[1].w - 4 });
      doc.text(catLabel(tx.category),             cols[2].x + 4, y + 6, { width: cols[2].w - 4 });
      doc.text(bankLabel(tx.bank),                cols[3].x + 4, y + 6, { width: cols[3].w - 4 });

      // Tipo colorido
      doc.fillColor(isIncome ? GRN : RED)
        .text(isIncome ? 'Entrada' : 'Saída',    cols[4].x + 4, y + 6, { width: cols[4].w - 4 });

      // Valor alinhado à direita
      doc.fillColor(isIncome ? GRN : RED).font('Helvetica-Bold')
        .text(`${sign}${fmt(amount)}`,            cols[5].x + 4, y + 6, { width: cols[5].w - 4, align: 'right' });

      y += rowH;
    });

    // ── BREAKDOWN POR CATEGORIA ───────────────────────────────
    if (transactions.length > 0) {
      y += 20;
      if (y > 650) { doc.addPage(); y = 50; }

      doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK)
        .text('Gastos por Categoria', 50, y);
      y += 16;

      const byCat = {};
      for (const tx of transactions.filter((t) => t.type === 'expense')) {
        const k = catLabel(tx.category || 'outro');
        byCat[k] = (byCat[k] || 0) + (tx.amount || 0);
      }
      const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

      if (catEntries.length === 0) {
        doc.fontSize(9).font('Helvetica').fillColor(LITE).text('Sem despesas registradas.', 50, y);
        y += 16;
      } else {
        catEntries.forEach(([cat, total], i) => {
          if (y > 730) { doc.addPage(); y = 50; }
          const rowH     = 18;
          const rowColor = i % 2 === 0 ? '#ffffff' : '#f7f7f7';
          doc.rect(50, y, W, rowH).fill(rowColor);
          doc.fontSize(8).font('Helvetica').fillColor(DARK)
            .text(cat, 54, y + 5, { width: 180 });
          doc.font('Helvetica-Bold').fillColor(RED)
            .text(fmt(total), 54, y + 5, { width: W - 8, align: 'right' });
          doc.moveTo(50, y + rowH).lineTo(50 + W, y + rowH).stroke(LINE);
          y += rowH;
        });
      }
    }

    // ── RODAPÉ ────────────────────────────────────────────────
    const pageCount = doc.bufferedPageRange();
    for (let i = 0; i < (pageCount ? pageCount.count : 1); i++) {
      doc.switchToPage(i);
      doc.fontSize(7).font('Helvetica').fillColor('#aaaaaa')
        .text(
          `LifeFlow · Relatório gerado em ${reportDate} · Confidencial`,
          50, 820, { width: W, align: 'center' }
        );
    }

    doc.end();

    logDB('info', `Relatório PDF gerado: user=${req.user.username} txs=${transactions.length}`, 'report', req.user.id);

  } catch (err) {
    logDB('error', `Erro ao gerar PDF: ${err.message}`, 'report', req.user.id);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro ao gerar relatório.' });
    }
  }
});

// ══════════════════════════════════════════════════════════════
//  CHECK-IN DIÁRIO
// ══════════════════════════════════════════════════════════════

// GET /api/checkins — retorna todos os check-ins do usuário
app.get('/api/checkins', auth, (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM daily_checkins WHERE user_id = ? ORDER BY date DESC'
  ).all(req.user.id);

  const checkins = rows.map((c) => ({
    id:            c.id,
    date:          c.date,
    produtividade: Boolean(c.produtividade),
    dia_bom:       Boolean(c.dia_bom),
    dormiu_bem:    Boolean(c.dormiu_bem),
    promessas:     Boolean(c.promessas),
    diario:        c.diario || '',
    created_at:    c.created_at,
  }));

  return res.set('Cache-Control', 'no-store').json({ checkins });
});

// POST /api/checkins — cria ou atualiza check-in do dia (upsert)
app.post('/api/checkins', auth, (req, res) => {
  const { date, produtividade, dia_bom, dormiu_bem, promessas, diario } = req.body || {};

  if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: 'data inválida (formato YYYY-MM-DD).' });

  db.prepare(`
    INSERT INTO daily_checkins
      (user_id, date, produtividade, dia_bom, dormiu_bem, promessas, diario, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      produtividade = excluded.produtividade,
      dia_bom       = excluded.dia_bom,
      dormiu_bem    = excluded.dormiu_bem,
      promessas     = excluded.promessas,
      diario        = excluded.diario
  `).run(
    req.user.id,
    date,
    produtividade ? 1 : 0,
    dia_bom       ? 1 : 0,
    dormiu_bem    ? 1 : 0,
    promessas     ? 1 : 0,
    typeof diario === 'string' ? diario.slice(0, 5000) : '',
    nowISO()
  );

  logDB('info', `Check-in ${date}: user=${req.user.username}`, 'checkin', req.user.id);
  return res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════
//  ROTAS ADMIN
// ══════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════
//  ERROR HANDLERS
// ══════════════════════════════════════════════════════════════

app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const msg = err.message || 'Erro interno';
  console.error('[ERRO INTERNO]', msg);
  logDB('error', msg.slice(0, 500), 'system');
  if (!res.headersSent)
    res.status(err.status || 500).json({ error: 'Erro interno do servidor.' });
});

// ══════════════════════════════════════════════════════════════
//  START
// ══════════════════════════════════════════════════════════════

initDB();
prepareStatements();

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 LifeFlow Backend v8');
  console.log(`   http://localhost:${PORT}`);
  console.log(`   DB: ${DB_PATH}`);
  console.log('');
  console.log('📋 Endpoints:');
  [
    'POST   /api/login',
    'POST   /api/logout',
    'GET    /api/me',
    'PATCH  /api/heartbeat',
    'GET    /api/data               ← sempre do banco, sem cache',
    'POST   /api/data               ← merge inteligente por campo',
    'PATCH  /api/user/profile',
    'PATCH  /api/change-password    ← bcrypt, validação completa',
    'POST   /api/feedback',
    'GET    /api/finance/report     ← PDF download',
    'GET    /api/users              (admin)',
    'GET    /api/admin/activity     (admin)',
    'GET    /api/feedbacks          (admin)',
    'GET    /api/logs               (admin)',
    'PATCH  /api/reset-password     (admin)',
  ].forEach((r) => console.log(`   ${r}`));
  console.log('');
  console.log('👤 tallis/0724 (admin)  yasmin/1234  pedro/123');
  console.log('');
});
