// src/components/weekly/Weekly.jsx
// Revisão Semanal: retrospectiva guiada, planejamento da próxima semana

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Card, Button, Textarea } from '../ui';
import { CheckCircle2, Circle, ChevronRight, RotateCcw } from 'lucide-react';

const getWeekKey = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
};

const REVIEW_QUESTIONS = [
  { id: 'wins', label: '🏆 Vitórias da semana', placeholder: 'O que funcionou bem? Quais foram suas conquistas?', color: 'var(--green)' },
  { id: 'challenges', label: '⚡ Desafios enfrentados', placeholder: 'O que foi difícil? Que obstáculos surgiram?', color: '#F5A623' },
  { id: 'learned', label: '📚 O que aprendi', placeholder: 'Insights técnicos, pessoais ou profissionais...', color: '#5B8DEF' },
  { id: 'improve', label: '🎯 O que melhorar', placeholder: 'O que faria diferente? Onde focar mais energia?', color: '#2DD4BF' },
  { id: 'nextWeek', label: '🚀 Prioridades da próxima semana', placeholder: 'Top 3 objetivos para a semana que vem...', color: '#F0556A' },
  { id: 'gratitude', label: '🙏 Gratidão', placeholder: 'Pelo que você é grato esta semana?', color: '#A78BFA' },
];

