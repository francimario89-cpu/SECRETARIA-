
import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  LayoutDashboard, 
  Calendar, 
  DollarSign, 
  Gift, 
  Send, 
  MoreVertical, 
  CheckCircle2, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { AppState, Message, Appointment, Expense, Birthday } from './types';
import { getSecretaryResponse } from './services/geminiService';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('secretary_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        messages: parsed.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
      };
    }
    return {
      appointments: [],
      expenses: [],
      birthdays: [],
      messages: [
        {
          id: 'initial',
          role: 'model',
          text: 'Bom dia, Senhor. Que a sua jornada seja abençoada! "O Senhor é o meu pastor, nada me faltará" (Salmos 23:1). Como posso ajudá-lo hoje?',
          timestamp: new Date()
        }
      ]
    };
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('secretary_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const toggleAppointmentStatus = (id: string) => {
    setState(prev => ({
      ...prev,
      appointments: prev.appointments.map(app => 
        app.id === id ? { ...app, status: app.status === 'completed' ? 'pending' : 'completed' } : app
      )
    }));
  };

  const deleteAppointment = (id: string) => {
    setState(prev => ({
      ...prev,
      appointments: prev.appointments.filter(app => app.id !== id)
    }));
  };

  const deleteExpense = (id: string) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(exp => exp.id !== id)
    }));
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setState(prev => ({ ...prev, messages: [...prev.messages, userMsg] }));
    setInputText('');
    setIsTyping(true);

    const handleTool = (name: string, args: any) => {
      if (name === 'add_appointment') {
        const newAppt: Appointment = {
          id: Math.random().toString(36).substr(2, 9),
          description: args.description,
          dateTime: args.dateTime,
          urgent: !!args.urgent,
          status: 'pending'
        };
        setState(prev => ({ ...prev, appointments: [...prev.appointments, newAppt] }));
      } else if (name === 'add_expense') {
        const newExpense: Expense = {
          id: Math.random().toString(36).substr(2, 9),
          amount: args.amount,
          category: args.category,
          date: new Date().toISOString(),
          description: args.description || ''
        };
        setState(prev => ({ ...prev, expenses: [...prev.expenses, newExpense] }));
      } else if (name === 'add_birthday') {
        const newBday: Birthday = {
          id: Math.random().toString(36).substr(2, 9),
          name: args.name,
          date: args.date,
          relation: args.relation || 'Contato'
        };
        setState(prev => ({ ...prev, birthdays: [...prev.birthdays, newBday] }));
      }
    };

    const aiResponseText = await getSecretaryResponse(inputText, state, handleTool);
    
    setIsTyping(false);
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: aiResponseText,
      timestamp: new Date()
    };
    setState(prev => ({ ...prev, messages: [...prev.messages, aiMsg] }));
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-16 md:w-20 bg-emerald-900 flex flex-col items-center py-6 space-y-8 shadow-2xl z-20">
        <div className="bg-white/10 p-2 rounded-full cursor-pointer hover:bg-white/20 transition-colors">
          <img src="https://picsum.photos/seed/secretary/100/100" className="w-10 h-10 rounded-full" alt="Profile" />
        </div>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`p-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-white/20 text-white shadow-lg' : 'text-emerald-200 hover:text-white hover:bg-white/10'}`}
          title="Conversar"
        >
          <MessageSquare size={24} />
        </button>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-white/20 text-white shadow-lg' : 'text-emerald-200 hover:text-white hover:bg-white/10'}`}
          title="Painel de Gestão"
        >
          <LayoutDashboard size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <header className="bg-emerald-800 text-white p-4 shadow-lg flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img src="https://picsum.photos/seed/secretary/100/100" className="w-10 h-10 rounded-full border-2 border-emerald-400" alt="Secretary" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-emerald-800 rounded-full"></div>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">Secretária Virtual</h1>
              <p className="text-emerald-200 text-[10px] uppercase font-bold tracking-widest">Pronta para Servir</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <button onClick={() => { if(confirm('Deseja limpar todos os dados?')) { localStorage.clear(); window.location.reload(); } }} className="text-emerald-300 hover:text-white text-xs px-2 py-1 rounded border border-emerald-700">Reiniciar</button>
          </div>
        </header>

        {activeTab === 'chat' ? (
          <>
            {/* Chat Messages */}
            <main className="flex-1 overflow-y-auto whatsapp-bg p-4 space-y-4">
              {state.messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl shadow-sm relative group animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                      msg.role === 'user' 
                        ? 'bg-[#dcf8c6] rounded-tr-none' 
                        : 'bg-white rounded-tl-none border border-gray-100'
                    }`}
                  >
                    <p className="text-gray-800 text-sm md:text-base whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <div className="flex justify-end items-center mt-1 space-x-1">
                      <span className="text-[10px] text-gray-500">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.role === 'user' && <CheckCircle2 size={12} className="text-blue-500" />}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 px-5 rounded-full shadow-sm rounded-tl-none italic text-gray-400 text-xs flex items-center space-x-2">
                    <div className="flex space-x-1">
                       <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                       <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></div>
                       <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></div>
                    </div>
                    <span>Sua secretária está digitando...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </main>

            {/* Input Bar */}
            <footer className="bg-[#f0f2f5] p-3 flex items-center space-x-2 border-t border-gray-200">
              <form className="flex-1 flex items-center space-x-2" onSubmit={handleSendMessage}>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Instrua sua secretária (ex: Agende reunião amanhã às 10h)"
                  className="flex-1 p-3 px-5 rounded-full border-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base outline-none shadow-inner"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`p-3 rounded-full transition-all transform active:scale-95 ${
                    inputText.trim() ? 'bg-emerald-700 text-white shadow-lg hover:bg-emerald-800' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send size={20} />
                </button>
              </form>
            </footer>
          </>
        ) : (
          <Dashboard 
            state={state} 
            onToggleStatus={toggleAppointmentStatus}
            onDeleteAppointment={deleteAppointment}
            onDeleteExpense={deleteExpense}
          />
        )}
      </div>
    </div>
  );
};

export default App;
