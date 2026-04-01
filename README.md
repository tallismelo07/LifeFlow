# LifeFlow 🚀

Sistema de organização pessoal com autenticação JWT, animações Framer Motion e dark/light mode.

---

## Estrutura

```
lifeflow/
├── backend/            ← Node.js + Express + JWT
│   ├── server.js       ← Servidor único
│   ├── package.json
│   └── db.json         ← Criado automaticamente no 1º start
│
├── src/                ← React + Tailwind + Framer Motion
│   ├── context/
│   │   ├── AuthContext.jsx   ← Autenticação JWT
│   │   ├── AppContext.jsx    ← Dados do usuário
│   │   └── ThemeContext.jsx  ← Dark / Light mode
│   ├── components/
│   │   ├── auth/        ← LoginPage animada
│   │   ├── layout/      ← Header (tema toggle) + Sidebar animada
│   │   ├── dashboard/   ← Dashboard com stagger animations
│   │   ├── tasks/       ← Tarefas com sistema de status
│   │   ├── habits/      ← Hábitos + weekly grid
│   │   ├── agenda/      ← Calendário dia/semana
│   │   ├── finance/     ← Financeiro com gráficos SVG
│   │   ├── goals/       ← Metas com progresso
│   │   ├── study/       ← Rastreador de estudos
│   │   ├── notes/       ← Notas coloridas
│   │   ├── pomodoro/    ← Timer Pomodoro
│   │   ├── weekly/      ← Revisão semanal guiada
│   │   ├── admin/       ← Painel admin (Tallis)
│   │   └── ui/          ← Componentes animados reutilizáveis
│   └── services/        ← axios + authService
│
├── package.json         ← react + tailwind + framer-motion + axios
└── vite.config.js       ← proxy /api → 3001
```

---

## Como rodar

### 1. Backend
```bash
cd backend
npm install
node server.js
# Roda em http://localhost:3001
```

### 2. Frontend (outro terminal)
```bash
npm install
npm run dev
# Abre em http://localhost:5173
```


## Novidades v3.0

### 🎬 Framer Motion
- Login com entrada staggered (logo → card → campos)
- Transição de páginas suave (fade + slide)
- Cards com hover lift e entrada animada
- Sidebar com spring slide-in no mobile
- Botões com press feedback
- Progress bars com fill animado
- Empty states com ícone flutuante
- Modais com scale + fade

### 🌓 Dark / Light Mode
- Toggle no header (ícone sol/moon com animação)
- Salvo no localStorage (`lf_theme`)
- CSS variables para todos os componentes
- Overrides completos para compatibilidade Tailwind

### ✅ Status nas Tarefas
- 3 estados: **Não comecei** (cinza) · **Em andamento** (âmbar) · **Concluído** (verde)
- Seletor inline por ponto colorido (hover)
- Cards de filtro rápido por status
- Barra de progresso geral automática

## Design System v3 (Atual)

### Paleta de Cores
| Token | Dark | Light | Uso |
|-------|------|-------|-----|
| `--bg` | `#0f172a` | `#f1f5f9` | Background da página |
| `--bg-soft` | `#1e293b` | `#ffffff` | Cards |
| `--bg-muted` | `#243044` | `#e2e8f0` | Inputs, áreas sutis |
| `--text` | `#f1f5f9` | `#0f172a` | Texto principal |
| `--text-3` | `#94a3b8` | `#475569` | Texto secundário |
| `--blue` | `#3b82f6` | `#2563eb` | Ação principal, botões |
| `--green` | `#22c55e` | `#16a34a` | Sucesso, concluído |
| `--amber` | `#f59e0b` | `#d97706` | Alerta, atenção |
| `--red` | `#ef4444` | `#dc2626` | Erro, perigo |

### Status das Tarefas
- ⬜ **Não comecei** → cinza (bg-muted)
- 🔵 **Em andamento** → azul (--blue)
- 🟢 **Concluído** → verde (--green)

### Melhorias de UX
- Sombras reais nos cards (shadow-card, shadow-md)
- Nav ativa com fundo azul sólido (não transparente)
- Progress bars mais espessas (h-2.5)
- Hover com elevação (translateY -1px + shadow)
- Botão primário azul (não mais lime)
