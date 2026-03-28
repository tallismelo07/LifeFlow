// // ============================================================
// //  server.js — LifeFlow Backend
// //  Node.js + Express + JWT + bcrypt + JSON como banco
// //  Porta: 3001
// // ============================================================

// const express = require('express');
// const bcrypt  = require('bcrypt');
// const jwt     = require('jsonwebtoken');
// const cors    = require('cors');
// const fs      = require('fs');
// const path    = require('path');

// // ── Configurações ────────────────────────────────────────────────────────────

// const PORT       = 3001;
// const JWT_SECRET = 'lifeflow-secret-2024-mude-em-producao';
// const JWT_EXPIRY = '7d';
// const DB_FILE    = path.join(__dirname, 'db.json');
// const SALT_ROUNDS = 10;

// // Usuários iniciais que são criados se o banco estiver vazio
// const SEED_USERS = [
//   { username: 'tallis', password: '0724', role: 'admin', name: 'Tallis', avatar: 'T', color: '#5B8DEF' },
//   { username: 'yasmin', password: '1234', role: 'user',  name: 'Yasmin', avatar: 'Y', color: '#F0556A' },
//   { username: 'pedro',  password: '123',  role: 'user',  name: 'Pedro',  avatar: 'P', color: '#2DD4BF' },
// ];

// // ── Banco de dados (JSON simples) ────────────────────────────────────────────

// // Lê o banco do disco
// function readDB() {
//   try {
//     const raw = fs.readFileSync(DB_FILE, 'utf8');
//     return JSON.parse(raw);
//   } catch {
//     return { users: [], data: {} };
//   }
// }

// // Salva o banco no disco
// function writeDB(db) {
//   fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
// }

// // ── Inicialização do banco ────────────────────────────────────────────────────

// async function initDB() {
//   let db = readDB();

//   // Cria estrutura inicial se o arquivo não existir
//   if (!db.users) db.users = [];
//   if (!db.data)  db.data  = {};

//   // Cria usuários iniciais se não existirem
//   for (const seed of SEED_USERS) {
//     const exists = db.users.find(u => u.username === seed.username);
//     if (!exists) {
//       const hashed = await bcrypt.hash(seed.password, SALT_ROUNDS);
//       const newUser = {
//         id:          db.users.length + 1,
//         username:    seed.username,
//         password:    hashed,
//         role:        seed.role,
//         name:        seed.name,
//         avatar:      seed.avatar,
//         color:       seed.color,
//         last_login:  null,
//         is_online:   false,
//       };
//       db.users.push(newUser);
//       // Dados iniciais vazios por usuário
//       db.data[seed.username] = {
//         tasks: [], habits: [], transactions: [],
//         studyItems: [], notes: [], goals: [], agenda: [],
//       };
//       console.log(`✓ Usuário criado: ${seed.username}`);
//     }
//   }

//   writeDB(db);
//   console.log('✓ Banco de dados pronto:', DB_FILE);
// }

// // ── Middleware auth ───────────────────────────────────────────────────────────

// function authMiddleware(req, res, next) {
//   const header = req.headers.authorization;
//   if (!header || !header.startsWith('Bearer ')) {
//     return res.status(401).json({ error: 'Token não enviado.' });
//   }
//   const token = header.slice(7);
//   try {
//     const payload = jwt.verify(token, JWT_SECRET);
//     req.user = payload; // { id, username, role, name, avatar, color }
//     next();
//   } catch {
//     return res.status(401).json({ error: 'Token inválido ou expirado.' });
//   }
// }

// // Middleware só para admin
// function adminMiddleware(req, res, next) {
//   if (req.user?.role !== 'admin') {
//     return res.status(403).json({ error: 'Acesso negado.' });
//   }
//   next();
// }

// // ── App Express ───────────────────────────────────────────────────────────────

// const app = express();

// app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
// app.use(express.json());

// // Loga toda request (simples)
// app.use((req, _res, next) => {
//   console.log(`${new Date().toLocaleTimeString()} ${req.method} ${req.path}`);
//   next();
// });

// // ── ROTAS ────────────────────────────────────────────────────────────────────

