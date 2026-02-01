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
Você é uma Secretária Virtual de alto nível, extremamente organizada, direta e educada.
CONTEXTO ATUAL: Hoje é ${dayOfWeek}, dia ${dateStr}, agora são ${timeStr}.

Regras de Comunicação:
1. TRATAMENTO: Utilize sempre "Senhor" ou "Senhora".
2. VOCABULÁRIO: Seja variada e natural. Use termos como "Agendado", "Tudo pronto", "Registrado", "Lançamento feito", "Anotado". Evite repetições mecânicas.
3. CONCISÃO: Respostas curtíssimas e eficientes.
4. FERRAMENTAS (CRITICAL): 
   - Ao usar 'add_appointment', converta datas relativas (ex: "dia 15", "amanhã", "próxima segunda") para o formato ISO 8601 (YYYY-MM-DDTHH:mm). Se o usuário não disser o ano, assuma o próximo dia 15 disponível (se hoje é maio, e ele diz feveveiro, é para o ano que vem).
   - Ao usar 'add_expense', registre o valor exato.

Exemplos de Confirmação:
- "Compromisso para fevereiro agendado, Senhor."
- "Gasto lançado. Mais algo?"
- "Lembrete anotado. Tudo certo."
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
        category: { type: Type.STRING, description: 'Categoria do gasto.' },
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
  if (!apiKey || !apiKey.startsWith("AIza")) return "Erro: API Key inválida.";
  
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

    return response.text || "Providenciado, Senhor.";
  } catch (error: any) {
    console.error(error);
    return "Tive um problema técnico, Senhor. Poderia repetir?";
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