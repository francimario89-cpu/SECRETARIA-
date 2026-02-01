
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { AppState, Appointment, Transaction } from '../types';
import { 
  Calendar, DollarSign, Gift, Clock, AlertTriangle, Trash2, CheckCircle, Circle,
  TrendingUp, ArrowRight, ListTodo, PieChart as PieIcon, Layout, ArrowUpCircle, ArrowDownCircle, Wallet
} from 'lucide-react';

interface Props {
  state: AppState;
  onToggleStatus: (id: string) => void;
  onDeleteAppointment: (id: string) => void;
  onDeleteExpense: (id: string) => void;
}

const Dashboard: React.FC<Props> = ({ state, onToggleStatus, onDeleteAppointment, onDeleteExpense }) => {
  const [innerTab, setInnerTab] = useState<'overview' | 'agenda' | 'finances'>('overview');
  const { appointments, transactions, monthlyBudget } = state;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
    } catch { return dateStr; }
  };

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const budgetUsage = monthlyBudget > 0 ? Math.min(Math.round((expense / monthlyBudget) * 100), 100) : 0;
  const safeToSpend = Math.max(monthlyBudget - expense, 0);

  const pieData = Object.entries(
    transactions.filter(t => t.type === 'expense').reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><ArrowUpCircle size={20} /></div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Entradas</span>
          </div>
          <p className="text-2xl font-black text-slate-800">R$ {income.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-slate-400 mt-1">Ganhos totais no mês</p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-red-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-red-50 rounded-lg text-red-600"><ArrowDownCircle size={20} /></div>
            <span className="text-[10px] font-bold text-red-600 uppercase">Saídas</span>
          </div>
          <p className="text-2xl font-black text-slate-800">R$ {expense.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-slate-400 mt-1">Gastos totais no mês</p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Wallet size={20} /></div>
            <span className="text-[10px] font-bold text-blue-600 uppercase">Saldo</span>
          </div>
          <p className={`text-2xl font-black ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>R$ {balance.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-slate-400 mt-1">Dinheiro em mãos</p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-amber-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><TrendingUp size={20} /></div>
            <span className="text-[10px] font-bold text-amber-600 uppercase">Orçamento</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{budgetUsage}%</p>
          <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
            <div className={`h-full transition-all ${budgetUsage > 90 ? 'bg-red-500' : budgetUsage > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${budgetUsage}%` }}></div>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-bold">Livre: R$ {safeToSpend.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><PieIcon className="mr-2 text-emerald-600" /> Gastos por Categoria</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><Clock className="mr-2 text-blue-600" /> Próximos Eventos</h3>
          <div className="space-y-3">
            {appointments.filter(a => a.status === 'pending').slice(0, 4).map(app => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${app.urgent ? 'bg-red-500 animate-pulse' : 'bg-blue-400'}`}></div>
                  <span className="text-sm font-bold text-slate-700">{app.description}</span>
                </div>
                <span className="text-[10px] font-black text-slate-400">{formatDate(app.dateTime)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAgenda = () => (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b flex justify-between items-center">
        <div><h3 className="text-2xl font-black text-slate-800">Minha Agenda</h3></div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black uppercase">{appointments.filter(a=>a.status==='pending').length} Pendentes</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-black">
            <tr><th className="px-8 py-5 text-left">Status</th><th className="px-8 py-5 text-left">O que</th><th className="px-8 py-5 text-left">Quando</th><th className="px-8 py-5 text-right">Ação</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {appointments.map(app => (
              <tr key={app.id} className={app.status === 'completed' ? 'opacity-40' : ''}>
                <td className="px-8 py-5"><button onClick={() => onToggleStatus(app.id)}>{app.status === 'completed' ? <CheckCircle className="text-emerald-500" /> : <Circle className="text-slate-200" />}</button></td>
                <td className="px-8 py-5"><span className="font-bold text-slate-800 text-sm">{app.description}</span></td>
                <td className="px-8 py-5 text-xs text-slate-500 font-bold">{formatDate(app.dateTime)}</td>
                <td className="px-8 py-5 text-right"><button onClick={() => onDeleteAppointment(app.id)} className="text-slate-200 hover:text-red-500"><Trash2 size={18} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFinances = () => (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
        <div><h3 className="text-2xl font-black text-slate-800">Transações do Mês</h3></div>
        <div className="flex gap-2">
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black">ENTRADAS: R$ {income}</div>
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-xs font-black">SAÍDAS: R$ {expense}</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-black">
            <tr><th className="px-8 py-5 text-left">Data</th><th className="px-8 py-5 text-left">Tipo</th><th className="px-8 py-5 text-left">Categoria</th><th className="px-8 py-5 text-left">Valor</th><th className="px-8 py-5 text-right">Ação</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5 text-xs font-bold text-slate-400">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                <td className="px-8 py-5">{t.type === 'income' ? <ArrowUpCircle size={18} className="text-emerald-500" /> : <ArrowDownCircle size={18} className="text-red-500" />}</td>
                <td className="px-8 py-5"><span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black uppercase">{t.category}</span></td>
                <td className="px-8 py-5 font-black text-slate-900">R$ {t.amount.toLocaleString('pt-BR')}</td>
                <td className="px-8 py-5 text-right"><button onClick={() => onDeleteExpense(t.id)} className="text-slate-200 hover:text-red-500"><Trash2 size={18} /></button></td>
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
          <div className="flex items-center space-x-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2"><Layout size={14} /><span>Painel de Controle</span></div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Gestão Inteligente</h2>
        </div>
        <div className="flex p-1 bg-slate-200/50 rounded-2xl w-full lg:w-fit">
          {['overview', 'agenda', 'finances'].map(t => (
            <button key={t} onClick={() => setInnerTab(t as any)} className={`flex-1 px-8 py-2.5 text-xs font-black rounded-xl transition-all uppercase ${innerTab === t ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}>{t === 'overview' ? 'Geral' : t === 'agenda' ? 'Agenda' : 'Finanças'}</button>
          ))}
        </div>
      </div>
      <div className="min-h-[60vh]">{innerTab === 'overview' && renderOverview()}{innerTab === 'agenda' && renderAgenda()}{innerTab === 'finances' && renderFinances()}</div>
    </div>
  );
};

export default Dashboard;