// // ── POST /api/login — faz login e retorna token ──────────────────────────────
// app.post('/api/login', async (req, res) => {
//   const { username, password } = req.body;

//   if (!username || !password) {
//     return res.status(400).json({ error: 'Usuário e senha obrigatórios.' });
//   }

//   const db   = readDB();
//   const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());

//   if (!user) {
//     return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
//   }

//   const valid = await bcrypt.compare(password, user.password);
//   if (!valid) {
//     return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
//   }

//   // Atualiza last_login e is_online
//   user.last_login = new Date().toISOString();
//   user.is_online  = true;
//   writeDB(db);

//   // Gera token
//   const payload = {
//     id:       user.id,
//     username: user.username,
//     role:     user.role,
//     name:     user.name,
//     avatar:   user.avatar,
//     color:    user.color,
//   };
//   const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

//   return res.json({
//     token,
//     user: payload,
//     message: 'Login realizado com sucesso.',
//   });
// });

// // ── POST /api/logout — marca usuário como offline ────────────────────────────
// app.post('/api/logout', authMiddleware, (req, res) => {
//   const db   = readDB();
//   const user = db.users.find(u => u.username === req.user.username);
//   if (user) {
//     user.is_online = false;
//     writeDB(db);
//   }
//   return res.json({ message: 'Logout realizado.' });
// });

// // ── GET /api/me — retorna dados do usuário pelo token ───────────────────────
// app.get('/api/me', authMiddleware, (req, res) => {
//   // Busca dados atualizados do banco (not just token payload)
//   const db   = readDB();
//   const user = db.users.find(u => u.username === req.user.username);
//   if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

//   const { password: _, ...safeUser } = user; // remove senha
//   return res.json({ user: safeUser });
// });

// // ── PATCH /api/heartbeat — mantém usuário online ────────────────────────────
// app.patch('/api/heartbeat', authMiddleware, (req, res) => {
//   const db   = readDB();
//   const user = db.users.find(u => u.username === req.user.username);
//   if (user) {
//     user.is_online  = true;
//     user.last_login = new Date().toISOString();
//     writeDB(db);
//   }
//   return res.json({ ok: true });
// });

// // ── GET /api/users — lista usuários (admin only) ────────────────────────────
// app.get('/api/users', authMiddleware, adminMiddleware, (req, res) => {
//   const db = readDB();
//   const users = db.users.map(({ password: _, ...u }) => u); // remove senhas
//   return res.json({ users });
// });

// // ── GET /api/data — retorna dados do usuário logado ──────────────────────────
// app.get('/api/data', authMiddleware, (req, res) => {
//   const db       = readDB();
//   const username = req.user.username;
//   const userData = db.data[username] || {
//     tasks: [], habits: [], transactions: [],
//     studyItems: [], notes: [], goals: [], agenda: [],
//   };
//   return res.json({ data: userData });
// });

// // ── POST /api/data — salva dados do usuário logado ───────────────────────────
// app.post('/api/data', authMiddleware, (req, res) => {
//   const db       = readDB();
//   const username = req.user.username;
//   const newData  = req.body.data;

//   if (!newData || typeof newData !== 'object') {
//     return res.status(400).json({ error: 'Dados inválidos.' });
//   }

//   db.data[username] = newData;
//   writeDB(db);

//   return res.json({ ok: true, message: 'Dados salvos com sucesso.' });
// });

// // ── Rota de health check ─────────────────────────────────────────────────────
// app.get('/api/health', (_req, res) => {
//   res.json({ status: 'ok', time: new Date().toISOString() });
// });

// // ── Rota não encontrada ───────────────────────────────────────────────────────
// app.use((_req, res) => {
//   res.status(404).json({ error: 'Rota não encontrada.' });
// });

// // ── Start ─────────────────────────────────────────────────────────────────────

