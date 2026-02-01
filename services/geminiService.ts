
import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { AppState } from "../types";

const getApiKey = () => {
  return process.env.API_KEY || '';
};

const getSystemInstruction = (state: AppState) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  const totalIncome = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const budget = state.monthlyBudget || 0;
  const remainingBudget = budget - totalExpense;

  return `
Você é uma Secretária Virtual e Consultora Financeira Proativa.
CONTEXTO ATUAL: Hoje é ${dateStr}, agora são ${timeStr}.

RESUMO FINANCEIRO:
- Entradas: R$ ${totalIncome.toFixed(2)}
- Saídas: R$ ${totalExpense.toFixed(2)}
- Orçamento (Teto): R$ ${budget.toFixed(2)}
- Disponível para gastos: R$ ${remainingBudget.toFixed(2)}

Regras de Atuação:
1. TRATAMENTO: Profissional, direto, sem usar "Senhor/Senhora".
2. CONSULTORIA: Se o usuário estiver perto de gastar mais de 80% do orçamento, dê um aviso amigável.
3. FERRAMENTAS:
   - 'add_transaction': Use para ENTRADAS (income) e SAÍDAS (expense).
   - 'set_budget': Define o limite de gastos mensal.
   - 'add_appointment': Datas em ISO 8601.
4. PROATIVIDADE: Se o usuário perguntar "quanto posso gastar", use os dados financeiros acima.

Exemplos:
- "Registrado. Você ainda tem R$ ${remainingBudget} para gastar este mês."
- "Orçamento de R$ ${budget} definido. Vou te avisar se chegar perto do limite."
`;
};

const tools: FunctionDeclaration[] = [
  {
    name: 'add_appointment',
    description: 'Adiciona um compromisso à agenda.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING },
        dateTime: { type: Type.STRING, description: 'ISO 8601' },
        urgent: { type: Type.BOOLEAN }
      },
      required: ['description', 'dateTime']
    }
  },
  {
    name: 'add_transaction',
    description: 'Registra uma entrada (salário/lucro) ou saída (gasto).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER },
        type: { type: Type.STRING, enum: ['income', 'expense'] },
        category: { type: Type.STRING },
        description: { type: Type.STRING }
      },
      required: ['amount', 'type', 'category']
    }
  },
  {
    name: 'set_budget',
    description: 'Define o teto de gastos mensal do usuário.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER }
      },
      required: ['amount']
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: userInput }] }],
      config: {
        systemInstruction: getSystemInstruction(state),
        tools: [{ functionDeclarations: tools }],
      }
    });

    if (response.functionCalls) {
      for (const fc of response.functionCalls) onToolCall(fc.name, fc.args);
    }
    return response.text || "Entendido.";
  } catch (error) {
    return "Tive um problema. Pode repetir?";
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
