
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line
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
  ListTodo,
  PieChart as PieIcon,
  Layout
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

  // --- CÁLCULOS DE PRODUTIVIDADE ---
  const completedTasks = appointments.filter(a => a.status === 'completed').length;
  const pendingTasks = appointments.length - completedTasks;
  const completionRate = appointments.length > 0 ? Math.round((completedTasks / appointments.length) * 100) : 0;
  
  // --- CÁLCULOS FINANCEIROS ---
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgExpense = expenses.length > 0 ? Math.round(totalSpent / expenses.length) : 0;

  // Agregação Financeira por Categoria
  const expenseByCategory = expenses.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const pieData = Object.keys(expenseByCategory).map(name => ({
    name,
    value: expenseByCategory[name]
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-100 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <ListTodo size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">Tarefa</span>
          </div>
          <p className="text-3xl font-black text-slate-800">{completionRate}%</p>
          <p className="text-xs text-slate-500 font-medium">Conclusão de Agenda</p>
          <div className="w-full bg-slate-100 h-1.5 mt-4 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-blue-100 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <DollarSign size={20} />
            </div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Financeiro</span>
          </div>
          <p className="text-2xl font-black text-slate-800">R$ {totalSpent.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-slate-500 font-medium">Total de Despesas</p>
          <div className="mt-4 flex items-center text-[10px] text-blue-600 font-bold">
            <TrendingUp size={12} className="mr-1" /> Média: R$ {avgExpense} por item
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-amber-100 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded">Agenda</span>
          </div>
          <p className="text-3xl font-black text-slate-800">{pendingTasks}</p>
          <p className="text-xs text-slate-500 font-medium">Itens Pendentes</p>
          <button onClick={() => setInnerTab('agenda')} className="mt-4 text-[10px] text-amber-600 font-bold flex items-center hover:translate-x-1 transition-transform">
            Ver Detalhes <ArrowRight size={10} className="ml-1" />
          </button>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-purple-100 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Gift size={20} />
            </div>
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-2 py-0.5 rounded">Social</span>
          </div>
          <p className="text-3xl font-black text-slate-800">{birthdays.length}</p>
          <p className="text-xs text-slate-500 font-medium">Aniversários Salvos</p>
          <div className="flex -space-x-2 mt-4">
            {birthdays.slice(0, 5).map((b, i) => (
              <img key={i} src={`https://picsum.photos/seed/${b.id}/32/32`} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" alt="" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Financeiro */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <PieIcon className="mr-2 text-emerald-600" size={22} />
              Gastos por Categoria
            </h3>
          </div>
          <div className="h-80 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <div className="bg-slate-50 p-6 rounded-full mb-4">
                  <DollarSign size={48} className="opacity-20" />
                </div>
                <p className="text-sm font-medium">Nenhum dado financeiro disponível.</p>
              </div>
            )}
          </div>
        </div>

        {/* Alertas Urgentes */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <AlertTriangle className="mr-2 text-red-500" size={22} />
            Prioridades do Dia
          </h3>
          <div className="space-y-4">
            {appointments.filter(a => a.urgent && a.status === 'pending').length > 0 ? (
              appointments.filter(a => a.urgent && a.status === 'pending').map(app => (
                <div key={app.id} className="p-4 bg-red-50/50 rounded-2xl border border-red-100 group hover:bg-red-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-tighter mb-1">Urgente</p>
                    <Clock size={12} className="text-red-400" />
                  </div>
                  <p className="text-sm font-bold text-red-900 leading-tight mb-2">{app.description}</p>
                  <p className="text-[10px] text-red-700 font-bold bg-white w-fit px-2 py-1 rounded-full shadow-sm">
                    {new Date(app.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-16 text-center">
                 <div className="bg-emerald-50 text-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <CheckCircle size={32} />
                 </div>
                 <p className="text-xs text-slate-500 font-medium">Tudo sob controle, Senhor!<br/>Sem pendências urgentes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAgenda = () => (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800">Minha Agenda</h3>
          <p className="text-slate-500 text-sm">Gerencie seus compromissos e tarefas diárias.</p>
        </div>
        <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl">
           <div className="px-4 py-2 bg-white rounded-lg shadow-sm text-xs font-bold text-emerald-700">
             {pendingTasks} Ativas
           </div>
           <div className="px-4 py-2 text-xs font-bold text-slate-500">
             {completedTasks} Feitas
           </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[10px] uppercase text-slate-400 font-black tracking-widest">
            <tr>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5">O que fazer</th>
              <th className="px-8 py-5">Quando</th>
              <th className="px-8 py-5 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {appointments.length > 0 ? (
              [...appointments].sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()).map(app => (
                <tr key={app.id} className={`group transition-all hover:bg-slate-50/50 ${app.status === 'completed' ? 'opacity-40 grayscale' : ''}`}>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => onToggleStatus(app.id)}
                      className={`transition-all transform active:scale-75 ${app.status === 'completed' ? 'text-emerald-500' : 'text-slate-200 hover:text-emerald-300'}`}
                    >
                      {app.status === 'completed' ? <CheckCircle size={26} /> : <Circle size={26} />}
                    </button>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${app.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {app.description}
                      </span>
                      {app.urgent && <span className="text-[10px] text-red-500 font-black uppercase tracking-tighter mt-1">Urgente • Prioridade Alta</span>}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center text-xs text-slate-500 font-bold">
                       <Clock size={12} className="mr-2 opacity-50" />
                       {new Date(app.dateTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => onDeleteAppointment(app.id)}
                      className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-24 text-center">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Calendar size={32} className="text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-medium italic text-sm">Sua agenda está vazia no momento.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFinances = () => (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800">Relatório Geral de Despesas</h3>
          <p className="text-slate-500 text-sm">Controle seus gastos e organize seu orçamento.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-6 py-3 bg-blue-600 text-white rounded-2xl shadow-blue-200 shadow-lg">
             <span className="text-[10px] uppercase font-black block leading-none mb-1 opacity-70">Gasto Total</span>
             <span className="text-xl font-black leading-none tracking-tight">R$ {totalSpent.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/30">
         {Object.entries(expenseByCategory).map(([cat, val]: any, idx) => (
           <div key={cat} className="p-5 bg-white rounded-2xl shadow-sm border border-slate-100 group hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{cat}</p>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
              </div>
              <p className="text-xl font-black text-slate-800">R$ {val.toLocaleString('pt-BR')}</p>
              <div className="w-full bg-slate-50 h-1 mt-3 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-1000" 
                  style={{ backgroundColor: COLORS[idx % COLORS.length], width: `${(val/totalSpent)*100}%` }}
                ></div>
              </div>
           </div>
         ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[10px] uppercase text-slate-400 font-black tracking-widest">
            <tr>
              <th className="px-8 py-5">Data</th>
              <th className="px-8 py-5">Categoria</th>
              <th className="px-8 py-5">Descrição</th>
              <th className="px-8 py-5">Valor</th>
              <th className="px-8 py-5 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {expenses.length > 0 ? (
              [...expenses].reverse().map(exp => (
                <tr key={exp.id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-5 text-xs text-slate-400 font-bold">
                    {new Date(exp.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-slate-700">
                    {exp.description || <span className="text-slate-300 italic">Sem descrição</span>}
                  </td>
                  <td className="px-8 py-5 text-base font-black text-slate-900">
                    R$ {exp.amount.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-24 text-center">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                     <DollarSign size={32} className="text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-medium italic text-sm">Nenhuma despesa registrada.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 md:p-10 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
            <Layout size={14} />
            <span>Painel do Comandante</span>
          </div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Central de Gestão</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Sua rotina organizada por Inteligência Artificial.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex p-1.5 bg-slate-200/50 backdrop-blur-sm rounded-2xl w-full lg:w-fit shadow-inner">
          <button 
            onClick={() => setInnerTab('overview')}
            className={`flex-1 lg:flex-none px-8 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${innerTab === 'overview' ? 'bg-white text-emerald-700 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Geral
          </button>
          <button 
            onClick={() => setInnerTab('agenda')}
            className={`flex-1 lg:flex-none px-8 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${innerTab === 'agenda' ? 'bg-white text-emerald-700 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Agenda
          </button>
          <button 
            onClick={() => setInnerTab('finances')}
            className={`flex-1 lg:flex-none px-8 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${innerTab === 'finances' ? 'bg-white text-emerald-700 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Finanças
          </button>
        </div>
      </div>

      {/* Renderização das Abas */}
      <div className="min-h-[60vh]">
        {innerTab === 'overview' && renderOverview()}
        {innerTab === 'agenda' && renderAgenda()}
        {innerTab === 'finances' && renderFinances()}
      </div>
    </div>
  );
};

export default Dashboard;
