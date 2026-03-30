// src/components/feedback/Feedback.jsx
// Tela de sugestões para usuários comuns (Yasmin, Pedro)

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { sendFeedbackRequest } from '../../services/authService';
import { Lightbulb, Send, CheckCircle2, Loader2 } from 'lucide-react';

const PLACEHOLDERS = [
  'Ex: Seria legal poder exportar as tarefas em PDF...',
  'Ex: Queria um modo de ver hábitos por semana...',
  'Ex: Poderia ter notificação quando o Pomodoro acabar...',
  'Ex: Um modo de compartilhar metas com outros usuários...',
];

const RAND_PLACEHOLDER = PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];

const TIPS = [
  '🐛 Encontrou um bug?',
  '✨ Tem uma ideia nova?',
  '😕 Algo está confuso?',
  '🚀 Quer uma feature?',
];

export default function Feedback() {
  const { currentUser } = useAuth();

  const [message,  setMessage]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState('');
  const [charWarn, setCharWarn] = useState(false);

  const MAX = 2000;
  const remaining = MAX - message.length;

  const handleChange = (e) => {
    const val = e.target.value;
    if (val.length > MAX) return;
    setMessage(val);
    setCharWarn(val.length > MAX * 0.85);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim().length < 3) {
      setError('Escreva ao menos 3 caracteres.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendFeedbackRequest(message.trim());
      setSuccess(true);
      setMessage('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => setSuccess(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-border)' }}
        >
          <Lightbulb size={22} style={{ color: 'var(--amber)' }} />
        </div>
        <div>
          <h1 className="font-bold text-2xl" style={{ color: 'var(--text)' }}>
            Sugestões
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
            Olá, <strong style={{ color: 'var(--text-2)' }}>{currentUser?.name}</strong>! Sua opinião melhora o LifeFlow para todo mundo.
          </p>
        </div>
      </div>

      {/* Chips de exemplo */}
      <div className="flex flex-wrap gap-2">
        {TIPS.map((tip) => (
          <span
            key={tip}
            className="text-xs px-3 py-1.5 rounded-full"
            style={{
              background: 'var(--bg-muted)',
              border: '1px solid var(--border)',
              color: 'var(--text-3)',
            }}
          >
            {tip}
          </span>
        ))}
      </div>

      {/* Card principal */}
      <AnimatePresence mode="wait">
        {success ? (
          /* ── Estado de sucesso ── */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl p-10 flex flex-col items-center gap-5 text-center"
            style={{
              background: 'var(--bg-soft)',
              border: '1px solid var(--green-border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
            >
              <CheckCircle2 size={52} style={{ color: 'var(--green)' }} />
            </motion.div>
            <div>
              <h2 className="font-bold text-xl" style={{ color: 'var(--text)' }}>
                Feedback enviado!
              </h2>
              <p className="text-sm mt-2" style={{ color: 'var(--text-3)' }}>
                Obrigado pela sugestão. Tallis vai analisar assim que possível.
              </p>
            </div>
            <motion.button
              onClick={handleNew}
              className="btn-ghost"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Enviar outra sugestão
            </motion.button>
          </motion.div>
        ) : (
          /* ── Formulário ── */
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="rounded-2xl p-6"
            style={{
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label block mb-2">SUA SUGESTÃO OU FEEDBACK</label>
                <textarea
                  value={message}
                  onChange={handleChange}
                  placeholder={RAND_PLACEHOLDER}
                  rows={6}
                  disabled={loading}
                  className="input-base resize-none leading-relaxed"
                  style={{ fontFamily: 'inherit' }}
                />

                {/* Contador de caracteres */}
                <div className="flex justify-end mt-1.5">
                  <span
                    className="text-xs font-mono"
                    style={{ color: charWarn ? 'var(--amber)' : 'var(--text-4)' }}
                  >
                    {remaining} restantes
                  </span>
                </div>
              </div>

              {/* Erro */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs rounded-xl px-4 py-3"
                    style={{
                      background: 'var(--red-bg)',
                      border: '1px solid var(--red-border)',
                      color: 'var(--red)',
                    }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-xs" style={{ color: 'var(--text-4)' }}>
                  Apenas Tallis pode ler os feedbacks.
                </p>
                <motion.button
                  type="submit"
                  disabled={loading || message.trim().length < 3}
                  className="btn-primary flex items-center gap-2"
                  whileHover={loading ? {} : { scale: 1.02 }}
                  whileTap={loading ? {} : { scale: 0.97 }}
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Enviando...</>
                    : <><Send size={15} /> Enviar</>
                  }
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nota de privacidade */}
      <p className="text-xs text-center" style={{ color: 'var(--text-4)' }}>
        Feedbacks são anônimos para outros usuários · somente o admin tem acesso
      </p>
    </motion.div>
  );
}
