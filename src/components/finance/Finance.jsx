// src/components/finance/Finance.jsx
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Card, Button, Input, Select, Textarea, Modal, EmptyState } from '../ui';
import { AreaChart, BarChart, DonutChart } from '../ui/Charts';
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Wallet, Download, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORIES_INCOME  = ['Salário', 'Freelance', 'Investimentos', 'Venda', 'Outros'];
const CATEGORIES_EXPENSE = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Roupas', 'Tecnologia', 'Assinaturas', 'Outros'];
const CAT_COLORS = ['var(--red)','var(--amber)','var(--blue)','var(--teal)','var(--green)','var(--violet)','#FB923C','#34D399','#F472B6','#60A5FA'];
const fmt      = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtShort = (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0);
const BLANK    = { type: 'expense', title: '', amount: '', category: 'Alimentação', notes: '' };

function exportCSV(transactions) {
  const header = 'Tipo,Descrição,Valor,Categoria,Data,Notas';
  const rows   = transactions.map((t) => [t.type === 'income' ? 'Receita' : 'Despesa', `"${t.title}"`, t.amount.toFixed(2).replace('.', ','), t.category, new Date(t.date).toLocaleDateString('pt-BR'), `"${t.notes || ''}"`].join(','));
  const csv  = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `financeiro-${new Date().toISOString().slice(0,7)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function Finance() {
  const { transactions, addTransaction, deleteTransaction, totalIncome, totalExpense, balance } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [form, setForm]             = useState(BLANK);
  const [activeChart, setActiveChart] = useState('area');

  const now = new Date();
  const [viewDate, setViewDate] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const prevMonth = () => setViewDate((d) => ({ year: d.month === 0 ? d.year-1 : d.year, month: d.month === 0 ? 11 : d.month-1 }));
  const nextMonth = () => setViewDate((d) => ({ year: d.month === 11 ? d.year+1 : d.year, month: d.month === 11 ? 0 : d.month+1 }));
  const monthLabel = new Date(viewDate.year, viewDate.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const monthTx = useMemo(() => transactions.filter((t) => { const d = new Date(t.date); return d.getFullYear() === viewDate.year && d.getMonth() === viewDate.month; }), [transactions, viewDate]);
  const monthIncome  = monthTx.filter((t) => t.type === 'income').reduce((s,t) => s+t.amount, 0);
  const monthExpense = monthTx.filter((t) => t.type === 'expense').reduce((s,t) => s+t.amount, 0);
  const monthBalance = monthIncome - monthExpense;
  const savingsRate  = monthIncome > 0 ? Math.round(((monthIncome-monthExpense)/monthIncome)*100) : 0;
  const filtered     = monthTx.filter((t) => typeFilter === 'all' || t.type === typeFilter).sort((a,b) => new Date(b.date)-new Date(a.date));

  const weeks = [1,2,3,4].map((w) => {
    const s = (w-1)*7+1, e = Math.min(w*7, new Date(viewDate.year, viewDate.month+1, 0).getDate());
    const sum = (type) => monthTx.filter((t) => { const d = new Date(t.date).getDate(); return t.type===type && d>=s && d<=e; }).reduce((a,t) => a+t.amount, 0);
    return { label: `S${w}`, income: sum('income'), expense: sum('expense') };
  });

  const expenseCats = {};
  monthTx.filter((t) => t.type==='expense').forEach((t) => { expenseCats[t.category] = (expenseCats[t.category]||0)+t.amount; });
  const catEntries  = Object.entries(expenseCats).sort(([,a],[,b]) => b-a);
  const barData     = catEntries.map(([label,value],i) => ({ label: label.slice(0,5), value, color: CAT_COLORS[i%CAT_COLORS.length] }));
  const donutData   = [{ label:'Despesas', value: monthExpense, color:'var(--red)' },{ label:'Receitas', value: monthIncome, color:'var(--teal)' }].filter((d) => d.value>0);

  const handleAdd = () => {
    if (!form.title.trim() || !form.amount || Number(form.amount) <= 0) return;
    addTransaction({ ...form, amount: Number(form.amount) });
    setForm(BLANK); setModalOpen(false);
  };
  const openModal = (type = 'expense') => { setForm({ ...BLANK, type, category: type==='expense'?'Alimentação':'Salário' }); setModalOpen(true); };

  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.22}} className="p-6 lg:p-8 space-y-5 ">
      {/* Month nav */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-cream/50 hover:text-cream transition-colors"><ChevronLeft size={15} /></button>
          <h2 className="font-semibold text-base text-cream capitalize min-w-[170px] text-center">{monthLabel}</h2>
          <button onClick={nextMonth} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-cream/50 hover:text-cream transition-colors"><ChevronRight size={15} /></button>
        </div>
        <button onClick={() => exportCSV(monthTx)} className="flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-xl bg-white/5 text-cream/40 hover:text-cream hover:bg-white/10 transition-colors border border-white/8">
          <Download size={13} /> CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3"><span className="label">SALDO</span><div className="p-2 rounded-xl" style={{ backgroundColor: (monthBalance>=0?'var(--green)':'var(--red)')+'20' }}><Wallet size={13} style={{ color: monthBalance>=0?'var(--green)':'var(--red)' }} /></div></div>
          <p className="font-bold text-3xl" style={{ color: monthBalance>=0?'var(--green)':'var(--red)' }}>{fmt(monthBalance)}</p>
          <p className="text-xs text-cream/30 mt-1">Poupança: <span className="text-cream/60">{savingsRate}%</span></p>
        </Card>
        <Card><div className="flex items-center justify-between mb-3"><span className="label">RECEITAS</span><div className="p-2 rounded-xl bg-accent-teal/10"><TrendingUp size={13} className="text-accent-teal" /></div></div><p className="font-bold text-2xl text-accent-teal">{fmt(monthIncome)}</p><p className="text-xs text-cream/30 mt-1">{monthTx.filter((t)=>t.type==='income').length} entradas</p></Card>
        <Card><div className="flex items-center justify-between mb-3"><span className="label">DESPESAS</span><div className="p-2 rounded-xl bg-accent-rose/10"><TrendingDown size={13} className="text-accent-rose" /></div></div><p className="font-bold text-2xl text-accent-rose">{fmt(monthExpense)}</p><p className="text-xs text-cream/30 mt-1">{monthTx.filter((t)=>t.type==='expense').length} saídas</p></Card>
        <Card><span className="label block mb-3">MAIOR GASTO</span>{catEntries.length>0?(<><p className="font-semibold text-base text-cream">{catEntries[0][0]}</p><p className="font-mono text-accent-rose text-lg font-bold mt-1">{fmt(catEntries[0][1])}</p></>):<p className="text-cream/30 text-sm mt-2">—</p>}</Card>
      </div>

      {/* Charts */}
      <Card>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h3 className="font-semibold text-cream">Análise Visual</h3>
          <div className="flex gap-1 bg-ink-muted/70 p-1 rounded-xl">
            {[{id:'area',label:'📈 Fluxo'},{id:'bar',label:'📊 Categ.'},{id:'donut',label:'🍩 Proporção'}].map(({id,label})=>(
              <button key={id} onClick={()=>setActiveChart(id)} className={`text-xs font-mono px-3 py-1.5 rounded-lg transition-colors ${activeChart===id?'font-bold':''}`}>{label}</button>
            ))}
          </div>
        </div>
        <div className="min-h-[130px]">
          {activeChart==='area'&&(<div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div><p className="label mb-3">RECEITAS/SEMANA</p><AreaChart data={weeks.map((w)=>w.income)} labels={weeks.map((w)=>w.label)} color="var(--teal)" height={90}/></div><div><p className="label mb-3">DESPESAS/SEMANA</p><AreaChart data={weeks.map((w)=>w.expense)} labels={weeks.map((w)=>w.label)} color="var(--red)" height={90}/></div></div>)}
          {activeChart==='bar'&&(<div>{barData.length===0?<p className="text-cream/30 text-sm text-center py-8">Sem despesas</p>:<BarChart data={barData} height={130} formatValue={fmtShort}/>}</div>)}
          {activeChart==='donut'&&(<div className="py-2">{donutData.length===0?<p className="text-cream/30 text-sm text-center py-8">Sem dados</p>:<DonutChart segments={donutData} size={150} thickness={28} centerLabel={fmt(monthBalance)} centerSub="SALDO"/>}</div>)}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={()=>openModal('income')}><span className="flex items-center gap-2"><Plus size={15}/>Receita</span></Button>
        <button onClick={()=>openModal('expense')} className="btn-ghost flex items-center gap-2"><Plus size={15}/>Despesa</button>
        <div className="flex gap-2 ml-auto flex-wrap">
          {['all','income','expense'].map((f)=>(
            <button key={f} onClick={()=>setTypeFilter(f)}
              className="text-xs font-mono px-3 py-1.5 rounded-xl border transition-all"
              style={typeFilter===f ? {background:'var(--blue-bg)',color:'var(--blue)',borderColor:'var(--blue-border)'} : {background:'var(--bg-muted)',color:'var(--text-3)',borderColor:'var(--border-md)'}}>
              {{all:'Todas',income:'📈 Receitas',expense:'📉 Despesas'}[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-2">
          {filtered.length===0?<EmptyState icon={DollarSign} title="Nenhuma transação" description="Adicione receitas ou despesas"/>:
            filtered.map((tx)=><TransactionRow key={tx.id} tx={tx} onDelete={()=>deleteTransaction(tx.id)}/>)}
        </div>
        <Card className="h-fit">
          <h3 className="font-semibold text-cream mb-4">Por Categoria</h3>
          {catEntries.length===0?<p className="text-sm text-cream/30 text-center py-4">Sem despesas</p>:
            <div className="space-y-3">{catEntries.slice(0,7).map(([cat,val],i)=>{
              const pct=monthExpense>0?(val/monthExpense)*100:0;
              const c=CAT_COLORS[i%CAT_COLORS.length];
              return(<div key={cat}><div className="flex justify-between text-xs mb-1.5"><span className="text-cream/60 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{backgroundColor:c}}/>{cat}</span><span className="font-mono text-cream/50">{fmt(val)}</span></div><div className="h-1.5 bg-ink-muted rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{width:`${pct}%`,backgroundColor:c}}/></div></div>);
            })}</div>}
        </Card>
      </div>

      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={form.type==='income'?'+ Receita':'− Despesa'}>
        <div className="space-y-4">
          <div className="flex gap-2 bg-ink-muted p-1 rounded-xl">
            {['expense','income'].map((t)=>(<button key={t} onClick={()=>setForm({...form,type:t,category:t==='expense'?'Alimentação':'Salário'})} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${form.type===t?(t==='income'?'bg-accent-teal text-ink':'bg-accent-rose text-white'):'text-cream/40 hover:text-cream'}`}>{t==='income'?'📈 Receita':'📉 Despesa'}</button>))}
          </div>
          <Input label="Descrição *" placeholder={form.type==='income'?'Ex: Salário':'Ex: Mercado'} value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})}/>
          <Input label="Valor (R$) *" type="number" min="0" step="0.01" placeholder="0,00" value={form.amount} onChange={(e)=>setForm({...form,amount:e.target.value})}/>
          <Select label="Categoria" value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})}>{(form.type==='income'?CATEGORIES_INCOME:CATEGORIES_EXPENSE).map((c)=><option key={c} value={c}>{c}</option>)}</Select>
          <Textarea label="Observações" placeholder="Opcional..." value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})}/>
          <div className="flex gap-3 pt-2"><Button className="flex-1" onClick={handleAdd}>Salvar</Button><Button variant="ghost" onClick={()=>setModalOpen(false)}>Cancelar</Button></div>
        </div>
      </Modal>
    </motion.div>
  );
}

function TransactionRow({ tx, onDelete }) {
  const isIncome = tx.type==='income';
  return (
    <div className="flex items-center gap-4 p-4 bg-ink-muted/40 border border-white/[0.06] rounded-xl hover:border-white/12 transition-colors group">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{backgroundColor:(isIncome?'var(--teal)':'var(--red)')+'20'}}>
        {isIncome?<TrendingUp size={15} className="text-accent-teal"/>:<TrendingDown size={15} className="text-accent-rose"/>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-cream truncate">{tx.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-mono text-cream/30">{tx.category}</span>
          <span className="text-xs text-cream/20">·</span>
          <span className="text-xs font-mono text-cream/25">{new Date(tx.date).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
      <p className="font-bold text-base shrink-0" style={{color:isIncome?'var(--teal)':'var(--red)'}}>{isIncome?'+':'−'} {fmt(tx.amount)}</p>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-accent-rose/15 text-cream/30 hover:text-accent-rose transition-all"><Trash2 size={14}/></button>
    </div>
  );
}
