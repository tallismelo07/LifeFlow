// src/components/finance/Finance.jsx
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Card, Button, Input, Select, Textarea, Modal, EmptyState } from '../ui';
import { AreaChart, BarChart, DonutChart } from '../ui/Charts';
import {
  Plus, Trash2, TrendingUp, TrendingDown, DollarSign,
  Wallet, Download, ChevronLeft, ChevronRight, BarChart2,
} from 'lucide-react';

const CATEGORIES_INCOME  = ['Salário', 'Freelance', 'Investimentos', 'Venda', 'Outros'];
const CATEGORIES_EXPENSE = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Roupas', 'Tecnologia', 'Assinaturas', 'Outros'];
const CAT_COLORS = [
  'var(--red)', 'var(--amber)', 'var(--blue)', '#34D399',
  '#A78BFA', '#FB923C', '#F472B6', '#60A5FA', '#4ADE80', '#FACC15',
];

const fmt      = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtShort = (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0);
const BLANK    = { type: 'expense', title: '', amount: '', category: 'Alimentação', notes: '' };

function exportCSV(transactions) {
  const header = 'Tipo,Descrição,Valor,Categoria,Data,Notas';
  const rows   = transactions.map((t) => [
    t.type === 'income' ? 'Receita' : 'Despesa',
    `"${t.title}"`,
    t.amount.toFixed(2).replace('.', ','),
    t.category,
    new Date(t.date).toLocaleDateString('pt-BR'),
    `"${t.notes || ''}"`,
  ].join(','));
  const csv  = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `financeiro-${new Date().toISOString().slice(0, 7)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Finance() {
  const { transactions, addTransaction, deleteTransaction } = useApp();
  const [modalOpen, setModalOpen]     = useState(false);
  const [typeFilter, setTypeFilter]   = useState('all');
  const [form, setForm]               = useState(BLANK);
  const [activeChart, setActiveChart] = useState('area');

  const now = new Date();
  const [viewDate, setViewDate] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const prevMonth = () => setViewDate((d) => ({
    year:  d.month === 0 ? d.year - 1 : d.year,
    month: d.month === 0 ? 11 : d.month - 1,
  }));
  const nextMonth = () => setViewDate((d) => ({
    year:  d.month === 11 ? d.year + 1 : d.year,
    month: d.month === 11 ? 0 : d.month + 1,
  }));
  const monthLabel = new Date(viewDate.year, viewDate.month)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const monthTx = useMemo(() =>
    transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === viewDate.year && d.getMonth() === viewDate.month;
    }),
  [transactions, viewDate]);

  const monthIncome  = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthBalance = monthIncome - monthExpense;
  const savingsRate  = monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 100) : 0;

  const filtered = monthTx
    .filter((t) => typeFilter === 'all' || t.type === typeFilter)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const weeks = [1, 2, 3, 4].map((w) => {
    const s   = (w - 1) * 7 + 1;
    const e   = Math.min(w * 7, new Date(viewDate.year, viewDate.month + 1, 0).getDate());
    const sum = (type) => monthTx
      .filter((t) => { const d = new Date(t.date).getDate(); return t.type === type && d >= s && d <= e; })
      .reduce((a, t) => a + t.amount, 0);
    return { label: `S${w}`, income: sum('income'), expense: sum('expense') };
  });

  const expenseCats = {};
  monthTx.filter((t) => t.type === 'expense').forEach((t) => {
    expenseCats[t.category] = (expenseCats[t.category] || 0) + t.amount;
  });
  const catEntries = Object.entries(expenseCats).sort(([, a], [, b]) => b - a);
  const barData    = catEntries.map(([label, value], i) => ({
    label: label.slice(0, 5), value, color: CAT_COLORS[i % CAT_COLORS.length],
  }));
  const donutData = [
    { label: 'Despesas', value: monthExpense, color: 'var(--red)' },
    { label: 'Receitas', value: monthIncome,  color: 'var(--blue)' },
  ].filter((d) => d.value > 0);

  const handleAdd = () => {
    if (!form.title.trim() || !form.amount || Number(form.amount) <= 0) return;
    addTransaction({ ...form, amount: Number(form.amount) });
    setForm(BLANK);
    setModalOpen(false);
  };
  const openModal = (type = 'expense') => {
    setForm({ ...BLANK, type, category: type === 'expense' ? 'Alimentação' : 'Salário' });
    setModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="p-5 lg:p-8 space-y-5 max-w-5xl mx-auto"
    >
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <motion.button
            onClick={prevMonth}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className="p-2 rounded-xl transition-colors"
            style={{ background: 'var(--bg-muted)', color: 'var(--text-4)' }}
          >
            <ChevronLeft size={15} />
          </motion.button>
          <h2
            className="font-semibold text-base capitalize"
            style={{ color: 'var(--text)', minWidth: 170, textAlign: 'center' }}
          >
            {monthLabel}
          </h2>
          <motion.button
            onClick={nextMonth}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className="p-2 rounded-xl transition-colors"
            style={{ background: 'var(--bg-muted)', color: 'var(--text-4)' }}
          >
            <ChevronRight size={15} />
          </motion.button>
        </div>
        <motion.button
          onClick={() => exportCSV(monthTx)}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-xl transition-colors"
          style={{ background: 'var(--bg-muted)', color: 'var(--text-4)', border: '1px solid var(--border)' }}
        >
          <Download size={13} /> CSV
        </motion.button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Balance — card gradiente de destaque */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="col-span-2 lg:col-span-2 rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: monthBalance >= 0
              ? 'linear-gradient(135deg, #1a2e1e 0%, #0d1f10 100%)'
              : 'linear-gradient(135deg, #2e1a1a 0%, #1f0d0d 100%)',
            border: `1px solid ${monthBalance >= 0 ? 'rgba(76,175,125,0.20)' : 'rgba(224,92,92,0.20)'}`,
            boxShadow: monthBalance >= 0
              ? '0 8px 32px rgba(76,175,125,0.12)'
              : '0 8px 32px rgba(224,92,92,0.12)',
          }}
        >
          {/* Glow de fundo */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: monthBalance >= 0
                ? 'radial-gradient(ellipse 60% 60% at 80% 20%, rgba(76,175,125,0.15) 0%, transparent 70%)'
                : 'radial-gradient(ellipse 60% 60% at 80% 20%, rgba(224,92,92,0.12) 0%, transparent 70%)',
            }}
          />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em' }}>
                Saldo Total
              </span>
              <div
                className="p-2 rounded-xl"
                style={{ background: monthBalance >= 0 ? 'rgba(76,175,125,0.15)' : 'rgba(224,92,92,0.15)' }}
              >
                <Wallet size={14} style={{ color: monthBalance >= 0 ? 'var(--green)' : 'var(--red)' }} />
              </div>
            </div>
            <p
              className="font-bold"
              style={{ color: '#f8f9fa', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', lineHeight: 1 }}
            >
              {fmt(monthBalance)}
            </p>
            {/* Barra de economia */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
                <span>Economia do mês</span>
                <span style={{ color: monthBalance >= 0 ? 'var(--green)' : 'var(--red)' }}>{savingsRate}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(savingsRate, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  style={{ background: monthBalance >= 0 ? 'var(--green)' : 'var(--red)' }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Income */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="label">RECEITAS</span>
            <div className="p-2 rounded-xl" style={{ background: 'var(--green)' + '22' }}>
              <TrendingUp size={13} style={{ color: 'var(--green)' }} />
            </div>
          </div>
          <p className="font-bold text-2xl" style={{ color: 'var(--green)' }}>{fmt(monthIncome)}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>
            {monthTx.filter((t) => t.type === 'income').length} entradas
          </p>
        </motion.div>

        {/* Expense */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="label">DESPESAS</span>
            <div className="p-2 rounded-xl" style={{ background: 'var(--red)' + '22' }}>
              <TrendingDown size={13} style={{ color: 'var(--red)' }} />
            </div>
          </div>
          <p className="font-bold text-2xl" style={{ color: 'var(--red)' }}>{fmt(monthExpense)}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>
            {monthTx.filter((t) => t.type === 'expense').length} saídas
          </p>
        </motion.div>

        {/* Top category */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}
          className="card"
        >
          <span className="label block mb-3">MAIOR GASTO</span>
          {catEntries.length > 0 ? (
            <>
              <p className="font-semibold text-base" style={{ color: 'var(--text)' }}>
                {catEntries[0][0]}
              </p>
              <p className="font-mono text-lg font-bold mt-1" style={{ color: 'var(--red)' }}>
                {fmt(catEntries[0][1])}
              </p>
            </>
          ) : (
            <p className="text-sm mt-2" style={{ color: 'var(--text-4)' }}>—</p>
          )}
        </motion.div>
      </div>

      {/* Charts */}
      <Card>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} style={{ color: 'var(--blue)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Análise Visual</h3>
          </div>
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{ background: 'var(--bg-muted)' }}
          >
            {[
              { id: 'area',  label: 'Fluxo' },
              { id: 'bar',   label: 'Categ.' },
              { id: 'donut', label: 'Proporção' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveChart(id)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                style={
                  activeChart === id
                    ? { background: 'var(--bg-raised)', color: 'var(--text)', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }
                    : { color: 'var(--text-4)' }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-[130px]">
          <AnimatePresence mode="wait">
            {activeChart === 'area' && (
              <motion.div
                key="area"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                <div>
                  <p className="label mb-3">RECEITAS / SEMANA</p>
                  <AreaChart
                    data={weeks.map((w) => w.income)}
                    labels={weeks.map((w) => w.label)}
                    color="var(--green)"
                    height={90}
                  />
                </div>
                <div>
                  <p className="label mb-3">DESPESAS / SEMANA</p>
                  <AreaChart
                    data={weeks.map((w) => w.expense)}
                    labels={weeks.map((w) => w.label)}
                    color="var(--red)"
                    height={90}
                  />
                </div>
              </motion.div>
            )}
            {activeChart === 'bar' && (
              <motion.div key="bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {barData.length === 0
                  ? <p className="text-sm text-center py-8" style={{ color: 'var(--text-4)' }}>Sem despesas</p>
                  : <BarChart data={barData} height={130} formatValue={fmtShort} />
                }
              </motion.div>
            )}
            {activeChart === 'donut' && (
              <motion.div key="donut" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-2">
                {donutData.length === 0
                  ? <p className="text-sm text-center py-8" style={{ color: 'var(--text-4)' }}>Sem dados</p>
                  : <DonutChart segments={donutData} size={150} thickness={28} centerLabel={fmt(monthBalance)} centerSub="SALDO" />
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Actions + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <motion.button
          onClick={() => openModal('income')}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
          style={{
            background: 'var(--green)',
            color: '#fff',
            boxShadow: '0 2px 10px rgba(0,160,60,0.25)',
          }}
        >
          <Plus size={15} /> Receita
        </motion.button>
        <motion.button
          onClick={() => openModal('expense')}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
          style={{
            background: 'var(--bg-raised)',
            color: 'var(--text)',
            border: '1px solid var(--border-md)',
          }}
        >
          <Plus size={15} /> Despesa
        </motion.button>

        <div className="flex gap-2 ml-auto flex-wrap">
          {[
            { id: 'all',     label: 'Todas' },
            { id: 'income',  label: 'Receitas' },
            { id: 'expense', label: 'Despesas' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTypeFilter(id)}
              className="text-xs font-medium px-3 py-1.5 rounded-xl border transition-all"
              style={
                typeFilter === id
                  ? { background: 'var(--blue-bg)', color: 'var(--blue)', borderColor: 'var(--blue-border)' }
                  : { background: 'var(--bg-muted)', color: 'var(--text-3)', borderColor: 'var(--border-md)' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions + category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* List */}
        <div className="lg:col-span-2 space-y-2">
          {filtered.length === 0 ? (
            <EmptyState icon={DollarSign} title="Nenhuma transação" description="Adicione receitas ou despesas" />
          ) : (
            filtered.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <TransactionRow tx={tx} onDelete={() => deleteTransaction(tx.id)} />
              </motion.div>
            ))
          )}
        </div>

        {/* Category breakdown */}
        <Card className="h-fit">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Por Categoria</h3>
          {catEntries.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-4)' }}>Sem despesas</p>
          ) : (
            <div className="space-y-3">
              {catEntries.slice(0, 7).map(([cat, val], i) => {
                const pct = monthExpense > 0 ? (val / monthExpense) * 100 : 0;
                const c   = CAT_COLORS[i % CAT_COLORS.length];
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c }} />
                        {cat}
                      </span>
                      <span className="font-mono" style={{ color: 'var(--text-4)' }}>{fmt(val)}</span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'var(--bg-muted)' }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        style={{ background: c }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Add transaction modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={form.type === 'income' ? '+ Receita' : '− Despesa'}>
        <div className="space-y-4">
          {/* Type toggle */}
          <div
            className="flex gap-2 p-1 rounded-xl"
            style={{ background: 'var(--bg-muted)' }}
          >
            {[
              { id: 'expense', label: 'Despesa' },
              { id: 'income',  label: 'Receita' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setForm({ ...form, type: id, category: id === 'expense' ? 'Alimentação' : 'Salário' })}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                style={
                  form.type === id
                    ? {
                        background: id === 'income' ? 'var(--green)' : 'var(--red)',
                        color: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }
                    : { color: 'var(--text-4)' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          <Input
            label="Descrição *"
            placeholder={form.type === 'income' ? 'Ex: Salário' : 'Ex: Mercado'}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            label="Valor (R$) *"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <Select
            label="Categoria"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {(form.type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Textarea
            label="Observações"
            placeholder="Opcional..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleAdd}>Salvar</Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

function TransactionRow({ tx, onDelete }) {
  const isIncome = tx.type === 'income';
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl transition-colors group"
      style={{
        background:  'var(--bg-soft)',
        border:      '1px solid var(--border)',
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: (isIncome ? 'var(--green)' : 'var(--red)') + '22' }}
      >
        {isIncome
          ? <TrendingUp  size={15} style={{ color: 'var(--green)' }} />
          : <TrendingDown size={15} style={{ color: 'var(--red)' }} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{tx.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-mono" style={{ color: 'var(--text-4)' }}>{tx.category}</span>
          <span style={{ color: 'var(--border-md)' }}>·</span>
          <span className="text-xs font-mono" style={{ color: 'var(--text-4)' }}>
            {new Date(tx.date).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>
      <p
        className="font-bold text-base shrink-0"
        style={{ color: isIncome ? 'var(--green)' : 'var(--red)' }}
      >
        {isIncome ? '+' : '−'} {fmt(tx.amount)}
      </p>
      <motion.button
        onClick={onDelete}
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
        style={{ color: 'var(--text-4)' }}
      >
        <Trash2 size={14} />
      </motion.button>
    </div>
  );
}
