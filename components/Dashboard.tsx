
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { AppState, Appointment, Expense } from '../types';
import { 
  Calendar, 
  DollarSign, 
  Gift, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  CheckCircle, 
  Circle,
  TrendingUp,
  Filter,
  ArrowRight,
  ListTodo
} from 'lucide-react';

interface Props {
  state: AppState;
  onToggleStatus: (id: string) => void;
  onDeleteAppointment: (id: string) => void;
  onDeleteExpense: (id: string) => void;
}

const Dashboard: React.FC<Props> = ({ state, onToggleStatus, onDeleteAppointment, onDeleteExpense }) => {
  const [innerTab, setInnerTab] = useState<'overview' | 'agenda' | 'finances'>('overview');
  const { appointments, expenses, birthdays } = state;

  // Calculos de Resumo
  const completedTasks = appointments.filter(a => a.status === 'completed').length;
  const pendingTasks = appointments.length - completedTasks;
  const completionRate = appointments.length > 0 ? Math.round((completedTasks / appointments.length) * 100) : 0;
  
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgExpense = expenses.length > 0 ? Math.round(totalSpent / expenses.length) : 0;

  // Agregação Financeira para Gráfico
  const expenseByCategory = expenses.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const chartData = Object.keys(expenseByCategory).map(name => ({
    name,
    value: expenseByCategory[name]
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Produtividade</span>
            <ListTodo size={18} className="text-emerald-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-gray-800">{completionRate}%</p>
            <p className="text-xs text-gray-400">Tarefas concluídas</p>
          </div>
          <div className="w-full bg-gray-100 h-1.5 mt-4 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Gastos Mensais</span>
            <TrendingUp size={18} className="text-blue-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-gray-800">R$ {totalSpent.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-gray-400">{expenses.length} Transações totais</p>
          </div>
          <p className="text-[10px] text-blue-500 mt-4 font-medium flex items-center">
            Ticket Médio: R$ {avgExpense}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Calendário</span>
            <Clock size={18} className="text-amber-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-gray-800">{pendingTasks}</p>
            <p className="text-xs text-gray-400">Compromissos pendentes</p>
          </div>
          <button onClick={() => setInnerTab('agenda')} className="text-[10px] text-amber-600 mt-4 font-bold flex items-center hover:underline">
            Ver agenda completa <ArrowRight size={10} className="ml-1" />
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-purple-50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Aniversários</span>
            <Gift size={18} className="text-purple-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-gray-800">{birthdays.length}</p>
            <p className="text-xs text-gray-400">Contatos mapeados</p>
          </div>
          <div className="flex -space-x-2 mt-4">
            {birthdays.slice(0, 4).map(b => (
              <img key={b.id} src={`https://picsum.photos/seed/${b.id}/30/30`} className="w-6 h-6 rounded-full border-2 border-white" alt="" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <DollarSign className="mr-2 text-emerald-600" size={20} />
            Resumo Financeiro por Categoria
          </h3>
          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={24}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="bg-gray-50 p-4 rounded-full mb-3">
                  <DollarSign size={32} className="opacity-20" />
                </div>
                <p className="text-sm">Nenhum gasto registrado para análise.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <AlertTriangle className="mr-2 text-red-500" size={20} />
            Alertas de Hoje
          </h3>
          <div className="space-y-3">
            {appointments.filter(a => a.urgent && a.status === 'pending').length > 0 ? (
              appointments.filter(a => a.urgent && a.status === 'pending').map(app => (
                <div key={app.id} className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-tighter mb-1">Urgente</p>
                  <p className="text-sm font-semibold text-red-900 leading-tight">{app.description}</p>
                  <div className="flex items-center mt-2 text-[10px] text-red-700 font-medium">
                    <Clock size={10} className="mr-1" />
                    {new Date(app.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center">
                 <div className="bg-emerald-50 text-emerald-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={24} />
                 </div>
                 <p className="text-xs text-gray-500">Sem alertas críticos no momento.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAgenda = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">Gerenciador de Agenda</h3>
        <div className="flex space-x-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest">{pendingTasks} Pendentes</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-bold">
            <tr>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Compromisso</th>
              <th className="px-6 py-4">Horário</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {appointments.length > 0 ? (
              [...appointments].sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()).map(app => (
                <tr key={app.id} className={`group hover:bg-gray-50 transition-colors ${app.status === 'completed' ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => onToggleStatus(app.id)}
                      className={`transition-transform transform active:scale-90 ${app.status === 'completed' ? 'text-emerald-500' : 'text-gray-300 hover:text-emerald-400'}`}
                    >
                      {app.status === 'completed' ? <CheckCircle size={22} /> : <Circle size={22} />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`text-sm font-semibold ${app.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {app.description}
                    </p>
                    {app.urgent && <span className="text-[10px] text-red-500 font-bold uppercase">Urgente</span>}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                    {new Date(app.dateTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onDeleteAppointment(app.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-20 text-center text-gray-400 italic text-sm">Nenhum compromisso agendado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFinances = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">Relatório de Despesas</h3>
        <div className="flex space-x-2">
          <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl">
             <span className="text-[10px] uppercase font-bold block leading-none mb-1 opacity-70">Total Acumulado</span>
             <span className="text-lg font-black leading-none">R$ {totalSpent.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50/50">
         {Object.entries(expenseByCategory).map(([cat, val]: any) => (
           <div key={cat} className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{cat}</p>
              <p className="text-lg font-bold text-gray-800">R$ {val.toLocaleString('pt-BR')}</p>
           </div>
         ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-bold">
            <tr>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4">Valor</th>
              <th className="px-6 py-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {expenses.length > 0 ? (
              [...expenses].reverse().map(exp => (
                <tr key={exp.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                    {new Date(exp.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-600">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {exp.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-gray-900">
                    R$ {exp.amount.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-20 text-center text-gray-400 italic text-sm">Sem registros de despesas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Central de Gestão</h2>
          <p className="text-slate-500 text-sm font-medium">Controle sua rotina com inteligência e precisão.</p>
        </div>
        
        {/* Dashboard Tabs Navigation */}
        <div className="flex p-1 bg-slate-200 rounded-2xl w-fit">
          <button 
            onClick={() => setInnerTab('overview')}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${innerTab === 'overview' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Visão Geral
          </button>
          <button 
            onClick={() => setInnerTab('agenda')}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${innerTab === 'agenda' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Agenda
          </button>
          <button 
            onClick={() => setInnerTab('finances')}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${innerTab === 'finances' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Finanças
          </button>
        </div>
      </div>

      {/* Render Active Dashboard Tab */}
      {innerTab === 'overview' && renderOverview()}
      {innerTab === 'agenda' && renderAgenda()}
      {innerTab === 'finances' && renderFinances()}
    </div>
  );
};

export default Dashboard;
