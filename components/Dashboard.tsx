
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { AppState, Appointment, Transaction, SavingsGoal } from '../types';
import { 
  Calendar, DollarSign, Clock, Trash2, CheckCircle, Circle,
  TrendingUp, ListTodo, PieChart as PieIcon, Layout, ArrowUpCircle, ArrowDownCircle, Wallet, Target, Repeat, Activity, ShoppingCart, List
} from 'lucide-react';

interface Props {
  state: AppState;
  onToggleStatus: (id: string) => void;
  onDeleteAppointment: (id: string) => void;
  onDeleteExpense: (id: string) => void;
}

const Dashboard: React.FC<Props> = ({ state, onToggleStatus, onDeleteAppointment, onDeleteExpense }) => {
  const [innerTab, setInnerTab] = useState<'overview' | 'agenda' | 'goals' | 'finances'>('overview');
  const { appointments, transactions, goals, monthlyBudget } = state;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
    } catch { return dateStr; }
  };

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const healthScore = income > 0 ? Math.min(Math.round((Math.max(0, balance) / income) * 100), 100) : 0;

  const recurringExpenses = transactions.filter(t => t.type === 'expense' && t.isRecurring);

  const pieData = Object.entries(
    transactions.filter(t => t.type === 'expense').reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Saúde Financeira</p>
            <h3 className={`text-5xl font-black ${healthScore > 60 ? 'text-emerald-500' : 'text-amber-500'}`}>{healthScore}</h3>
          </div>
          <Activity size={48} className="text-slate-100" />
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-emerald-50">
          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Saldo</p>
          <p className="text-2xl font-black text-slate-800">R$ {balance.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-blue-50">
          <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Agenda</p>
          <p className="text-2xl font-black text-slate-800">{appointments.filter(a=>a.status==='pending').length} Ativos</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><Clock className="mr-2 text-blue-600" /> Próximas Atividades</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.filter(a => a.status === 'pending').slice(0, 4).map(app => (
            <div key={app.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-slate-700">{app.description}</span>
                {app.items && app.items.length > 0 && <ShoppingCart size={16} className="text-emerald-500" />}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase">{formatDate(app.dateTime)}</p>
              {app.items && app.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Lista Inteligente:</p>
                   <div className="flex flex-wrap gap-1">
                      {app.items.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                          {item.name} ({item.quantity})
                        </span>
                      ))}
                      {app.items.length > 3 && <span className="text-[10px] text-slate-400 font-bold">+{app.items.length - 3} itens</span>}
                   </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAgenda = () => (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom duration-500">
      <div className="p-8 border-b flex justify-between items-center">
        <h3 className="text-2xl font-black text-slate-800">Minha Agenda</h3>
        <button onClick={() => setInnerTab('agenda')} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-600"><ListTodo size={20} /></button>
      </div>
      <div className="p-4 space-y-4">
        {appointments.map(app => (
          <div key={app.id} className={`p-6 rounded-3xl border transition-all ${app.status === 'completed' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button onClick={() => onToggleStatus(app.id)} className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${app.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent hover:border-emerald-400'}`}>
                  <CheckCircle size={18} />
                </button>
                <div>
                  <h4 className={`font-bold ${app.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{app.description}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase">{formatDate(app.dateTime)}</p>
                </div>
              </div>
              <button onClick={() => onDeleteAppointment(app.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
            </div>
            
            {app.items && app.items.length > 0 && (
              <div className="ml-12 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <div className="flex items-center space-x-2 mb-4">
                  <ShoppingCart size={14} className="text-emerald-600" />
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Lista de Itens Necessários</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {app.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-emerald-100/50 shadow-sm">
                      <span className="text-sm font-bold text-slate-700">{item.name}</span>
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <h3 className="text-2xl font-black text-slate-800 flex items-center mb-8"><Target size={28} className="mr-2 text-blue-500" /> Metas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(goal => (
            <div key={goal.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="flex justify-between mb-4">
                <h4 className="font-bold text-slate-800">{goal.title}</h4>
                <span className="text-xs font-black text-blue-600 uppercase">{Math.round((goal.currentAmount/goal.targetAmount)*100)}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{width: `${(goal.currentAmount/goal.targetAmount)*100}%`}}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFinances = () => (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b bg-slate-50/30">
        <h3 className="text-2xl font-black text-slate-800">Fluxo Financeiro</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-black tracking-widest">
            <tr><th className="px-8 py-5">Data</th><th className="px-8 py-5">Categoria</th><th className="px-8 py-5">Valor</th><th className="px-8 py-5 text-right">Ação</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions.slice().reverse().map(t => (
              <tr key={t.id} className="group">
                <td className="px-8 py-5 text-xs font-bold text-slate-400">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                <td className="px-8 py-5">
                  <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase text-slate-600">{t.category}</span>
                </td>
                <td className={`px-8 py-5 font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR')}
                </td>
                <td className="px-8 py-5 text-right"><button onClick={() => onDeleteExpense(t.id)} className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 md:p-10 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2"><Layout size={14} /><span>Ecossistema SV</span></div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Painel de Gestão</h2>
        </div>
        <div className="flex p-1.5 bg-slate-200/50 rounded-2xl w-full lg:w-fit">
          {['overview', 'agenda', 'goals', 'finances'].map(t => (
            <button key={t} onClick={() => setInnerTab(t as any)} className={`flex-1 px-8 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${innerTab === t ? 'bg-white text-emerald-700 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
              {t === 'overview' ? 'Geral' : t === 'agenda' ? 'Agenda' : t === 'goals' ? 'Metas' : 'Finanças'}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-[60vh]">
        {innerTab === 'overview' && renderOverview()}
        {innerTab === 'agenda' && renderAgenda()}
        {innerTab === 'goals' && renderGoals()}
        {innerTab === 'finances' && renderFinances()}
      </div>
    </div>
  );
};

export default Dashboard;
