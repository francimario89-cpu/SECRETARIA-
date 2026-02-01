
import React, { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { AppState, Appointment, Transaction, SavingsGoal, Habit, Task } from '../types';
import { 
  Calendar, Clock, Trash2, CheckCircle, Circle,
  TrendingUp, ListTodo, Layout, Activity, ShoppingCart, 
  Droplets, Dumbbell, Zap, Target, ArrowUpRight, CheckSquare, BrainCircuit, Info
} from 'lucide-react';

interface Props {
  state: AppState;
  onToggleStatus: (id: string) => void;
  onDeleteAppointment: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onToggleTask: (id: string) => void;
}

const Dashboard: React.FC<Props> = ({ state, onToggleStatus, onDeleteAppointment, onDeleteExpense, onToggleTask }) => {
  const [innerTab, setInnerTab] = useState<'overview' | 'routine' | 'finances'>('overview');
  const { appointments, transactions, goals, habits, tasks } = state;

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const healthScore = income > 0 ? Math.min(Math.round((Math.max(0, balance) / income) * 100), 100) : 0;

  const aiInsight = useMemo(() => {
    if (healthScore < 30) return "Atenção: Seu score financeiro está baixo. Evite gastos extras hoje.";
    if (balance > 1000 && goals.length > 0) return `Você tem R$ ${balance} sobrando. Que tal investir na sua meta "${goals[0].title}"?`;
    if (habits.some(h => (h.current / h.target) < 0.5)) return "Dica de Saúde: Você ainda não atingiu metade das suas metas de hidratação/exercício hoje.";
    return "Tudo sob controle! Suas listas de mercado agora consideram embalagens comerciais.";
  }, [healthScore, balance, goals, habits]);

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-[2rem] shadow-lg text-white flex items-center space-x-4">
        <div className="bg-white/20 p-3 rounded-2xl"><BrainCircuit size={24} /></div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Insight da sua Secretária</p>
          <p className="text-sm font-bold leading-tight">{aiInsight}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-6">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Saúde Financeira</p>
            <Activity size={20} className="text-emerald-500" />
          </div>
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-3xl font-black text-slate-800">{healthScore}</span>
              <span className="text-[8px] font-black text-slate-400 uppercase">Score</span>
            </div>
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
              <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-emerald-500" strokeDasharray={364} strokeDashoffset={364 - (364 * healthScore) / 100} strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center"><Zap className="mr-2 text-amber-500" /> Rotina de Hoje</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habits.map(h => (
              <div key={h.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    {h.name === 'Água' ? <Droplets className="text-blue-500" size={18} /> : <Dumbbell className="text-emerald-500" size={18} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">{h.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{h.current} / {h.target} {h.unit}</p>
                  </div>
                </div>
                <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${Math.min((h.current/h.target)*100, 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center"><ShoppingCart className="mr-2 text-emerald-600" /> Listas de Mercado Recentes</h3>
        <div className="space-y-4">
          {appointments.filter(a => a.items && a.items.length > 0).slice(0, 2).map(app => (
            <div key={app.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase mb-3">{app.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {app.items?.map((item, i) => (
                  <div key={i} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-black text-slate-800 truncate">{item.name}</p>
                    <div className="flex justify-between mt-2">
                      <div className="text-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Usar</p>
                        <p className="text-[10px] font-bold text-blue-600">{item.quantity}</p>
                      </div>
                      <div className="text-center border-l border-slate-100 pl-3">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Comprar</p>
                        <p className="text-[10px] font-black text-emerald-600">{item.marketQuantity || item.quantity}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRoutine = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center"><CheckSquare className="mr-2 text-purple-600" /> Lista de Tarefas</h3>
          <div className="space-y-3">
            {tasks.map(t => (
              <div key={t.id} className={`flex items-center justify-between p-4 rounded-2xl border ${t.completed ? 'bg-slate-50 opacity-50' : 'bg-white shadow-sm border-slate-100'}`}>
                <div className="flex items-center space-x-3">
                  <button onClick={() => onToggleTask(t.id)} className={t.completed ? 'text-emerald-500' : 'text-slate-300'}><CheckCircle size={20} /></button>
                  <span className={`text-sm font-bold ${t.completed ? 'line-through' : ''}`}>{t.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center"><Calendar className="mr-2 text-blue-600" /> Agenda & Compras</h3>
          <div className="space-y-4">
            {appointments.map(app => (
              <div key={app.id} className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100">
                <h4 className="font-black text-slate-800 text-sm mb-2">{app.description}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-4">{new Date(app.dateTime).toLocaleString('pt-BR')}</p>
                {app.items && app.items.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <Info size={12} className="text-emerald-500" />
                      <span className="text-[9px] font-black text-emerald-700 uppercase">Guia de Compras vs Uso:</span>
                    </div>
                    {app.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-700">{item.name}</span>
                        <div className="flex space-x-4">
                          <span className="text-[9px] font-bold text-slate-400">Receita: <span className="text-blue-600">{item.quantity}</span></span>
                          <span className="text-[9px] font-black text-slate-400">Mercado: <span className="text-emerald-600">{item.marketQuantity}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinances = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-10">
       <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 mb-6">Transações</h3>
          <div className="space-y-3">
            {transactions.slice().reverse().map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-xl bg-white shadow-sm ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {t.type === 'income' ? <ArrowUpRight size={18} /> : <TrendingUp size={18} className="rotate-180" />}
                  </div>
                  <p className="text-sm font-bold text-slate-700">{t.category}</p>
                </div>
                <p className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>R$ {t.amount}</p>
              </div>
            ))}
          </div>
       </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 md:p-10 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2"><Layout size={14} /><span>Ecossistema SV Executivo</span></div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Painel de Performance</h2>
        </div>
        <div className="flex p-1.5 bg-slate-200/50 rounded-2xl w-full lg:w-fit backdrop-blur-sm">
          {['overview', 'routine', 'finances'].map(t => (
            <button key={t} onClick={() => setInnerTab(t as any)} className={`flex-1 px-8 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${innerTab === t ? 'bg-white text-emerald-700 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
              {t === 'overview' ? 'Geral' : t === 'routine' ? 'Rotina' : 'Finanças'}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-[60vh]">
        {innerTab === 'overview' && renderOverview()}
        {innerTab === 'routine' && renderRoutine()}
        {innerTab === 'finances' && renderFinances()}
      </div>
    </div>
  );
};

export default Dashboard;
