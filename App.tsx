import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  LayoutDashboard, 
  Send, 
  CheckCircle2, 
  Volume2, 
  VolumeX,
  RefreshCw
} from 'lucide-react';
import { AppState, Message, Appointment, Expense } from './types';
import { getSecretaryResponse, generateSpeech } from './services/geminiService';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('secretary_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          appointments: parsed.appointments || [],
          expenses: parsed.expenses || [],
          birthdays: parsed.birthdays || [],
          messages: (parsed.messages || []).map((m: any) => ({ 
            ...m, 
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date() 
          }))
        };
      }
    } catch (e) {
      console.warn("Limpando cache devido a erro de formato:", e);
      localStorage.removeItem('secretary_state');
    }
    
    return {
      appointments: [],
      expenses: [],
      birthdays: [],
      messages: [
        {
          id: 'initial',
          role: 'model',
          text: 'Bom dia. Sou sua nova Secretária Virtual. Como posso ajudar hoje?',
          timestamp: new Date()
        }
      ]
    };
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('secretary_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const playAudio = async (base64: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.error("Erro ao reproduzir áudio:", e);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setState(prev => ({ ...prev, messages: [...prev.messages, userMsg] }));
    const currentInput = inputText;
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
      }
    };

    try {
      const aiResponseText = await getSecretaryResponse(currentInput, state, handleTool);
      setIsTyping(false);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiResponseText,
        timestamp: new Date()
      };
      setState(prev => ({ ...prev, messages: [...prev.messages, aiMsg] }));

      if (isVoiceEnabled) {
        const audio = await generateSpeech(aiResponseText);
        if (audio) playAudio(audio);
      }
    } catch (error) {
      console.error("Erro na resposta da IA:", error);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden flex-col md:flex-row">
      {/* Sidebar - Fixa na lateral no PC, no rodapé no Mobile */}
      <div className="w-full md:w-20 bg-emerald-950 flex md:flex-col items-center justify-around md:justify-start md:py-6 md:space-y-8 shadow-2xl z-20 order-2 md:order-1 h-16 md:h-full">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`p-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-white/20 text-white' : 'text-emerald-200 hover:text-white'}`}
        >
          <MessageSquare size={24} />
        </button>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-white/20 text-white' : 'text-emerald-200 hover:text-white'}`}
        >
          <LayoutDashboard size={24} />
        </button>
        <button 
          onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
          className={`p-3 rounded-xl transition-all ${isVoiceEnabled ? 'bg-emerald-500 text-white' : 'text-emerald-200 hover:text-white'}`}
          title={isVoiceEnabled ? "Voz Ativada" : "Voz Desativada"}
        >
          {isVoiceEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden order-1 md:order-2">
        <header className="bg-emerald-800 text-white p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center border-2 border-emerald-400 font-bold">SV</div>
            <div>
              <h1 className="font-bold text-sm md:text-lg">Secretária Virtual</h1>
              <p className="text-emerald-200 text-[10px] uppercase font-bold tracking-tighter">Pronta para servir</p>
            </div>
          </div>
          <button onClick={() => window.location.reload()} className="p-2 text-emerald-300 hover:text-white transition-colors">
            <RefreshCw size={18} />
          </button>
        </header>

        {activeTab === 'chat' ? (
          <>
            <main className="flex-1 overflow-y-auto whatsapp-bg p-4 space-y-4">
              {state.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                    <p className="text-gray-800 text-sm md:text-base whitespace-pre-wrap">{msg.text}</p>
                    <div className="flex justify-end items-center mt-1 space-x-1">
                      <span className="text-[10px] text-gray-500">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.role === 'user' && <CheckCircle2 size={12} className="text-blue-500" />}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-xs text-emerald-800 bg-white/70 backdrop-blur w-fit px-3 py-1 rounded-full animate-pulse font-medium shadow-sm">Secretária está processando...</div>}
              <div ref={chatEndRef} />
            </main>

            <footer className="bg-[#f0f2f5] p-3 flex items-center border-t border-gray-200">
              <form className="flex-1 flex items-center space-x-2" onSubmit={handleSendMessage}>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Instrua sua secretária..."
                  className="flex-1 p-3 px-5 rounded-full outline-none shadow-sm text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim() || isTyping}
                  className={`p-3 rounded-full transition-all shadow-md ${!inputText.trim() || isTyping ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-95'}`}
                >
                  <Send size={20} />
                </button>
              </form>
            </footer>
          </>
        ) : (
          <Dashboard 
            state={state} 
            onToggleStatus={(id) => {
              setState(prev => ({
                ...prev,
                appointments: prev.appointments.map(a => a.id === id ? { ...a, status: a.status === 'completed' ? 'pending' : 'completed' } : a)
              }));
            }} 
            onDeleteAppointment={(id) => {
              setState(prev => ({ ...prev, appointments: prev.appointments.filter(a => a.id !== id) }));
            }} 
            onDeleteExpense={(id) => {
              setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
            }} 
          />
        )}
      </div>
    </div>
  );
};

export default App;