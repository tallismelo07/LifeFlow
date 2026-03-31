// src/components/finance/Finance.jsx — LifeFlow Finance v3
// Modelo: title · amount · installmentValue · type · category · bank · date
// IA: parser natural de texto em português

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, TrendingUp, TrendingDown, Wallet,
  Sparkles, Send, ChevronLeft, ChevronRight,
  BarChart3, List, Home, Edit3, Check, X, AlertCircle, FileDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { apiBaseURL } from '../../services/api';

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════

const CATEGORIES = [
  { value: 'alimentacao', label: 'Alimentação', emoji: '🍔' },
  { value: 'assinatura',  label: 'Assinatura',  emoji: '📱' },
  { value: 'curso',       label: 'Curso',        emoji: '📚' },
  { value: 'salario',     label: 'Salário',      emoji: '💼' },
  { value: 'freelancer',  label: 'Freelancer',   emoji: '💻' },
  { value: 'saude',       label: 'Saúde',        emoji: '🏥' },
  { value: 'transporte',  label: 'Transporte',   emoji: '🚗' },
  { value: 'moradia',     label: 'Moradia',      emoji: '🏠' },
  { value: 'lazer',       label: 'Lazer',        emoji: '🎮' },
  { value: 'outro',       label: 'Outro',        emoji: '📦' },
];

const BANKS = [
  { value: 'nubank',      label: 'Nubank',        color: '#8A05BE' },
  { value: 'itau',        label: 'Itaú',          color: '#FF6200' },
  { value: 'inter',       label: 'Inter',         color: '#FF7A00' },
  { value: 'bradesco',    label: 'Bradesco',      color: '#CC092F' },
  { value: 'bb',          label: 'Banco do Brasil', color: '#FFDD00', textColor: '#1a1a1a' },
  { value: 'santander',   label: 'Santander',     color: '#EC0000' },
  { value: 'caixa',       label: 'Caixa',         color: '#005BAC' },
  { value: 'mercadopago', label: 'Mercado Pago',  color: '#00BCFF' },
  { value: 'picpay',      label: 'PicPay',        color: '#11C76F' },
  { value: 'c6',          label: 'C6 Bank',       color: '#222222' },
  { value: 'neon',        label: 'Neon',          color: '#00D1AC' },
  { value: 'pagbank',     label: 'PagBank',       color: '#F8A100' },
  { value: 'xp',          label: 'XP',            color: '#000000' },
  { value: 'btg',         label: 'BTG Pactual',   color: '#0052CC' },
  { value: 'outro',       label: 'Outro',         color: '#888888' },
];

const getCat    = (v) => CATEGORIES.find((c) => c.value === v) || CATEGORIES[CATEGORIES.length - 1];
const getBank   = (v) => BANKS.find((b) => b.value === v)      || BANKS[BANKS.length - 1];
const fmtBRL    = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);
const fmtDate   = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '';
const todayStr  = () => new Date().toISOString().split('T')[0];
const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ═══════════════════════════════════════════════════════════════
//  AI PARSER
// ═══════════════════════════════════════════════════════════════

