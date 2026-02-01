
import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, LayoutDashboard, Send, CheckCircle2, Volume2, VolumeX, RefreshCw, BellRing
} from 'lucide-react';
import { AppState, Message, Appointment, Transaction } from './types';
import { getSecretaryResponse, generateSpeech } from './services/geminiService';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('secretary_state_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        messages: parsed.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
      };
    }
    return {
      appointments: [],
      transactions: [],
      monthlyBudget: 0,
      birthdays: [],
      messages: [{ id: '1', role: 'model', text: 'Olá! Sou sua assistente. Vamos organizar suas finanças e sua agenda hoje?', timestamp: new Date() }]
    };
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const lastReminderRef = useRef<string | null>(null);

  useEffect(() => {
    localStorage.setItem('secretary_state_v2', JSON.stringify(state));
  }, [state]);

  // Sistema Proativo de Lembretes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      state.appointments.forEach(app => {
        const appDate = new Date(app.dateTime);
        const diff = appDate.getTime() - now.getTime();
        
        // Se faltar menos de 15 minutos e for hoje
        if (app.status === 'pending' && diff > 0 && diff < 15 * 60 * 1000) {
          if (lastReminderRef.current !== app.id) {
            const reminderMsg: Message = {
              id: `rem-${Date.now()}`,
              role: 'model',
              text: `🚨 LEMBRETE PROATIVO: "${app.description}" está agendado para as ${appDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}.`,
              timestamp: new Date()
            };
            setState(prev => ({ ...prev, messages: [...prev.messages, reminderMsg] }));
            lastReminderRef.current = app.id;
            if (isVoiceEnabled) generateSpeech(reminderMsg.text).then(b => b && playAudio(b));
          }
        }
      });
    }, 30000); // Checa a cada 30 segundos
    return () => clearInterval(interval);
  }, [state.appointments, isVoiceEnabled]);

  const playAudio = async (base64: string) => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    const ctx = audioContextRef.current;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: inputText, timestamp: new Date() };
    setState(prev => ({ ...prev, messages: [...prev.messages, userMsg] }));
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    const handleTool = (name: string, args: any) => {
      if (name === 'add_appointment') {
        const newAppt: Appointment = { id: Math.random().toString(36).substr(2, 9), description: args.description, dateTime: args.dateTime, urgent: !!args.urgent, status: 'pending' };
        setState(prev => ({ ...prev, appointments: [...prev.appointments, newAppt] }));
      } else if (name === 'add_transaction') {
        const newTrans: Transaction = { id: Math.random().toString(36).substr(2, 9), amount: args.amount, type: args.type, category: args.category, date: new Date().toISOString(), description: args.description || '' };
        setState(prev => ({ ...prev, transactions: [...prev.transactions, newTrans] }));
      } else if (name === 'set_budget') {
        setState(prev => ({ ...prev, monthlyBudget: args.amount }));
      }
    };

    const aiResponseText = await getSecretaryResponse(currentInput, state, handleTool);
    setIsTyping(false);
    const aiMsg: Message = { id: (Date.now()+1).toString(), role: 'model', text: aiResponseText, timestamp: new Date() };
    setState(prev => ({ ...prev, messages: [...prev.messages, aiMsg] }));
    if (isVoiceEnabled) {
      const audio = await generateSpeech(aiResponseText);
      if (audio) playAudio(audio);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden flex-col md:flex-row">
      <div className="w-full md:w-20 bg-emerald-950 flex md:flex-col items-center justify-around md:justify-start md:py-6 md:space-y-8 shadow-2xl z-20 order-2 md:order-1 h-16 md:h-full">
        <button onClick={() => setActiveTab('chat')} className={`p-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-white/20 text-white' : 'text-emerald-200 hover:text-white'}`}><MessageSquare size={24} /></button>
        <button onClick={() => setActiveTab('dashboard')} className={`p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-white/20 text-white' : 'text-emerald-200 hover:text-white'}`}><LayoutDashboard size={24} /></button>
        <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} className={`p-3 rounded-xl transition-all ${isVoiceEnabled ? 'bg-emerald-500 text-white' : 'text-emerald-200 hover:text-white'}`}>{isVoiceEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}</button>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden order-1 md:order-2">
        <header className="bg-emerald-800 text-white p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center border-2 border-emerald-400 font-bold">SV</div>
            <div>
              <h1 className="font-bold text-sm md:text-lg">Secretária Proativa</h1>
              <p className="text-emerald-200 text-[10px] uppercase font-bold tracking-tighter">Agenda & Finanças</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <BellRing size={18} className="text-emerald-300 animate-bounce" />
            <button onClick={() => window.location.reload()} className="p-2 text-emerald-300 hover:text-white transition-colors"><RefreshCw size={18} /></button>
          </div>
        </header>

        {activeTab === 'chat' ? (
          <>
            <main className="flex-1 overflow-y-auto whatsapp-bg p-4 space-y-4">
              {state.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                    <p className="text-gray-800 text-sm md:text-base whitespace-pre-wrap">{msg.text}</p>
                    <div className="flex justify-end items-center mt-1"><span className="text-[10px] text-gray-500">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-xs text-emerald-800 bg-white/70 w-fit px-3 py-1 rounded-full animate-pulse">Assistente pensando...</div>}
            </main>
            <footer className="bg-[#f0f2f5] p-3 flex border-t border-gray-200">
              <form className="flex-1 flex space-x-2" onSubmit={handleSendMessage}>
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Agende, registre um gasto ou peça conselho..." className="flex-1 p-3 px-5 rounded-full outline-none bg-white text-sm" />
                <button type="submit" className="p-3 rounded-full bg-emerald-700 text-white"><Send size={20} /></button>
              </form>
            </footer>
          </>
        ) : (
          <Dashboard 
            state={state} 
            onToggleStatus={(id) => setState(p => ({...p, appointments: p.appointments.map(a => a.id === id ? {...a, status: a.status === 'completed' ? 'pending' : 'completed'} : a)}))}
            onDeleteAppointment={(id) => setState(p => ({...p, appointments: p.appointments.filter(a => a.id !== id)}))}
            onDeleteExpense={(id) => setState(p => ({...p, transactions: p.transactions.filter(t => t.id !== id)}))}
          />
        )}
      </div>
    </div>
  );
};

export default App;