export default function Weekly() {
  const { tasks, habits, studyItems, transactions } = useApp();

  const weekKey = getWeekKey();
  const { currentUserId } = useAuth();
  const [reviews, setReviews] = useLocalStorage(`lf_weekly_${currentUserId}`, {});
  const currentReview = reviews[weekKey] || {};

  const [step, setStep] = useState(0); // 0 = overview, 1-6 = questions, 7 = done
  const [form, setForm] = useState(currentReview.answers || {});

  const saveAnswer = (id, value) => {
    const updated = { ...form, [id]: value };
    setForm(updated);
    setReviews({ ...reviews, [weekKey]: { ...currentReview, answers: updated, updatedAt: new Date().toISOString() } });
  };

  const completeReview = () => {
    setReviews({ ...reviews, [weekKey]: { ...currentReview, answers: form, completedAt: new Date().toISOString() } });
    setStep(7);
  };

  // Stats da semana
  const todayStr = new Date().toISOString().split('T')[0];
  const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekStart = oneWeekAgo.toISOString().split('T')[0];

  const weekTasks = tasks.filter((t) => t.createdAt >= weekStart);
  const completedTasks = weekTasks.filter((t) => t.completed).length;

  const weekTx = transactions.filter((t) => t.date >= weekStart);
  const weekExpense = weekTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const weekIncome = weekTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const totalHabitChecks = habits.reduce((sum, h) => {
    const checks = h.completedDates.filter((d) => d >= weekStart).length;
    return sum + checks;
  }, 0);
  const maxPossibleChecks = habits.length * 7;
  const habitScore = maxPossibleChecks > 0 ? Math.round((totalHabitChecks / maxPossibleChecks) * 100) : 0;

  const studyProgress = studyItems.filter((s) => s.status === 'studying' && s.updatedAt >= weekStart).length;

  const isCompleted = !!currentReview.completedAt;
  const answeredCount = Object.values(form).filter((v) => v?.trim()).length;

  // Histórico de semanas
  const pastWeeks = Object.entries(reviews)
    .filter(([k]) => k !== weekKey)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 4);

  if (step === 0) {
    return (
      <motion.div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.22}}>
        {/* Hero */}
        <div className="card text-center py-8" style={{border:"1px solid var(--green-border)",background:"var(--green-bg)"}}>
          <div className="text-4xl mb-3">📋</div>
          <h2 className="font-display font-bold text-2xl text-cream mb-2">Revisão Semanal</h2>
          <p className="text-cream/50 text-sm max-w-md mx-auto">
            Reserve 10–15 minutos para refletir sobre sua semana, celebrar vitórias e planejar a próxima.
          </p>
          <p className="text-xs font-mono mt-3" style={{color:"var(--green)"}}>{weekKey}</p>
        </div>

        {/* Stats auto da semana */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatPill label="TAREFAS" value={`${completedTasks}/${weekTasks.length}`} color="#5B8DEF" icon="✅" />
          <StatPill label="HÁBITOS" value={`${habitScore}%`} color="#2DD4BF" icon="🔥" />
          <StatPill label="GASTOS" value={`R$ ${weekExpense.toFixed(0)}`} color="#F0556A" icon="💸" />
          <StatPill label="ESTUDOS" value={`${studyProgress} atualizados`} color="#F5A623" icon="📚" />
        </div>

        {/* Status da revisão atual */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-cream">Revisão desta semana</h3>
            {isCompleted && (
              <span className="tag text-xs" style={{background:"var(--green-bg)",color:"var(--green)",border:"1px solid var(--green-border)"}}>✅ Concluída</span>
            )}
          </div>
          <div className="space-y-2 mb-5">
            {REVIEW_QUESTIONS.map((q, i) => {
              const answered = !!form[q.id]?.trim();
              return (
                <div key={q.id} className="flex items-center gap-3">
                  {answered ? <CheckCircle2 size={16} style={{ color: q.color }} /> : <Circle size={16} className="text-cream/20" />}
                  <span className={`text-sm ${answered ? 'text-cream' : 'text-cream/40'}`}>{q.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => setStep(1)}>
              {isCompleted ? '📝 Revisar respostas' : answeredCount > 0 ? `Continuar (${answeredCount}/6)` : '🚀 Iniciar revisão'}
            </Button>
            {isCompleted && (
              <button onClick={() => { setForm({}); setReviews({ ...reviews, [weekKey]: {} }); }} className="btn-ghost flex items-center gap-2">
                <RotateCcw size={14} /> Resetar
              </button>
            )}
          </div>
        </Card>

        {/* Histórico */}
        {pastWeeks.length > 0 && (
          <Card>
            <h3 className="font-display font-semibold text-cream mb-4">Revisões Anteriores</h3>
            <div className="space-y-2">
              {pastWeeks.map(([k, rev]) => (
                <div key={k} className="flex items-center gap-3 p-3 bg-ink-muted/40 rounded-xl">
                  <span className="font-mono text-xs text-cream/40 flex-1">{k}</span>
                  {rev.completedAt ? (
                    <span className="tag text-xs" style={{background:"var(--green-bg)",color:"var(--green)",border:"1px solid var(--green-border)"}}>✅ Completa</span>
                  ) : (
                    <span className="tag bg-white/5 text-cream/30 text-xs">Incompleta</span>
                  )}
                  <span className="text-xs text-cream/25">
                    {Object.values(rev.answers || {}).filter((v) => v?.trim()).length}/6 respostas
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </motion.div>
    );
  }

  if (step === 7) {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh] animate-in">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="font-display font-bold text-3xl text-cream mb-3">Revisão concluída!</h2>
        <p className="text-cream/50 text-center max-w-sm mb-8">
          Parabéns por dedicar tempo para refletir. Isso faz de você alguém que cresce de verdade.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => setStep(0)}>Ver resumo</Button>
          <button onClick={() => setStep(1)} className="btn-ghost">Editar respostas</button>
        </div>
      </div>
    );
  }

  // Modo pergunta (step 1–6)
  const qIndex = step - 1;
  const question = REVIEW_QUESTIONS[qIndex];
  const isLast = qIndex === REVIEW_QUESTIONS.length - 1;

  return (
    <div className="p-6 lg:p-8 animate-in max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-mono text-cream/30 mb-2">
          <span>Pergunta {step} de {REVIEW_QUESTIONS.length}</span>
          <button onClick={() => setStep(0)} className="hover:text-cream transition-colors">← Voltar ao início</button>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(step / REVIEW_QUESTIONS.length) * 100}%`,
              backgroundColor: 'var(--blue)',
            }}
          />
        </div>
        {/* Step dots */}
        <div className="flex gap-2 mt-3">
          {REVIEW_QUESTIONS.map((q, i) => (
            <button key={i} onClick={() => setStep(i + 1)}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                backgroundColor: i < step ? q.color : i === qIndex ? q.color : 'rgba(255,255,255,0.1)',
                transform: i === qIndex ? 'scale(1.4)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Pergunta */}
      <Card className="mb-6" style={{ borderColor: question.color + '30', backgroundColor: question.color + '06' }}>
        <div className="text-3xl mb-3">{question.label.split(' ')[0]}</div>
        <h3 className="font-display font-bold text-xl text-cream mb-1">
          {question.label.split(' ').slice(1).join(' ')}
        </h3>
        <p className="text-sm text-cream/40">{question.placeholder}</p>
      </Card>

      <textarea
        className="input-base resize-none w-full mb-6 text-base leading-relaxed"
        rows={8}
        placeholder={question.placeholder}
        value={form[question.id] || ''}
        onChange={(e) => saveAnswer(question.id, e.target.value)}
        autoFocus
      />

      <div className="flex gap-3">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="btn-ghost">← Anterior</button>
        )}
        <Button className="flex-1" onClick={() => isLast ? completeReview() : setStep(step + 1)}>
          <span className="flex items-center justify-center gap-2">
            {isLast ? '✅ Concluir revisão' : 'Próxima'} {!isLast && <ChevronRight size={16} />}
          </span>
        </Button>
      </div>

      {/* Pular */}
      {!form[question.id]?.trim() && (
        <button onClick={() => isLast ? completeReview() : setStep(step + 1)}
          className="w-full mt-3 text-xs text-cream/25 hover:text-cream/50 transition-colors">
          Pular esta pergunta
        </button>
      )}
    </div>
  );
}

function StatPill({ label, value, color, icon }) {
  return (
    <Card className="text-center py-4">
      <div className="text-xl mb-1">{icon}</div>
      <p className="font-display font-bold text-lg" style={{ color }}>{value}</p>
      <p className="label mt-1">{label}</p>
    </Card>
  );
}