function parseFinanceInput(text) {
  const raw   = text.trim();
  const lower = raw.toLowerCase();

  /* ── 1. Valor ─────────────────────────────────────── */
  const amountRx = /(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*(?:[,]\d{1,2})?|\d+(?:[,]\d{1,2})?)\s*(?:reais?|real)?/i;
  const amountM  = lower.match(amountRx);
  const amount   = amountM
    ? parseFloat(amountM[1].replace(/\./g, '').replace(',', '.'))
    : null;

  /* ── 2. Tipo ──────────────────────────────────────── */
  const incomeKw = ['recebi','recebei','salário','salario','ganhou','ganhar',
    'freelancer','freela','entrada','recebeu','depósito','deposito'];
  let type = 'expense';
  for (const w of incomeKw) if (lower.includes(w)) { type = 'income'; break; }

  /* ── 3. Categoria ─────────────────────────────────── */
  const catMap = [
    { cat: 'alimentacao', kw: ['comi','comida','acai','açaí','pizza','hamburguer','restaurante','lanche','ifood','almoço','almoco','janta','café','cafe','sushi','churrasco','mercado','supermercado','padaria','bar'] },
    { cat: 'assinatura',  kw: ['netflix','spotify','youtube','prime','disney','hbo','max','assinatura','deezer','globoplay','crunchyroll'] },
    { cat: 'curso',       kw: ['curso','udemy','alura','rocketseat','treinamento','bootcamp','aula','workshop','mentoria','livro'] },
    { cat: 'salario',     kw: ['salário','salario','holerite','remuneração'] },
    { cat: 'freelancer',  kw: ['freelancer','freela','projeto','cliente','serviço','servico'] },
    { cat: 'transporte',  kw: ['uber','gasolina','ônibus','onibus','metro','metrô','combustível','combustivel','99','passagem','estacionamento'] },
    { cat: 'saude',       kw: ['farmácia','farmacia','remédio','remedio','médico','medico','consulta','academia','dentista','exame','plano'] },
    { cat: 'moradia',     kw: ['aluguel','luz','água','agua','internet','condomínio','condominio','iptu','seguro'] },
    { cat: 'lazer',       kw: ['cinema','show','festa','viagem','hotel','ingresso','jogo','passeio'] },
  ];
  let category = 'outro';
  for (const { cat, kw } of catMap) {
    if (kw.some((w) => lower.includes(w))) { category = cat; break; }
  }

  /* ── 4. Banco ─────────────────────────────────────── */
  let bank = 'outro';
  if      (lower.includes('nubank')                             ) bank = 'nubank';
  else if (lower.includes('itaú')    || lower.includes('itau') ) bank = 'itau';
  else if (lower.includes('inter')                              ) bank = 'inter';
  else if (lower.includes('bradesco')                           ) bank = 'bradesco';
  else if (lower.includes('banco do brasil') || lower.includes(' bb ') || lower.includes('bb banco')) bank = 'bb';
  else if (lower.includes('santander')                          ) bank = 'santander';
  else if (lower.includes('caixa')                              ) bank = 'caixa';
  else if (lower.includes('mercado pago') || lower.includes('mercadopago')) bank = 'mercadopago';
  else if (lower.includes('picpay')                             ) bank = 'picpay';
  else if (lower.includes('c6')                                 ) bank = 'c6';
  else if (lower.includes('neon')                               ) bank = 'neon';
  else if (lower.includes('pagbank') || lower.includes('pagseguro')) bank = 'pagbank';
  else if (lower.includes(' xp ')    || lower.includes('xp invest')) bank = 'xp';
  else if (lower.includes('btg')                                ) bank = 'btg';

  /* ── 5. Título ────────────────────────────────────── */
  let title = raw;
  if (amountM) {
    const idx = lower.indexOf(amountM[0].toLowerCase());
    if (idx > 0) title = raw.substring(0, idx).trim();
  }
  title = title
    .replace(/^(comprei|paguei|gastei|recebi|recebei|fiz|compra|gasto|pago|recebido)\s+/i, '')
    .trim();
  if (title) title = title.charAt(0).toUpperCase() + title.slice(1);
  if (!title) title = type === 'income' ? 'Entrada' : 'Despesa';

  return { title, amount, type, category, bank };
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS / MINI-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function BankBadge({ bank }) {
  const b = getBank(bank);
  return (
    <span style={{
      background: b.color + '22', color: b.color,
      border: `1px solid ${b.color}44`,
      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 6,
    }}>
      {b.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TRANSACTION FORM MODAL
// ═══════════════════════════════════════════════════════════════

const BLANK_TX = {
  title: '', amount: '', installmentValue: '',
  type: 'expense', category: 'outro', bank: 'outro', date: todayStr(),
};

function TxFormModal({ initial = BLANK_TX, onSave, onClose, modalTitle = 'Nova Transação' }) {
  const [form, setForm] = useState({ ...BLANK_TX, ...initial });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.title.trim() && parseFloat(form.amount) > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valid) return;
    onSave({
      ...form,
      amount:           parseFloat(form.amount) || 0,
      installmentValue: parseFloat(form.installmentValue) || 0,
    });
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560, margin: '0 auto',
          background: 'var(--bg-soft)', borderRadius: '20px 20px 0 0',
          borderTop: '1px solid var(--border-md)',
          maxHeight: '92vh', overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 20px)',
        }}
      >
        <div style={{ width: 36, height: 3, background: 'var(--border-strong)', borderRadius: 99, margin: '10px auto 0' }} />
        <div style={{ padding: '16px 20px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{modalTitle}</h3>
            <button onClick={onClose} style={{ color: 'var(--text-4)', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Tipo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['expense', 'income'].map((t) => (
                <button key={t} type="button" onClick={() => set('type', t)} style={{
                  padding: '10px 0', borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  border: `1.5px solid ${form.type === t ? (t === 'income' ? 'var(--green)' : 'var(--red)') : 'var(--border-md)'}`,
                  background: form.type === t ? (t === 'income' ? 'var(--green-bg)' : 'var(--red-bg)') : 'var(--bg-muted)',
                  color: form.type === t ? (t === 'income' ? 'var(--green)' : 'var(--red)') : 'var(--text-3)',
                }}>
                  {t === 'income' ? '↑ Entrada' : '↓ Saída'}
                </button>
              ))}
            </div>

            {/* Título */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Descrição *</label>
              <input className="input-base" placeholder="Ex: Supermercado, Netflix, Salário..." value={form.title} onChange={(e) => set('title', e.target.value)} required />
            </div>

            {/* Valor */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Valor Total *</label>
              <input className="input-base" type="number" step="0.01" min="0.01" placeholder="R$ 0,00" value={form.amount} onChange={(e) => set('amount', e.target.value)} required inputMode="decimal" />
            </div>

            {/* Parcela */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Valor da Parcela <span style={{ fontWeight: 400, textTransform: 'none' }}>(opcional)</span></label>
              <input className="input-base" type="number" step="0.01" min="0" placeholder="Ex: R$ 100,00" value={form.installmentValue} onChange={(e) => set('installmentValue', e.target.value)} inputMode="decimal" />
            </div>

            {/* Categoria */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Categoria</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CATEGORIES.map((c) => (
                  <button key={c.value} type="button" onClick={() => set('category', c.value)} style={{
                    padding: '6px 11px', borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    border: `1px solid ${form.category === c.value ? 'var(--border-strong)' : 'var(--border-md)'}`,
                    background: form.category === c.value ? 'var(--bg-raised)' : 'var(--bg-muted)',
                    color: form.category === c.value ? 'var(--text)' : 'var(--text-3)',
                  }}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Banco */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Banco</label>
              <select className="input-base" value={form.bank} onChange={(e) => set('bank', e.target.value)}>
                {BANKS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>

            {/* Data */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Data</label>
              <input className="input-base" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>

            <button type="submit" disabled={!valid} className="btn-primary" style={{ width: '100%', marginTop: 6, fontSize: 14, padding: '12px 0' }}>
              {modalTitle === 'Editar Transação' ? 'Salvar Alterações' : 'Adicionar'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  AI INPUT BAR
// ═══════════════════════════════════════════════════════════════

function AIInputBar({ onConfirm }) {
  const [text,    setText]    = useState('');
  const [preview, setPreview] = useState(null);

  const handleParse = () => {
    if (!text.trim()) return;
    setPreview({ ...parseFinanceInput(text), date: todayStr() });
  };

  const handleConfirm = () => {
    if (!preview || !preview.amount) return;
    onConfirm(preview);
    setText('');
    setPreview(null);
  };

  const handleCancel = () => { setPreview(null); };

  if (preview) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--bg-soft)', border: '1px solid var(--amber-border)', borderRadius: 16, padding: '14px 16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Sparkles size={15} style={{ color: 'var(--amber)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)' }}>Transação detectada</span>
          <button onClick={handleCancel} style={{ marginLeft: 'auto', color: 'var(--text-4)', cursor: 'pointer' }}><X size={15} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>Descrição</label>
            <input className="input-base" style={{ fontSize: 13, padding: '7px 10px' }} value={preview.title} onChange={(e) => setPreview((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>Valor (R$)</label>
            <input className="input-base" style={{ fontSize: 13, padding: '7px 10px' }} type="number" step="0.01" value={preview.amount || ''} onChange={(e) => setPreview((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {['expense','income'].map((t) => (
            <button key={t} type="button" onClick={() => setPreview((p) => ({ ...p, type: t }))} style={{
              padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${preview.type === t ? (t === 'income' ? 'var(--green)' : 'var(--red)') : 'var(--border)'}`,
              background: preview.type === t ? (t === 'income' ? 'var(--green-bg)' : 'var(--red-bg)') : 'transparent',
              color: preview.type === t ? (t === 'income' ? 'var(--green)' : 'var(--red)') : 'var(--text-4)',
            }}>
              {t === 'income' ? '↑ Entrada' : '↓ Saída'}
            </button>
          ))}
          <select className="input-base" style={{ fontSize: 12, padding: '5px 10px', width: 'auto', flex: 1 }} value={preview.category} onChange={(e) => setPreview((p) => ({ ...p, category: e.target.value }))}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
          </select>
          <select className="input-base" style={{ fontSize: 12, padding: '5px 10px', width: 'auto', flex: 1 }} value={preview.bank} onChange={(e) => setPreview((p) => ({ ...p, bank: e.target.value }))}>
            {BANKS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>

        {!preview.amount && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--amber)', fontSize: 12, marginBottom: 8 }}>
            <AlertCircle size={13} /><span>Não detectei o valor. Preencha acima.</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleCancel} className="btn-ghost" style={{ flex: 1, fontSize: 13 }}>Cancelar</button>
          <button onClick={handleConfirm} className="btn-primary" disabled={!preview.amount} style={{ flex: 2, fontSize: 13 }}>
            <Check size={14} style={{ display: 'inline', marginRight: 6 }} />Confirmar
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'center',
      background: 'var(--bg-soft)', border: '1px solid var(--border-md)',
      borderRadius: 14, padding: '8px 12px',
    }}>
      <Sparkles size={16} style={{ color: 'var(--amber)', flexShrink: 0 }} />
      <input
        className="input-base"
        style={{ border: 'none', background: 'transparent', padding: '4px 0', fontSize: 14, flex: 1, boxShadow: 'none' }}
        placeholder='Digite: "comprei açaí 30 reais nubank"'
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleParse(); }}
      />
      <button
        onClick={handleParse}
        disabled={!text.trim()}
        style={{
          background: text.trim() ? 'var(--amber)' : 'var(--bg-muted)',
          color: text.trim() ? '#000' : 'var(--text-4)',
          border: 'none', borderRadius: 10, padding: '7px 13px',
          fontWeight: 600, fontSize: 13, cursor: text.trim() ? 'pointer' : 'default',
          transition: 'all 0.15s',
        }}
      >
        <Send size={14} />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TRANSACTION CARD
// ═══════════════════════════════════════════════════════════════

function TransactionCard({ tx, onDelete, onEdit }) {
  const cat = getCat(tx.category);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      style={{
        background: 'var(--bg-soft)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: tx.type === 'income' ? 'var(--green-bg)' : 'var(--red-bg)',
        border: `1px solid ${tx.type === 'income' ? 'var(--green-border)' : 'var(--red-border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>
        {cat.emoji}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {tx.title || tx.description || 'Transação'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{fmtDate(tx.date)}</span>
          <BankBadge bank={tx.bank || 'outro'} />
          {tx.installmentValue > 0 && (
            <span style={{ fontSize: 10, color: 'var(--text-4)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: 5 }}>
              {fmtBRL(tx.installmentValue)}/parcela
            </span>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
          {tx.type === 'income' ? '+' : '-'}{fmtBRL(tx.amount)}
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6, justifyContent: 'flex-end' }}>
          <button onClick={() => onEdit(tx)} style={{ color: 'var(--text-4)', cursor: 'pointer', padding: 4, opacity: 0.7 }}><Edit3 size={13} /></button>
          <button onClick={() => onDelete(tx.id)} style={{ color: 'var(--red)', cursor: 'pointer', padding: 4, opacity: 0.7 }}><Trash2 size={13} /></button>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TAB: OVERVIEW
// ═══════════════════════════════════════════════════════════════

function TabOverview({ transactions, onGoToTx }) {
  // Visão geral = apenas o mês corrente
  const now          = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthName    = `${MONTHS_PT[now.getMonth()]} ${now.getFullYear()}`;

  const thisMonth = transactions.filter((t) => {
    const d = (t.date || t.createdAt || '').slice(0, 7);
    return d === currentMonth;
  });

  const totalIn  = thisMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalOut = thisMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance  = totalIn - totalOut;

  // Recentes: 5 transações mais novas de todos os meses
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Balance hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: balance >= 0 ? 'var(--green-bg)' : 'var(--red-bg)',
          border: `1px solid ${balance >= 0 ? 'var(--green-border)' : 'var(--red-border)'}`,
          borderRadius: 20, padding: '24px 20px', textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Saldo em {monthName}</p>
        <p style={{ fontSize: 36, fontWeight: 800, color: balance >= 0 ? 'var(--green)' : 'var(--red)', letterSpacing: '-0.02em' }}>
          {fmtBRL(balance)}
        </p>
      </motion.div>

      {/* Income + Expense grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { label: 'Entradas', value: totalIn,  color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)', Icon: TrendingUp },
          { label: 'Saídas',   value: totalOut, color: 'var(--red)',   bg: 'var(--red-bg)',   border: 'var(--red-border)',   Icon: TrendingDown },
        ].map(({ label, value, color, bg, border, Icon }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * (i + 1) }}
            style={{ background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: 16 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon size={16} style={{ color }} />
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>{label}</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color }}>{fmtBRL(value)}</p>
          </motion.div>
        ))}
      </div>

      {/* Category breakdown — mês atual */}
      <CategoryBreakdown transactions={thisMonth} />

      {/* Recent */}
      {recent.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Recentes</p>
            <button onClick={onGoToTx} style={{ fontSize: 12, color: 'var(--text-4)', cursor: 'pointer' }}>Ver todas →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recent.map((tx) => (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 12,
              }}>
                <span style={{ fontSize: 18 }}>{getCat(tx.category).emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.title || tx.description || 'Transação'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-4)' }}>{fmtDate(tx.date)}</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: tx.type === 'income' ? 'var(--green)' : 'var(--red)', flexShrink: 0 }}>
                  {tx.type === 'income' ? '+' : '-'}{fmtBRL(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {transactions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-4)' }}>
          <Wallet size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: 14, fontWeight: 500 }}>Nenhuma transação ainda</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Use a aba Transações para adicionar</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CATEGORY BREAKDOWN
// ═══════════════════════════════════════════════════════════════

function CategoryBreakdown({ transactions }) {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
  if (totalExp === 0) return null;

  const byCat = {};
  for (const tx of expenses) byCat[tx.category || 'outro'] = (byCat[tx.category || 'outro'] || 0) + tx.amount;
  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 12 }}>Gastos por categoria</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map(([cat, total]) => {
          const c = getCat(cat);
          const pct = Math.round((total / totalExp) * 100);
          return (
            <div key={cat}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5 }}>{c.emoji} {c.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{fmtBRL(total)}</span>
              </div>
              <div style={{ height: 5, background: 'var(--bg-muted)', borderRadius: 99, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'var(--red)', borderRadius: 99, opacity: 0.75 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TAB: TRANSACTIONS
// ═══════════════════════════════════════════════════════════════

function TabTransactions({ transactions, addTransaction, deleteTransaction, updateTransaction, toast }) {
  const [showForm,    setShowForm]    = useState(false);
  const [editingTx,   setEditingTx]   = useState(null);
  const [filterType,  setFilterType]  = useState('all');
  const [filterBank,  setFilterBank]  = useState('all');
  const [monthOffset, setMonthOffset] = useState(0);

  const now         = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthLabel  = `${MONTHS_PT[targetMonth.getMonth()]} ${targetMonth.getFullYear()}`;
  const monthKey    = `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, '0')}`;

  const filtered = transactions.filter((tx) => {
    const txMonth = (tx.date || tx.createdAt || '').slice(0, 7);
    if (txMonth !== monthKey)                            return false;
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterBank !== 'all' && (tx.bank || 'outro') !== filterBank) return false;
    return true;
  }).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

  const monthIn  = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthOut = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleAI = (parsed) => {
    addTransaction({ ...parsed, date: parsed.date || todayStr() });
    toast.show('Transação criada via IA ✨', 'success');
  };

  const handleSave = (form) => {
    if (editingTx) {
      updateTransaction(editingTx.id, form);
      toast.show('Transação atualizada', 'success');
    } else {
      addTransaction(form);
      toast.show('Transação adicionada', 'success');
    }
    setShowForm(false);
    setEditingTx(null);
  };

  const handleDelete = (id) => { deleteTransaction(id); toast.show('Removida', 'info'); };
  const handleEdit   = (tx) => { setEditingTx(tx); setShowForm(true); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* AI input */}
      <AIInputBar onConfirm={handleAI} />

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        <button onClick={() => setMonthOffset((o) => o - 1)} style={{ padding: 6, color: 'var(--text-3)', cursor: 'pointer' }}><ChevronLeft size={18} /></button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)' }}>{monthLabel}</p>
          <p style={{ fontSize: 11, color: 'var(--text-4)' }}>
            <span style={{ color: 'var(--green)' }}>+{fmtBRL(monthIn)}</span>
            {' · '}
            <span style={{ color: 'var(--red)' }}>-{fmtBRL(monthOut)}</span>
          </p>
        </div>
        <button onClick={() => setMonthOffset((o) => o + 1)} style={{ padding: 6, color: 'var(--text-3)', cursor: 'pointer' }}><ChevronRight size={18} /></button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {[{ label: 'Todos', v: 'all' }, { label: '↑ Entradas', v: 'income' }, { label: '↓ Saídas', v: 'expense' }].map(({ label, v }) => (
          <button key={v} onClick={() => setFilterType(v)} style={{
            padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            background: filterType === v ? 'var(--bg-raised)' : 'var(--bg-muted)',
            border: `1px solid ${filterType === v ? 'var(--border-strong)' : 'var(--border)'}`,
            color: filterType === v ? 'var(--text)' : 'var(--text-3)',
          }}>{label}</button>
        ))}
        {BANKS.map((b) => (
          <button key={b.value} onClick={() => setFilterBank(filterBank === b.value ? 'all' : b.value)} style={{
            padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            background: filterBank === b.value ? b.color + '22' : 'var(--bg-muted)',
            border: `1px solid ${filterBank === b.value ? b.color + '66' : 'var(--border)'}`,
            color: filterBank === b.value ? b.color : 'var(--text-3)',
          }}>{b.label}</button>
        ))}
      </div>

      {/* Add button */}
      <button onClick={() => { setEditingTx(null); setShowForm(true); }} className="btn-ghost"
        style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%' }}>
        <Plus size={15} /> Adicionar manualmente
      </button>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-4)' }}>
          <p style={{ fontSize: 13 }}>Sem transações em {monthLabel}</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((tx) => (
              <TransactionCard key={tx.id} tx={tx} onDelete={handleDelete} onEdit={handleEdit} />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <TxFormModal
            key="txform"
            modalTitle={editingTx ? 'Editar Transação' : 'Nova Transação'}
            initial={editingTx ? {
              title:            editingTx.title || editingTx.description || '',
              amount:           String(editingTx.amount || ''),
              installmentValue: String(editingTx.installmentValue || ''),
              type:             editingTx.type || 'expense',
              category:         editingTx.category || 'outro',
              bank:             editingTx.bank || 'outro',
              date:             editingTx.date || todayStr(),
            } : undefined}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditingTx(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TAB: ANALYTICS
// ═══════════════════════════════════════════════════════════════

function TabAnalytics({ transactions }) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: MONTHS_PT[d.getMonth()],
    };
  });

  const monthData = months.map(({ key, label }) => {
    const txs = transactions.filter((t) => (t.date || t.createdAt || '').slice(0, 7) === key);
    return {
      label,
      income:  txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  });

  const maxVal = Math.max(...monthData.flatMap((m) => [m.income, m.expense]), 1);

  const bankMap = {};
  for (const tx of transactions.filter((t) => t.type === 'expense')) {
    const k = tx.bank || 'outro';
    bankMap[k] = (bankMap[k] || 0) + tx.amount;
  }
  const bankEntries  = Object.entries(bankMap).sort((a, b) => b[1] - a[1]);
  const totalBankExp = bankEntries.reduce((s, [, v]) => s + v, 0);

  if (transactions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-4)' }}>
        <BarChart3 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
        <p style={{ fontSize: 14 }}>Adicione transações para ver análises</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Monthly chart */}
      <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 16 }}>Últimos 6 meses</p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 110 }}>
          {monthData.map(({ label, income, expense }) => (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 90 }}>
                <motion.div initial={{ height: 0 }} animate={{ height: `${(income / maxVal) * 90}px` }} transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{ width: 11, background: 'var(--green)', borderRadius: '4px 4px 2px 2px', opacity: 0.85, minHeight: income > 0 ? 3 : 0 }} />
                <motion.div initial={{ height: 0 }} animate={{ height: `${(expense / maxVal) * 90}px` }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
                  style={{ width: 11, background: 'var(--red)', borderRadius: '4px 4px 2px 2px', opacity: 0.85, minHeight: expense > 0 ? 3 : 0 }} />
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-4)' }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          {[{ label: 'Entradas', color: 'var(--green)' }, { label: 'Saídas', color: 'var(--red)' }].map(({ label, color }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-3)' }}>
              <span style={{ width: 8, height: 8, background: color, borderRadius: 2, display: 'inline-block' }} />{label}
            </span>
          ))}
        </div>
      </div>

      {/* Bank distribution */}
      {bankEntries.length > 0 && (
        <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 12 }}>Gastos por banco</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bankEntries.map(([bankV, total]) => {
              const b   = getBank(bankV);
              const pct = Math.round((total / totalBankExp) * 100);
              return (
                <div key={bankV}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: b.color, fontWeight: 600 }}>{b.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{fmtBRL(total)} <span style={{ fontSize: 10, color: 'var(--text-4)' }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-muted)', borderRadius: 99, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
                      style={{ height: '100%', background: b.color, borderRadius: 99, opacity: 0.8 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════

const TABS = [
  { id: 'overview',     label: 'Visão Geral', icon: Home     },
  { id: 'transactions', label: 'Transações',  icon: List     },
  { id: 'analytics',    label: 'Análise',     icon: BarChart3 },
];

export default function Finance() {
  const { transactions, addTransaction, deleteTransaction, updateTransaction } = useApp();
  const toast = useToast();
  const [tab, setTab]           = useState('overview');
  const [downloading, setDownloading] = useState(false);

  const handleReport = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const token = localStorage.getItem('lf_token');
      const res   = await fetch(`${apiBaseURL}/finance/report`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'lifeflow-relatorio.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.show('Relatório baixado!', 'success');
    } catch {
      toast.show('Erro ao gerar relatório', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ padding: '20px 16px', maxWidth: 680, margin: '0 auto', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 14,
          background: 'var(--green-bg)', border: '1px solid var(--green-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Wallet size={20} style={{ color: 'var(--green)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>Financeiro</h1>
          <p style={{ fontSize: 12, color: 'var(--text-4)' }}>{transactions.length} transação{transactions.length !== 1 ? 'ões' : ''}</p>
        </div>
        <button
          onClick={handleReport}
          disabled={downloading}
          title="Gerar relatório em PDF"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 12, fontSize: 12, fontWeight: 600,
            border: '1px solid var(--border-md)', background: 'var(--bg-soft)',
            color: downloading ? 'var(--text-4)' : 'var(--text-2)',
            cursor: downloading ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
            flexShrink: 0,
          }}
        >
          <FileDown size={14} />
          {downloading ? 'Gerando…' : 'Relatório'}
        </button>
      </div>

      {/* Tab pills */}
      <div style={{
        display: 'flex', gap: 4, background: 'var(--bg-soft)',
        border: '1px solid var(--border)', borderRadius: 14, padding: 4, marginBottom: 18,
      }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '8px 4px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: 'none',
            background: tab === id ? 'var(--bg-raised)' : 'transparent',
            color: tab === id ? 'var(--text)' : 'var(--text-4)',
            transition: 'all 0.15s',
          }}>
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'overview'     && <TabOverview     transactions={transactions} onGoToTx={() => setTab('transactions')} />}
          {tab === 'transactions' && <TabTransactions  transactions={transactions} addTransaction={addTransaction} deleteTransaction={deleteTransaction} updateTransaction={updateTransaction} toast={toast} />}
          {tab === 'analytics'    && <TabAnalytics     transactions={transactions} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
