import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { AppState } from "../types";

const getApiKey = () => {
  return process.env.API_KEY || '';
};

const getSystemInstruction = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dayOfWeek = now.toLocaleDateString('pt-BR', { weekday: 'long' });

  return `
Você é uma Secretária Virtual de alto nível, extremamente organizada, direta e eficiente.
CONTEXTO ATUAL: Hoje é ${dayOfWeek}, dia ${dateStr}, agora são ${timeStr}.

Regras de Comunicação:
1. TRATAMENTO: NÃO use "Senhor" ou "Senhora". Use um tom profissional, porém direto e moderno.
2. VOCABULÁRIO: Use um vocabulário amplo e natural. Varie as confirmações para não ser repetitiva: "Providenciado", "Agendado", "Registrado", "Tudo pronto", "Lançamento feito", "Anotado", "Combinado".
3. CONCISÃO: Seja extremamente resumida. Respostas curtas são preferíveis.
4. FERRAMENTAS (REGRAS CRÍTICAS): 
   - Ao usar 'add_appointment', converta datas relativas (ex: "dia 15", "amanhã", "15 de fevereiro") para o formato ISO 8601 COMPLETO (YYYY-MM-DDTHH:mm). 
   - Se o usuário mencionar um mês que já passou no ano corrente, agende para o próximo ano.
   - SEMPRE acione a ferramenta necessária antes de responder ao usuário.

Exemplos de Resposta:
- "Compromisso agendado para fevereiro."
- "Gasto registrado com sucesso. Mais algo?"
- "Lembrete anotado. Tudo certo por aqui."
- "Agendamento concluído."
`;
};

const tools: FunctionDeclaration[] = [
  {
    name: 'add_appointment',
    description: 'Adiciona um compromisso ou lembrete à agenda com data precisa.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: 'O que deve ser lembrado.' },
        dateTime: { type: Type.STRING, description: 'Data em formato ISO (YYYY-MM-DDTHH:mm).' },
        urgent: { type: Type.BOOLEAN, description: 'Prioridade alta.' }
      },
      required: ['description', 'dateTime']
    }
  },
  {
    name: 'add_expense',
    description: 'Registra uma despesa financeira.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: 'Valor numérico.' },
        category: { type: Type.STRING, description: 'Categoria do gasto (Mercado, Saúde, etc).' },
        description: { type: Type.STRING, description: 'Detalhes do gasto.' }
      },
      required: ['amount', 'category']
    }
  }
];

export const getSecretaryResponse = async (
  userInput: string,
  state: AppState,
  onToolCall: (name: string, args: any) => void
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey || !apiKey.startsWith("AIza")) return "Erro: Chave de API inválida no servidor.";
  
  const ai = new GoogleGenAI({ apiKey });

  const history: any[] = [];
  const validMessages = state.messages.filter(m => 
    m.id !== 'initial' && !m.text.includes("Atenção:") && !m.text.includes("Erro:")
  ).slice(-6);

  let lastRole = '';
  for (const m of validMessages) {
    const role = m.role === 'user' ? 'user' : 'model';
    if (role !== lastRole) {
      history.push({ role, parts: [{ text: m.text }] });
      lastRole = role;
    }
  }

  if (history.length > 0 && history[0].role === 'model') history.shift();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: userInput }] }],
      config: {
        systemInstruction: getSystemInstruction(),
        tools: [{ functionDeclarations: tools }],
        temperature: 0.7
      }
    });

    if (response.functionCalls) {
      for (const fc of response.functionCalls) {
        onToolCall(fc.name, fc.args);
      }
    }

    return response.text || "Providenciado.";
  } catch (error: any) {
    console.error("Erro Gemini:", error);
    return "Tive um problema de conexão. Poderia repetir?";
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) {
    return null;
  }
};