// initDB().then(() => {
//   app.listen(PORT, () => {
//     console.log('');
//     console.log('🚀 LifeFlow Backend rodando!');
//     console.log(`   URL:  http://localhost:${PORT}`);
//     console.log('');
//     console.log('📋 Endpoints:');
//     console.log('   POST  /api/login');
//     console.log('   POST  /api/logout');
//     console.log('   GET   /api/me');
//     console.log('   PATCH /api/heartbeat');
//     console.log('   GET   /api/users  (admin)');
//     console.log('   GET   /api/data');
//     console.log('   POST  /api/data');
//     console.log('');
//     console.log('👤 Usuários iniciais:');
//     console.log('   tallis / 0724  (admin)');
//     console.log('   yasmin / 1234');
//     console.log('   pedro  / 123');
//     console.log('');
//   });
// });

// ============================================================
//  server.js — LifeFlow Backend (VERSÃO AJUSTADA)
// ============================================================

const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

// ── Configurações ────────────────────────────────────────────

const PORT       = process.env.PORT || 3001;
const JWT_SECRET = 'lifeflow-secret-2024-mude-em-producao';
const JWT_EXPIRY = '7d';
const DB_FILE    = path.join(__dirname, 'db.json');
const SALT_ROUNDS = 10;

const SEED_USERS = [
  { username: 'tallis', password: '0724', role: 'admin', name: 'Tallis', avatar: 'T', color: '#5B8DEF' },
  { username: 'yasmin', password: '1234', role: 'user',  name: 'Yasmin', avatar: 'Y', color: '#F0556A' },
  { username: 'pedro',  password: '123',  role: 'user',  name: 'Pedro',  avatar: 'P', color: '#2DD4BF' },
];

// ── DB helpers ───────────────────────────────────────────────

function readDB() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { users: [], data: {} };
  }
}

function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

// ── Init DB ──────────────────────────────────────────────────

async function initDB() {
  let db = readDB();

  if (!db.users) db.users = [];
  if (!db.data) db.data = {};

  for (const seed of SEED_USERS) {
    const exists = db.users.find(u => u.username === seed.username);

    if (!exists) {
      const hashed = await bcrypt.hash(seed.password, SALT_ROUNDS);

      const newUser = {
        id: db.users.length + 1,
        username: seed.username,
        password: hashed,
        role: seed.role,
        name: seed.name,
        avatar: seed.avatar,
        color: seed.color,
        last_login: null,
        is_online: false,
      };

      db.users.push(newUser);

      db.data[seed.username] = {
        tasks: [],
        habits: [],
        transactions: [],
        studyItems: [],
        notes: [],
        goals: [],
        agenda: [],
      };

      console.log(`✓ Usuário criado: ${seed.username}`);
    }
  }

  writeDB(db);
  console.log('✓ Banco pronto');
}

// ── Middlewares ──────────────────────────────────────────────

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não enviado' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  next();
}

// ── App ──────────────────────────────────────────────────────

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Teste rápido ─────────────────────────────────────────────

app.get('/', (req, res) => {
  res.send('🚀 LifeFlow Backend rodando!');
});

// ── Rotas ────────────────────────────────────────────────────

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const db = readDB();
  const user = db.users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  user.last_login = new Date().toISOString();
  user.is_online = true;
  writeDB(db);

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      avatar: user.avatar,
      color: user.color
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  res.json({ token, user });
});

// ── Logout ───────────────────────────────────────────────────

app.post('/api/logout', authMiddleware, (req, res) => {
  const db = readDB();

  const user = db.users.find(u => u.username === req.user.username);

  if (user) {
    user.is_online = false;
    writeDB(db);
  }

  res.json({ ok: true });
});

// ── User info ────────────────────────────────────────────────

app.get('/api/me', authMiddleware, (req, res) => {
  const db = readDB();

  const user = db.users.find(u => u.username === req.user.username);

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const { password, ...safeUser } = user;

  res.json({ user: safeUser });
});

// ── Dados ────────────────────────────────────────────────────

app.get('/api/data', authMiddleware, (req, res) => {
  const db = readDB();
  const userData = db.data[req.user.username] || {};
  res.json({ data: userData });
});

app.post('/api/data', authMiddleware, (req, res) => {
  const db = readDB();

  db.data[req.user.username] = req.body.data;

  writeDB(db);

  res.json({ ok: true });
});

// ── Health ───────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ── Start ────────────────────────────────────────────────────

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Rodando na porta ${PORT}`);
  });
});