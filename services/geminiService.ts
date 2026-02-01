
import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { AppState } from "../types";

const getApiKey = () => {
  return process.env.API_KEY || '';
};

const getSystemInstruction = (state: AppState) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  
  const totalIncome = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = Math.max(0, totalIncome - totalExpense);
  const healthScore = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;
  
  return `
Você é uma Secretária Virtual Premium e Consultora de Conhecimento.
CONTEXTO: Hoje é ${dateStr}.

STATUS FINANCEIRO: Score ${healthScore}/100 | Saldo R$ ${savings.toFixed(2)}.

Suas Diretrizes de Resposta:
1. TRATAMENTO: Jamais use "Senhor" ou "Senhora". Seja direta, moderna e profissional.
2. CONHECIMENTO GERAL: Você pode tirar dúvidas sobre qualquer assunto de forma resumida (máximo 3 tópicos).
3. LISTAS INTELIGENTES: Sempre que o usuário pedir para agendar algo que envolva compras ou ingredientes (ex: "comprar itens para bolo"), use a ferramenta 'add_appointment' e preencha o campo 'items' com a lista detalhada de ingredientes e quantidades sugeridas. Seja proativa em sugerir as quantidades corretas para receitas comuns.
4. FINANÇAS: Proatividade em gastos recorrentes e metas de poupança.
`;
};

const tools: FunctionDeclaration[] = [
  {
    name: 'add_appointment',
    description: 'Adiciona compromisso à agenda, opcionalmente com uma lista de itens (ex: lista de compras).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING },
        dateTime: { type: Type.STRING, description: 'ISO 8601' },
        urgent: { type: Type.BOOLEAN },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.STRING }
            },
            required: ['name', 'quantity']
          }
        }
      },
      required: ['description', 'dateTime']
    }
  },
  {
    name: 'add_transaction',
    description: 'Registra uma entrada ou saída financeira.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER },
        type: { type: Type.STRING, enum: ['income', 'expense'] },
        category: { type: Type.STRING },
        description: { type: Type.STRING },
        isRecurring: { type: Type.BOOLEAN },
        frequency: { type: Type.STRING, enum: ['monthly', 'weekly'] }
      },
      required: ['amount', 'type', 'category']
    }
  },
  {
    name: 'add_goal',
    description: 'Cria uma meta de poupança.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        targetAmount: { type: Type.NUMBER },
        deadline: { type: Type.STRING }
      },
      required: ['title', 'targetAmount']
    }
  },
  {
    name: 'update_goal_progress',
    description: 'Adiciona dinheiro a uma meta.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        goalId: { type: Type.STRING },
        amountToAdd: { type: Type.NUMBER }
      },
      required: ['goalId', 'amountToAdd']
    }
  }
];

export const getSecretaryResponse = async (
  userInput: string,
  state: AppState,
  onToolCall: (name: string, args: any) => void
): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const history = state.messages.slice(-4).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: userInput }] }],
      config: {
        systemInstruction: getSystemInstruction(state),
        tools: [{ functionDeclarations: tools }],
      }
    });

    if (response.functionCalls) {
      for (const fc of response.functionCalls) onToolCall(fc.name, fc.args);
    }
    return response.text || "Entendido. Agenda atualizada.";
  } catch (error) {
    return "Houve um erro na minha conexão. Pode repetir?";
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
  } catch (e) { return null; }
};
