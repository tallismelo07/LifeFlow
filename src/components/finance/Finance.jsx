// src/components/finance/Finance.jsx — módulo financeiro completo com cartões
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Modal, Input, Button, Select, EmptyState } from '../ui';
import { BarChart, DonutChart, AreaChart } from '../ui/Charts';
import {
  Plus, Trash2, Pencil, CreditCard, TrendingUp, TrendingDown,
  Wallet, ChevronLeft, ChevronRight, Download, PiggyBank,
  LayoutGrid, List, X, AlertCircle,
} from 'lucide-react';

// ── Constantes ────────────────────────────────────────────────────────────────
const EXPENSE_CATEGORIES = [
  'Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação',
  'Lazer', 'Roupas', 'Tecnologia', 'Assinaturas', 'Outros',
];
const INCOME_CATEGORIES  = ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Outros'];

const CARD_COLORS = [
  { label: 'Roxo',    value: '#820AD1' },
  { label: 'Laranja', value: '#EA580C' },
  { label: 'Azul',    value: '#2563EB' },
  { label: 'Vermelho',value: '#DC2626' },
  { label: 'Verde',   value: '#16A34A' },
  { label: 'Preto',   value: '#1A1A2E' },
  { label: 'Rosa',    value: '#DB2777' },
  { label: 'Dourado', value: '#92400E' },
  { label: 'Teal',    value: '#0D9488' },
  { label: 'Índigo',  value: '#4F46E5' },
];

