// src/data/mockData.js
// Dados iniciais de conteúdo por usuário (tarefas, hábitos, agenda, etc.)
// Autenticação agora é gerenciada pelo backend — sem dados de usuário aqui

const now = () => new Date().toISOString();
const day = (offset = 0, h = 12, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const setDay = (dayNum) => {
  const d = new Date(); d.setDate(dayNum);
  return d.toISOString();
};

// ── Dados iniciais por userId (username como chave) ────────────────────────────
// Populados na primeira vez que o usuário faz login
export const INITIAL_DATA = {
  // Tallis (admin / dev)
  tallis: {
    tasks: [
      { id: 't1', title: 'Revisar PR #42',       description: 'Code review',          priority: 'high',   completed: false, createdAt: now(), dueDate: day(0) },
      { id: 't2', title: 'Estudar React Query',  description: 'Playlist YouTube',     priority: 'medium', completed: false, createdAt: now(), dueDate: null   },
      { id: 't3', title: 'Pagar conta internet', description: '',                      priority: 'high',   completed: true,  createdAt: now(), dueDate: null   },
    ],
    habits: [
      { id: 'th1', name: 'Treinar',       icon: '🏋️', color: '#C8F135', streak: 5,  completedDates: [] },
      { id: 'th2', name: 'Ler 30 min',    icon: '📚', color: '#5B8DEF', streak: 12, completedDates: [] },
      { id: 'th3', name: 'Meditar',       icon: '🧘', color: '#2DD4BF', streak: 3,  completedDates: [] },
    ],
    transactions: [
      { id: 'tf1', type: 'income',  title: 'Salário',       amount: 6500, category: 'Salário',     date: setDay(1),  notes: '' },
      { id: 'tf2', type: 'income',  title: 'Freelance API', amount: 1800, category: 'Freelance',   date: setDay(10), notes: '' },
      { id: 'tf3', type: 'expense', title: 'Aluguel',       amount: 1800, category: 'Moradia',     date: setDay(5),  notes: '' },
      { id: 'tf4', type: 'expense', title: 'Supermercado',  amount: 420,  category: 'Alimentação', date: setDay(8),  notes: '' },
    ],
    studyItems: [
      { id: 'ts1', title: 'React Avançado',    description: 'Hooks, Context', status: 'studying',  progress: 65,  tags: ['React'], notes: 'Estudando useCallback.', resources: 'react.dev',          createdAt: now(), updatedAt: now() },
      { id: 'ts2', title: 'Node.js + Express', description: 'APIs, JWT',      status: 'studying',  progress: 40,  tags: ['Node'],  notes: 'Implementei JWT.',       resources: '',                   createdAt: now(), updatedAt: now() },
      { id: 'ts3', title: 'TypeScript',        description: 'Tipagem',        status: 'completed', progress: 100, tags: ['TS'],    notes: 'Concluído!',             resources: 'typescriptlang.org', createdAt: now(), updatedAt: now() },
    ],
    notes: [
      { id: 'tn1', title: 'Ideias de projeto', content: '- Dashboard financeiro\n- App com IA\n- Chrome extension', color: '#5B8DEF', pinned: true,  createdAt: now(), updatedAt: now() },
    ],
    goals: [
      { id: 'tg1', title: 'Reserva de emergência', description: '6 meses de despesas', target: 15000, current: 6000, category: 'Financeiro', deadline: day(240), color: '#C8F135', createdAt: now() },
      { id: 'tg2', title: 'Notebook novo',          description: 'MacBook Pro M3',       target: 15000, current: 3200, category: 'Tecnologia', deadline: day(365), color: '#5B8DEF', createdAt: now() },
    ],
    agenda: [
      { id: 'ta1', title: 'Daily do time',       date: day(0, 9,  0),  endTime: '09:30', description: 'Reunião diária',        color: '#5B8DEF' },
      { id: 'ta2', title: 'Code review',         date: day(0, 14, 0),  endTime: '15:00', description: 'Revisar PRs pendentes', color: '#C8F135' },
      { id: 'ta3', title: 'Deploy produção',     date: day(1, 16, 0),  endTime: '17:00', description: 'Deploy v2.3.0',         color: '#F0556A' },
    ],
  },

  // Yasmin (user / design)
  yasmin: {
    tasks: [
      { id: 'y1', title: 'Criar apresentação', description: 'Slides para reunião', priority: 'high',   completed: false, createdAt: now(), dueDate: day(2) },
      { id: 'y2', title: 'Comprar presentes',  description: 'Lista aniversário',   priority: 'medium', completed: false, createdAt: now(), dueDate: null   },
      { id: 'y3', title: 'Agendar consulta',   description: '',                    priority: 'high',   completed: true,  createdAt: now(), dueDate: null   },
    ],
    habits: [
      { id: 'yh1', name: 'Yoga',     icon: '🧘', color: '#F0556A', streak: 7,  completedDates: [] },
      { id: 'yh2', name: 'Ler',      icon: '📖', color: '#A78BFA', streak: 4,  completedDates: [] },
      { id: 'yh3', name: 'Skincare', icon: '✨', color: '#F5A623', streak: 21, completedDates: [] },
    ],
    transactions: [
      { id: 'yf1', type: 'income',  title: 'Salário',    amount: 5200, category: 'Salário',     date: setDay(1),  notes: '' },
      { id: 'yf2', type: 'expense', title: 'Aluguel',    amount: 1400, category: 'Moradia',     date: setDay(5),  notes: '' },
      { id: 'yf3', type: 'expense', title: 'Academia',   amount: 120,  category: 'Saúde',       date: setDay(2),  notes: '' },
      { id: 'yf4', type: 'expense', title: 'Restaurante',amount: 340,  category: 'Alimentação', date: setDay(11), notes: '' },
    ],
    studyItems: [
      { id: 'ys1', title: 'Design UX/UI',     description: 'Figma, prototipagem', status: 'studying',  progress: 70,  tags: ['Design'],    notes: 'Atomic design.', resources: 'figma.com', createdAt: now(), updatedAt: now() },
      { id: 'ys2', title: 'Marketing Digital',description: 'SEO, social media',   status: 'studying',  progress: 45,  tags: ['Marketing'],  notes: 'Aula de SEO.',   resources: '',          createdAt: now(), updatedAt: now() },
      { id: 'ys3', title: 'Excel Avançado',   description: 'Tabelas dinâmicas',   status: 'completed', progress: 100, tags: ['Excel'],       notes: 'Finalizado!',    resources: '',          createdAt: now(), updatedAt: now() },
    ],
    notes: [
      { id: 'yn1', title: 'Receitas saudáveis', content: '- Smoothie verde\n- Bowl de açaí', color: '#F0556A', pinned: true, createdAt: now(), updatedAt: now() },
    ],
    goals: [
      { id: 'yg1', title: 'Viagem Europa',   description: 'Portugal + Espanha', target: 12000, current: 3500, category: 'Viagem',   deadline: day(365), color: '#F0556A', createdAt: now() },
      { id: 'yg2', title: 'Curso UX Design', description: 'Certificação Google',target: 2000,  current: 800,  category: 'Educação', deadline: day(120), color: '#A78BFA', createdAt: now() },
    ],
    agenda: [
      { id: 'ya1', title: 'Yoga matinal',      date: day(0, 7,  0), endTime: '08:00', description: 'Aula online',       color: '#F0556A' },
      { id: 'ya2', title: 'Reunião de design', date: day(0, 14, 0), endTime: '15:00', description: 'Revisão de mockups',color: '#A78BFA' },
      { id: 'ya3', title: 'Consulta médica',   date: day(3, 10, 0), endTime: '11:00', description: 'Check-up anual',    color: '#2DD4BF' },
    ],
  },

  // Pedro (user / estudante)
  pedro: {
    tasks: [
      { id: 'p1', title: 'Estudar para prova', description: 'Capítulos 3 a 7',  priority: 'high',   completed: false, createdAt: now(), dueDate: day(3) },
      { id: 'p2', title: 'Entregar TCC cap2',  description: 'Capítulo 2',       priority: 'high',   completed: false, createdAt: now(), dueDate: day(1) },
      { id: 'p3', title: 'Pagar mensalidade',  description: '',                  priority: 'medium', completed: false, createdAt: now(), dueDate: day(5) },
    ],
    habits: [
      { id: 'ph1', name: 'Estudar 2h',     icon: '📖', color: '#2DD4BF', streak: 3, completedDates: [] },
      { id: 'ph2', name: 'Correr 5km',     icon: '🏃', color: '#C8F135', streak: 8, completedDates: [] },
      { id: 'ph3', name: 'Sem redes soc.', icon: '📵', color: '#F5A623', streak: 1, completedDates: [] },
    ],
    transactions: [
      { id: 'pf1', type: 'income',  title: 'Estágio',         amount: 2400, category: 'Salário',   date: setDay(5),  notes: '' },
      { id: 'pf2', type: 'income',  title: 'Bico freelance',  amount: 400,  category: 'Freelance', date: setDay(18), notes: '' },
      { id: 'pf3', type: 'expense', title: 'Mensalidade',     amount: 900,  category: 'Educação',  date: setDay(10), notes: '' },
      { id: 'pf4', type: 'expense', title: 'Alimentação',     amount: 380,  category: 'Alimentação',date: setDay(7), notes: '' },
    ],
    studyItems: [
      { id: 'ps1', title: 'Cálculo II',    description: 'Integrais múltiplas', status: 'studying',  progress: 30,  tags: ['Matemática'], notes: 'Integrais triplas.',    resources: '', createdAt: now(), updatedAt: now() },
      { id: 'ps2', title: 'Algoritmos',    description: 'Complexidade, grafos',status: 'studying',  progress: 55,  tags: ['Computação'], notes: 'Dijkstra funcionando!', resources: '', createdAt: now(), updatedAt: now() },
      { id: 'ps3', title: 'Inglês técnico',description: 'Leitura de artigos',  status: 'queued',    progress: 0,   tags: ['Inglês'],     notes: '',                      resources: '', createdAt: now(), updatedAt: now() },
    ],
    notes: [
      { id: 'pn1', title: 'Fórmulas Cálculo', content: '∫∫∫ f(x,y,z) dV\nJacobiano = |∂(x,y)/∂(u,v)|', color: '#2DD4BF', pinned: true, createdAt: now(), updatedAt: now() },
    ],
    goals: [
      { id: 'pg1', title: 'Aprovação no TCC', description: 'Nota >= 8.0', target: 100, current: 65, category: 'Educação', deadline: day(180), color: '#2DD4BF', createdAt: now() },
    ],
    agenda: [
      { id: 'pa1', title: 'Aula Cálculo II',    date: day(0, 8,  0),  endTime: '10:00', description: 'Integrais múltiplas', color: '#2DD4BF' },
      { id: 'pa2', title: 'Estudo em grupo',    date: day(0, 14, 0),  endTime: '17:00', description: 'Revisão para prova',  color: '#C8F135' },
      { id: 'pa3', title: 'Prova Algoritmos',   date: day(4, 8,  0),  endTime: '10:00', description: 'Sala B-204',          color: '#F5A623' },
    ],
  },
};
