
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { AppState, Appointment, Transaction, SavingsGoal } from '../types';
import { 
  Calendar, DollarSign, Clock, Trash2, CheckCircle, Circle,
  TrendingUp, ListTodo, PieChart as PieIcon, Layout, ArrowUpCircle, ArrowDownCircle, Wallet, Target, Repeat, Activity
} from 'lucide-react';

interface Props {
  state: AppState;
  onToggleStatus: (id: string) => void;
  onDeleteAppointment: (id: string) => void;
  onDeleteExpense: (id: string) => void;
}

const Dashboard: React.FC<Props> = ({ state, onToggleStatus, onDeleteAppointment, onDeleteExpense }) => {
  const [innerTab, setInnerTab] = useState<'overview' | 'goals' | 'finances'>('overview');
  const { appointments, transactions, goals, monthlyBudget } = state;

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  
  // Cálculo de Saúde Financeira (Guiabolso style)
  const savings = Math.max(0, balance);
  const healthScore = income > 0 ? Math.min(Math.round((savings / income) * 100), 100) : 0;

  const recurringExpenses = transactions.filter(t => t.type === 'expense' && t.isRecurring);

  const pieData = Object.entries(
    transactions.filter(t => t.type === 'expense').reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const getScoreColor = (score: number) => {
    if (score > 60) return 'text-emerald-500';
    if (score > 30) return 'text-amber-500';
    return 'text-red-500';
  };

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Score de Saúde */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden">
          <div className="z-10">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Saúde Financeira</p>
            <h3 className={`text-5xl font-black ${getScoreColor(healthScore)}`}>{healthScore}</h3>
            <p className="text-xs font-medium text-slate-500 mt-2">
              {healthScore > 60 ? "Excelente! Você está poupando bem." : 
               healthScore > 30 ? "Bom, mas pode melhorar sua reserva." : 
               "Alerta: Você está gastando quase tudo que ganha."}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-full text-slate-300">
            <Activity size={48} strokeWidth={3} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-emerald-50">
          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Disponível</p>
          <p className="text-2xl font-black text-slate-800">R$ {balance.toLocaleString('pt-BR')}</p>
          <div className="mt-4 flex items-center text-[10px] font-bold text-emerald-500">
            <TrendingUp size={12} className="mr-1" /> Saldo atual
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-blue-50">
          <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Metas</p>
          <p className="text-2xl font-black text-slate-800">{goals.length}</p>
          <button onClick={() => setInnerTab('goals')} className="mt-4 text-[10px] font-bold text-blue-500 hover:underline">Ver progresso</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><PieIcon className="mr-2 text-emerald-600" /> Distribuição de Gastos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><Repeat className="mr-2 text-purple-600" /> Gastos Fixos</h3>
          <div className="space-y-4">
            {recurringExpenses.length > 0 ? recurringExpenses.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">{t.description}</p>
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-tighter">{t.category} • Mensal</p>
                </div>
                <span className="text-sm font-black text-slate-700">R$ {t.amount}</span>
              </div>
            )) : <p className="text-sm text-slate-400 italic text-center py-10">Nenhum gasto fixo registrado.</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black text-slate-800 flex items-center"><Target size={28} className="mr-2 text-blue-500" /> Metas de Poupança</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IA monitorando {goals.length} objetivos</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.length > 0 ? goals.map(goal => {
            const progress = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
            return (
              <div key={goal.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-blue-200 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-slate-800">{goal.title}</h4>
                  <span className="text-[10px] font-black bg-white px-3 py-1 rounded-full shadow-sm text-blue-600 uppercase">{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-4">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-1000 group-hover:bg-blue-600" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Guardado</p>
                    <p className="text-lg font-black text-slate-700">R$ {goal.currentAmount.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Objetivo</p>
                    <p className="text-sm font-bold text-slate-500">R$ {goal.targetAmount.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-2 py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={40} className="text-slate-200" />
              </div>
              <p className="text-slate-500 font-medium">Você ainda não definiu metas financeiras.<br/><span className="text-sm text-slate-400">Tente dizer: "Quero economizar 10 mil para meu casamento"</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderFinances = () => (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b flex justify-between items-center bg-slate-50/30">
        <div><h3 className="text-2xl font-black text-slate-800">Extrato Consolidado</h3></div>
        <div className="flex gap-2">
          <div className="bg-emerald-50 text-emerald-700 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-sm">Entradas: R$ {income}</div>
          <div className="bg-red-50 text-red-700 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-sm">Saídas: R$ {expense}</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-black tracking-widest">
            <tr><th className="px-8 py-5">Data</th><th className="px-8 py-5">Tipo</th><th className="px-8 py-5">Categoria</th><th className="px-8 py-5">Valor</th><th className="px-8 py-5 text-right">Ação</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions.slice().reverse().map(t => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-5 text-xs font-bold text-slate-400">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                <td className="px-8 py-5">
                  <div className="flex items-center">
                    {t.type === 'income' ? <ArrowUpCircle size={18} className="text-emerald-500 mr-2" /> : <ArrowDownCircle size={18} className="text-red-500 mr-2" />}
                    {t.isRecurring && <Repeat size={12} className="text-purple-400" title="Recorrente" />}
                  </div>
                </td>
                <td className="px-8 py-5"><span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase text-slate-600">{t.category}</span></td>
                <td className="px-8 py-5 font-black text-slate-800">R$ {t.amount.toLocaleString('pt-BR')}</td>
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
          <div className="flex items-center space-x-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2"><Layout size={14} /><span>Ecossistema de IA</span></div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Painel Executivo</h2>
        </div>
        <div className="flex p-1.5 bg-slate-200/50 rounded-2xl w-full lg:w-fit backdrop-blur-sm">
          {['overview', 'goals', 'finances'].map(t => (
            <button key={t} onClick={() => setInnerTab(t as any)} className={`flex-1 px-8 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${innerTab === t ? 'bg-white text-emerald-700 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
              {t === 'overview' ? 'Saúde' : t === 'goals' ? 'Metas' : 'Extrato'}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-[60vh]">{innerTab === 'overview' && renderOverview()}{innerTab === 'goals' && renderGoals()}{innerTab === 'finances' && renderFinances()}</div>
    </div>
  );
};

export default Dashboard;