const BLANK_TX   = { type: 'expense', amount: '', category: '', description: '', cardId: '', date: '' };
const BLANK_CARD = { name: '', bank: '', type: 'credit', last4: '', limit: '', closingDay: '', dueDay: '', color: '#820AD1' };

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const CAT_COLORS = ['var(--red)','var(--amber)','var(--blue)','var(--green)','var(--violet)','var(--teal)','#F59E0B','#EC4899','#6366F1','#14B8A6'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt      = (n) => Number(n||0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
const fmtShort = (n) => { const v=Math.abs(Number(n||0)); return v>=1000 ? `R$\u00a0${(v/1000).toFixed(1)}k` : `R$\u00a0${v.toFixed(0)}`; };
const monthKey = (d)  => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const txMonth  = (tx) => tx.date ? tx.date.slice(0,7) : '';

// ── CardVisual ────────────────────────────────────────────────────────────────
function CardVisual({ card, spent=0, onClick, onDelete, mini=false }) {
  const limit   = Number(card.limit)||0;
  const usedPct = limit>0 ? Math.min((spent/limit)*100,100) : 0;
  const danger  = usedPct>80;

  if (mini) {
    return (
      <motion.div
        onClick={onClick}
        whileHover={{ scale:1.03, y:-2 }} whileTap={{ scale:0.97 }}
        className="relative shrink-0 cursor-pointer rounded-2xl overflow-hidden select-none"
        style={{ width:200, height:120, background:`linear-gradient(135deg,${card.color}ee,${card.color}77)`, boxShadow:`0 8px 24px ${card.color}40` }}
      >
        <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ position:'absolute', bottom:-15, left:-15, width:60, height:60, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
        <div className="relative p-4 flex flex-col h-full">
          <div className="flex justify-between items-start">
            <span className="text-white font-bold text-sm truncate">{card.name||card.bank}</span>
            <span className="text-[10px] font-bold text-white/60 uppercase px-1.5 py-0.5 rounded" style={{ background:'rgba(0,0,0,0.25)' }}>
              {card.type==='credit'?'Créd':'Déb'}
            </span>
          </div>
          <div className="font-mono text-white/70 text-xs mt-auto mb-1">•••• {card.last4||'••••'}</div>
          {card.type==='credit' && limit>0 && (
            <div>
              <div className="flex justify-between text-[10px] text-white/60 mb-1">
                <span>{fmtShort(spent)}</span><span>{fmtShort(limit)}</span>
              </div>
              <div style={{ height:3, background:'rgba(255,255,255,0.2)', borderRadius:2 }}>
                <div style={{ height:'100%', width:`${usedPct}%`, background:danger?'#EF4444':'white', borderRadius:2, transition:'width 0.4s' }} />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div whileHover={{ y:-3 }} className="relative rounded-2xl overflow-hidden"
      style={{ aspectRatio:'1.7', background:`linear-gradient(135deg,${card.color}ee,${card.color}77)`, boxShadow:`0 12px 32px ${card.color}30` }}>
      <div style={{ position:'absolute', top:-30, right:-30, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.07)' }} />
      <div style={{ position:'absolute', bottom:-20, left:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
      <div className="relative p-5 flex flex-col h-full">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-white text-base">{card.bank||card.name}</p>
            {card.name !== card.bank && <p className="text-white/60 text-xs mt-0.5">{card.name}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/70 uppercase px-2 py-1 rounded-lg" style={{ background:'rgba(0,0,0,0.25)' }}>
              {card.type==='credit'?'CRÉDITO':'DÉBITO'}
            </span>
            {onDelete && (
              <button onClick={onDelete} className="p-1.5 rounded-lg" style={{ background:'rgba(0,0,0,0.2)', color:'rgba(255,255,255,0.6)' }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>
        <div className="font-mono text-white/80 text-lg tracking-widest mt-4">•••• •••• •••• {card.last4||'••••'}</div>
        <div className="mt-auto">
          {card.type==='credit' && limit>0 ? (
            <>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-white/70">{fmt(spent)} utilizado</span>
                <span className="text-white/50">Limite {fmt(limit)}</span>
              </div>
              <div style={{ height:4, background:'rgba(255,255,255,0.18)', borderRadius:3 }}>
                <motion.div initial={{ width:0 }} animate={{ width:`${usedPct}%` }} transition={{ duration:0.6, ease:'easeOut' }}
                  style={{ height:'100%', background:danger?'#EF4444':'rgba(255,255,255,0.9)', borderRadius:3 }} />
              </div>
              {danger && (
                <div className="flex items-center gap-1 mt-1.5 text-[11px]" style={{ color:'#FCA5A5' }}>
                  <AlertCircle size={10}/> {usedPct.toFixed(0)}% do limite utilizado
                </div>
              )}
              <div className="flex justify-between mt-2 text-[11px] text-white/50">
                {card.closingDay && <span>Fecha dia {card.closingDay}</span>}
                {card.dueDay    && <span>Vence dia {card.dueDay}</span>}
              </div>
            </>
          ) : (
            <p className="text-white/50 text-xs">{card.type==='credit'?'Sem limite cadastrado':'Cartão de débito'}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── TabOverview ───────────────────────────────────────────────────────────────
function TabOverview({ transactions, cards, currentMonth, onSetTab }) {
  const mk      = monthKey(currentMonth);
  const monthTx = transactions.filter((t) => txMonth(t)===mk);
  const income  = monthTx.filter((t) => t.type==='income').reduce((s,t)  => s+Number(t.amount),0);
  const expense = monthTx.filter((t) => t.type==='expense').reduce((s,t) => s+Number(t.amount),0);
  const balance = income - expense;
  const savingsRate = income>0 ? Math.max(0,Math.round((balance/income)*100)) : 0;

  const spentByCard = {};
  monthTx.filter((t) => t.type==='expense' && t.cardId).forEach((t) => {
    spentByCard[t.cardId] = (spentByCard[t.cardId]||0)+Number(t.amount);
  });

  const recent = [...transactions].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,6);

  const kpis = [
    { label:'Saldo do Mês',    value:fmt(balance),       icon:Wallet,      color:balance>=0?'var(--green)':'var(--red)',  bg:balance>=0?'var(--green-bg)':'color-mix(in srgb,var(--red) 10%,transparent)' },
    { label:'Receitas',        value:fmt(income),         icon:TrendingUp,  color:'var(--green)',  bg:'var(--green-bg)' },
    { label:'Despesas',        value:fmt(expense),        icon:TrendingDown,color:'var(--red)',    bg:'color-mix(in srgb,var(--red) 10%,transparent)' },
    { label:'Taxa de Poupança',value:`${savingsRate}%`,   icon:PiggyBank,   color:savingsRate>=20?'var(--green)':savingsRate>=10?'var(--amber)':'var(--text-3)', bg:'var(--bg-muted)' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <motion.div key={k.label} initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }}
              className="p-4 rounded-2xl border" style={{ background:k.bg, borderColor:'var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono" style={{ color:'var(--text-4)' }}>{k.label}</span>
                <Icon size={14} style={{ color:k.color }} />
              </div>
              <p className="font-bold text-lg" style={{ color:k.color }}>{k.value}</p>
            </motion.div>
          );
        })}
      </div>

      {cards.length>0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="label">MEUS CARTÕES</span>
            <button onClick={() => onSetTab('cards')} className="text-xs font-mono" style={{ color:'var(--text-4)' }}>Ver todos →</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth:'none' }}>
            {cards.map((c) => <CardVisual key={c.id} card={c} spent={spentByCard[c.id]||0} mini onClick={() => onSetTab('cards')} />)}
            <motion.button onClick={() => onSetTab('cards')} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
              className="shrink-0 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2"
              style={{ width:200, height:120, borderColor:'var(--border-md)', color:'var(--text-4)' }}>
              <Plus size={20}/><span className="text-xs font-mono">Novo cartão</span>
            </motion.button>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="label">ÚLTIMAS TRANSAÇÕES</span>
          <button onClick={() => onSetTab('transactions')} className="text-xs font-mono" style={{ color:'var(--text-4)' }}>Ver todas →</button>
        </div>
        {recent.length===0 ? (
          <p className="py-8 text-center text-sm" style={{ color:'var(--text-4)' }}>Nenhuma transação ainda.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((tx) => {
              const card = cards.find((c) => c.id===tx.cardId);
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                  style={{ background:'var(--bg-soft)', borderColor:'var(--border)' }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background:tx.type==='income'?'var(--green)':'var(--red)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color:'var(--text)' }}>{tx.description||tx.category}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color:'var(--text-4)' }}>{tx.category}</span>
                      {card && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background:card.color+'20', color:card.color }}>{card.name} •••{card.last4}</span>}
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-sm" style={{ color:tx.type==='income'?'var(--green)':'var(--red)' }}>
                    {tx.type==='income'?'+':'-'}{fmt(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── TabTransactions ───────────────────────────────────────────────────────────
function TabTransactions({ transactions, cards, addTransaction, deleteTransaction, currentMonth, setCurrentMonth }) {
  const [modalOpen,  setModalOpen]  = useState(false);
  const [form,       setForm]       = useState(BLANK_TX);
  const [typeFilter, setTypeFilter] = useState('all');
  const [cardFilter, setCardFilter] = useState('all');

  const mk = monthKey(currentMonth);
  const goMonth = (dir) => { const d=new Date(currentMonth); d.setMonth(d.getMonth()+dir); setCurrentMonth(d); };

  const monthTx = transactions
    .filter((t) => txMonth(t)===mk)
    .filter((t) => typeFilter==='all' || t.type===typeFilter)
    .filter((t) => cardFilter==='all' || t.cardId===cardFilter)
    .sort((a,b) => new Date(b.date)-new Date(a.date));

  const income  = monthTx.filter((t) => t.type==='income').reduce((s,t)  => s+Number(t.amount),0);
  const expense = monthTx.filter((t) => t.type==='expense').reduce((s,t) => s+Number(t.amount),0);

  const byDate  = monthTx.reduce((acc,tx) => { const d=tx.date||'Sem data'; (acc[d]=acc[d]||[]).push(tx); return acc; }, {});
  const dates   = Object.keys(byDate).sort((a,b) => b.localeCompare(a));

  const openModal = () => { setForm({ ...BLANK_TX, date:new Date().toISOString().split('T')[0] }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.amount || !form.category) return;
    addTransaction({ ...form, amount:parseFloat(String(form.amount).replace(',','.')), date:form.date||new Date().toISOString().split('T')[0] });
    setModalOpen(false);
  };

  const exportCSV = () => {
    const rows = [['Data','Tipo','Categoria','Descrição','Valor','Cartão'],
      ...monthTx.map((t) => { const c=cards.find((c)=>c.id===t.cardId); return [t.date,t.type==='income'?'Receita':'Despesa',t.category,t.description||'',t.amount,c?c.name:'']; })];
    const blob = new Blob([rows.map((r)=>r.join(';')).join('\n')], { type:'text/csv;charset=utf-8;' });
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`lifeflow-${mk}.csv`; a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={()=>goMonth(-1)} className="p-2 rounded-xl" style={{ background:'var(--bg-muted)',color:'var(--text-3)',border:'1px solid var(--border)' }}><ChevronLeft size={16}/></button>
          <span className="font-bold text-base min-w-[130px] text-center" style={{ color:'var(--text)' }}>
            {MONTHS_PT[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button onClick={()=>goMonth(1)} className="p-2 rounded-xl" style={{ background:'var(--bg-muted)',color:'var(--text-3)',border:'1px solid var(--border)' }}><ChevronRight size={16}/></button>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="p-2 rounded-xl" style={{ background:'var(--bg-muted)',color:'var(--text-3)',border:'1px solid var(--border)' }} title="Exportar CSV"><Download size={15}/></button>
          <Button onClick={openModal}><span className="flex items-center gap-2"><Plus size={15}/> Transação</span></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl flex items-center gap-3 border" style={{ background:'var(--green-bg)',borderColor:'var(--green-border)' }}>
          <TrendingUp size={16} style={{ color:'var(--green)' }}/>
          <div><p className="text-xs" style={{ color:'var(--text-4)' }}>Receitas</p><p className="font-bold text-sm" style={{ color:'var(--green)' }}>{fmt(income)}</p></div>
        </div>
        <div className="p-3 rounded-xl flex items-center gap-3 border" style={{ background:'color-mix(in srgb,var(--red) 8%,transparent)',borderColor:'color-mix(in srgb,var(--red) 20%,transparent)' }}>
          <TrendingDown size={16} style={{ color:'var(--red)' }}/>
          <div><p className="text-xs" style={{ color:'var(--text-4)' }}>Despesas</p><p className="font-bold text-sm" style={{ color:'var(--red)' }}>{fmt(expense)}</p></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all','income','expense'].map((t) => (
          <button key={t} onClick={()=>setTypeFilter(t)} className="text-xs font-mono px-3 py-1.5 rounded-xl border transition-all"
            style={typeFilter===t?{background:'var(--blue)',color:'var(--on-blue)',borderColor:'var(--blue)'}:{background:'transparent',color:'var(--text-4)',borderColor:'var(--border)'}}>
            {{all:'Todas',income:'Receitas',expense:'Despesas'}[t]}
          </button>
        ))}
        {cards.length>0 && <>
          <div className="w-px self-stretch" style={{ background:'var(--border)' }}/>
          <button onClick={()=>setCardFilter('all')} className="text-xs font-mono px-3 py-1.5 rounded-xl border transition-all"
            style={cardFilter==='all'?{background:'var(--bg-raised)',color:'var(--text)',borderColor:'var(--border-md)'}:{background:'transparent',color:'var(--text-4)',borderColor:'var(--border)'}}>
            Todos
          </button>
          {cards.map((c) => (
            <button key={c.id} onClick={()=>setCardFilter(cardFilter===c.id?'all':c.id)} className="text-xs font-mono px-3 py-1.5 rounded-xl border transition-all"
              style={cardFilter===c.id?{background:c.color+'25',color:c.color,borderColor:c.color+'60'}:{background:'transparent',color:'var(--text-4)',borderColor:'var(--border)'}}>
              •••{c.last4||'??'}
            </button>
          ))}
        </>}
      </div>

      {monthTx.length===0 ? (
        <EmptyState icon={Wallet} title="Sem transações" description="Adicione receitas e despesas do mês"/>
      ) : (
        <div className="space-y-5">
          {dates.map((date) => (
            <div key={date}>
              <p className="text-xs font-mono mb-2" style={{ color:'var(--text-4)' }}>
                {date!=='Sem data' ? new Date(date+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'}) : 'Sem data'}
              </p>
              <div className="space-y-2">
                {byDate[date].map((tx) => {
                  const card = cards.find((c)=>c.id===tx.cardId);
                  return (
                    <motion.div key={tx.id} initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border group"
                      style={{ background:'var(--bg-soft)',borderColor:'var(--border)' }}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background:tx.type==='income'?'var(--green)':'var(--red)' }}/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color:'var(--text)' }}>{tx.description||tx.category}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs" style={{ color:'var(--text-4)' }}>{tx.category}</span>
                          {card && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background:card.color+'20',color:card.color }}>{card.name} •••{card.last4}</span>}
                        </div>
                      </div>
                      <span className="font-mono font-semibold text-sm" style={{ color:tx.type==='income'?'var(--green)':'var(--red)' }}>
                        {tx.type==='income'?'+':'-'}{fmt(tx.amount)}
                      </span>
                      <button onClick={()=>deleteTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg ml-1 transition-opacity" style={{ color:'var(--text-4)' }}>
                        <Trash2 size={13}/>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title="Nova Transação">
        <div className="space-y-4">
          <div className="flex gap-2 p-1 rounded-xl" style={{ background:'var(--bg-muted)',border:'1px solid var(--border)' }}>
            {[{v:'expense',l:'Despesa'},{v:'income',l:'Receita'}].map(({v,l})=>(
              <button key={v} onClick={()=>setForm({...form,type:v,category:''})}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={form.type===v?{background:v==='expense'?'var(--red)':'var(--green)',color:'#fff'}:{color:'var(--text-3)'}}>
                {l}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="label">VALOR *</label>
              <input type="number" step="0.01" min="0" placeholder="0,00" value={form.amount}
                onChange={(e)=>setForm({...form,amount:e.target.value})} className="input-base" autoFocus/>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label">DATA</label>
              <input type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})}
                className="input-base" style={{ colorScheme:'dark' }}/>
            </div>
          </div>
          <Select label="Categoria *" value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})}>
            <option value="">Selecione...</option>
            {(form.type==='income'?INCOME_CATEGORIES:EXPENSE_CATEGORIES).map((c)=>(<option key={c} value={c}>{c}</option>))}
          </Select>
          <Input label="Descrição" placeholder="Ex: iFood, Aluguel..." value={form.description}
            onChange={(e)=>setForm({...form,description:e.target.value})}/>
          {cards.length>0 && (
            <Select label="Cartão (opcional)" value={form.cardId} onChange={(e)=>setForm({...form,cardId:e.target.value})}>
              <option value="">Sem cartão / Dinheiro</option>
              {cards.map((c)=>(<option key={c.id} value={c.id}>{c.name} •••{c.last4}</option>))}
            </Select>
          )}
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleSave}>Adicionar</Button>
            <Button variant="ghost" onClick={()=>setModalOpen(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── TabCards ──────────────────────────────────────────────────────────────────
function TabCards({ cards, transactions, addCard, updateCard, deleteCard }) {
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form,       setForm]       = useState(BLANK_CARD);

  const currentMk = monthKey(new Date());
  const spentByCard = {};
  transactions.filter((t)=>t.type==='expense'&&t.cardId&&txMonth(t)===currentMk)
    .forEach((t)=>{ spentByCard[t.cardId]=(spentByCard[t.cardId]||0)+Number(t.amount); });

  const openCreate = () => { setEditTarget(null); setForm(BLANK_CARD); setModalOpen(true); };
  const openEdit   = (c) => {
    setEditTarget(c.id);
    setForm({ name:c.name, bank:c.bank||'', type:c.type, last4:c.last4||'', limit:c.limit||'', closingDay:c.closingDay||'', dueDay:c.dueDay||'', color:c.color });
    setModalOpen(true);
  };
  const handleSave = () => {
    if (!form.name.trim()) return;
    const payload = { ...form, limit:form.limit?Number(form.limit):0, closingDay:form.closingDay?Number(form.closingDay):null, dueDay:form.dueDay?Number(form.dueDay):null };
    editTarget ? updateCard(editTarget,payload) : addCard(payload);
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="label">{cards.length} {cards.length===1?'CARTÃO':'CARTÕES'}</span>
        <Button onClick={openCreate}><span className="flex items-center gap-2"><Plus size={15}/> Novo Cartão</span></Button>
      </div>

      {cards.length===0 ? (
        <div className="py-16 text-center space-y-3">
          <CreditCard size={40} style={{ color:'var(--text-4)', margin:'0 auto' }}/>
          <p className="font-semibold text-sm" style={{ color:'var(--text)' }}>Nenhum cartão cadastrado</p>
          <p className="text-xs" style={{ color:'var(--text-4)' }}>Adicione cartões de crédito e débito para rastrear seus gastos automaticamente</p>
          <div className="flex justify-center mt-2">
            <Button onClick={openCreate}><span className="flex items-center gap-2"><Plus size={15}/> Adicionar Cartão</span></Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((c) => (
            <div key={c.id} className="space-y-3">
              <CardVisual card={c} spent={spentByCard[c.id]||0} onDelete={()=>deleteCard(c.id)}/>
              <div className="flex items-center gap-2">
                <button onClick={()=>openEdit(c)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border"
                  style={{ color:'var(--text-3)',borderColor:'var(--border)',background:'var(--bg-muted)' }}>
                  <Pencil size={11}/> Editar
                </button>
                {c.type==='credit' && Number(c.limit)>0 && (
                  <span className="text-xs" style={{ color:'var(--text-4)' }}>
                    {fmt(Number(c.limit)-(spentByCard[c.id]||0))} disponível
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editTarget?'Editar Cartão':'Novo Cartão'}>
        <div className="space-y-4">
          <CardVisual card={{ ...form, limit:Number(form.limit)||0 }} spent={0}/>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nome *" placeholder="Ex: Nubank Roxo" value={form.name}
              onChange={(e)=>setForm({...form,name:e.target.value})} autoFocus/>
            <Input label="Banco / Emissor" placeholder="Ex: Nubank, Itaú" value={form.bank}
              onChange={(e)=>setForm({...form,bank:e.target.value})}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipo" value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})}>
              <option value="credit">Crédito</option>
              <option value="debit">Débito</option>
            </Select>
            <Input label="Últimos 4 dígitos" placeholder="1234" maxLength={4} value={form.last4}
              onChange={(e)=>setForm({...form,last4:e.target.value.replace(/\D/g,'').slice(0,4)})}/>
          </div>
          {form.type==='credit' && (
            <div className="grid grid-cols-3 gap-3">
              <Input label="Limite (R$)" type="number" placeholder="5000" value={form.limit}
                onChange={(e)=>setForm({...form,limit:e.target.value})}/>
              <Input label="Dia fechamento" type="number" placeholder="15" min={1} max={31} value={form.closingDay}
                onChange={(e)=>setForm({...form,closingDay:e.target.value})}/>
              <Input label="Dia vencimento" type="number" placeholder="22" min={1} max={31} value={form.dueDay}
                onChange={(e)=>setForm({...form,dueDay:e.target.value})}/>
            </div>
          )}
          <div>
            <span className="label block mb-2">COR DO CARTÃO</span>
            <div className="flex gap-2 flex-wrap">
              {CARD_COLORS.map(({label,value})=>(
                <button key={value} title={label} onClick={()=>setForm({...form,color:value})}
                  className="w-8 h-8 rounded-xl border-2 transition-all"
                  style={{ background:value, borderColor:form.color===value?'var(--text)':'transparent', transform:form.color===value?'scale(1.15)':'scale(1)' }}/>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleSave}>{editTarget?'Salvar':'Adicionar Cartão'}</Button>
            <Button variant="ghost" onClick={()=>setModalOpen(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── TabAnalytics ──────────────────────────────────────────────────────────────
function TabAnalytics({ transactions, cards }) {
  const now = new Date();
  const months = Array.from({length:6},(_,i)=>{ const d=new Date(now.getFullYear(),now.getMonth()-(5-i),1); return { key:monthKey(d),label:MONTHS_PT[d.getMonth()] }; });

  const incomeByMonth  = months.map((m)=>transactions.filter((t)=>t.type==='income'  && txMonth(t)===m.key).reduce((s,t)=>s+Number(t.amount),0));
  const expenseByMonth = months.map((m)=>transactions.filter((t)=>t.type==='expense' && txMonth(t)===m.key).reduce((s,t)=>s+Number(t.amount),0));

  const mk        = monthKey(now);
  const expTx     = transactions.filter((t)=>t.type==='expense' && txMonth(t)===mk);
  const totalExp  = expTx.reduce((s,t)=>s+Number(t.amount),0);
  const byCat     = expTx.reduce((acc,t)=>{ acc[t.category]=(acc[t.category]||0)+Number(t.amount); return acc; },{});
  const catSegs   = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([label,value],i)=>({ label,value,color:CAT_COLORS[i%CAT_COLORS.length] }));

  const spentByCard = cards.map((c)=>({
    label:c.name, value:transactions.filter((t)=>t.type==='expense'&&t.cardId===c.id&&txMonth(t)===mk).reduce((s,t)=>s+Number(t.amount),0), color:c.color,
  })).filter((x)=>x.value>0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl border" style={{ background:'var(--bg-soft)',borderColor:'var(--border)' }}>
          <p className="text-xs mb-3" style={{ color:'var(--text-4)' }}>RECEITAS — ÚLTIMOS 6 MESES</p>
          <BarChart data={months.map((m,i)=>({label:m.label,value:incomeByMonth[i]}))} color="var(--green)" height={100} formatValue={fmtShort}/>
        </div>
        <div className="p-4 rounded-2xl border" style={{ background:'var(--bg-soft)',borderColor:'var(--border)' }}>
          <p className="text-xs mb-3" style={{ color:'var(--text-4)' }}>DESPESAS — ÚLTIMOS 6 MESES</p>
          <BarChart data={months.map((m,i)=>({label:m.label,value:expenseByMonth[i]}))} color="var(--red)" height={100} formatValue={fmtShort}/>
        </div>
      </div>

      <div className="p-4 rounded-2xl border" style={{ background:'var(--bg-soft)',borderColor:'var(--border)' }}>
        <p className="text-xs mb-3" style={{ color:'var(--text-4)' }}>SALDO MENSAL — ÚLTIMOS 6 MESES</p>
        <AreaChart data={months.map((_,i)=>incomeByMonth[i]-expenseByMonth[i])} labels={months.map((m)=>m.label)} color="var(--blue)" height={80}/>
      </div>

      <div className="p-4 rounded-2xl border" style={{ background:'var(--bg-soft)',borderColor:'var(--border)' }}>
        <p className="text-xs mb-4" style={{ color:'var(--text-4)' }}>DESPESAS POR CATEGORIA — MÊS ATUAL</p>
        {catSegs.length===0 ? (
          <p className="text-sm text-center py-4" style={{ color:'var(--text-4)' }}>Sem despesas registradas este mês</p>
        ) : (
          <DonutChart segments={catSegs} size={140} thickness={22} centerLabel={fmtShort(totalExp)} centerSub="total"/>
        )}
      </div>

      {spentByCard.length>0 && (
        <div className="p-4 rounded-2xl border" style={{ background:'var(--bg-soft)',borderColor:'var(--border)' }}>
          <p className="text-xs mb-4" style={{ color:'var(--text-4)' }}>GASTOS POR CARTÃO — MÊS ATUAL</p>
          <BarChart data={spentByCard} height={100} formatValue={fmtShort}/>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
const TABS = [
  { id:'overview',     label:'Visão Geral', icon:LayoutGrid  },
  { id:'transactions', label:'Transações',  icon:List        },
  { id:'cards',        label:'Cartões',     icon:CreditCard  },
  { id:'analytics',    label:'Análise',     icon:TrendingUp  },
];

export default function Finance() {
  const { transactions, addTransaction, deleteTransaction, cards, addCard, updateCard, deleteCard } = useApp();
  const [activeTab,     setActiveTab]     = useState('overview');
  const [currentMonth,  setCurrentMonth]  = useState(new Date());

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <motion.div initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }}
        className="flex gap-1 p-1 rounded-2xl w-fit"
        style={{ background:'var(--bg-muted)',border:'1px solid var(--border)' }}>
        {TABS.map(({ id,label,icon:Icon }) => (
          <button key={id} onClick={()=>setActiveTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={activeTab===id?{background:'var(--blue)',color:'var(--on-blue)'}:{color:'var(--text-3)'}}>
            <Icon size={14}/>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity:0,y:6 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-6 }} transition={{ duration:0.18 }}>
          {activeTab==='overview'     && <TabOverview transactions={transactions} cards={cards} currentMonth={currentMonth} onSetTab={setActiveTab}/>}
          {activeTab==='transactions' && <TabTransactions transactions={transactions} cards={cards} addTransaction={addTransaction} deleteTransaction={deleteTransaction} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth}/>}
          {activeTab==='cards'        && <TabCards cards={cards} transactions={transactions} addCard={addCard} updateCard={updateCard} deleteCard={deleteCard}/>}
          {activeTab==='analytics'    && <TabAnalytics transactions={transactions} cards={cards}/>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
