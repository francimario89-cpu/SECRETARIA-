
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
  
  const goalsInfo = state.goals.map(g => `- ${g.title}: R$ ${g.currentAmount}/${g.targetAmount}`).join('\n');

  return `
Você é uma Secretária Virtual e Consultora Financeira Avançada (Nível Guiabolso/Mobills).
CONTEXTO: Hoje é ${dateStr}.

STATUS FINANCEIRO ATUAL:
- Score de Saúde: ${healthScore}/100
- Entradas: R$ ${totalIncome.toFixed(2)}
- Saídas: R$ ${totalExpense.toFixed(2)}
- Metas Ativas:
${goalsInfo || "Nenhuma meta definida."}

Suas Novas Capacidades:
1. SCORE DE SAÚDE: Se o score for < 30, seja mais cautelosa e sugira cortes. Se > 60, parabenize pela disciplina.
2. RECORRÊNCIA: Quando o usuário disser "todo mês pago X", use 'add_transaction' com 'isRecurring: true'.
3. METAS: Use 'add_goal' para criar objetivos (ex: viagem, carro). Ajude o usuário a destinar o saldo positivo para essas metas.
4. PROATIVIDADE: Analise se o saldo sobra e pergunte se quer aplicar em uma meta.

Regras de Resposta:
- Não use "Senhor/Senhora".
- Seja motivadora mas realista.
- Se o usuário registrar um gasto fixo (Aluguel, Netflix), pergunte se é recorrente.
`;
};

const tools: FunctionDeclaration[] = [
  {
    name: 'add_transaction',
    description: 'Registra uma entrada ou saída, podendo ser recorrente.',
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
    description: 'Adiciona dinheiro a uma meta existente.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        goalId: { type: Type.STRING },
        amountToAdd: { type: Type.NUMBER }
      },
      required: ['goalId', 'amountToAdd']
    }
  },
  {
    name: 'add_appointment',
    description: 'Adiciona compromisso à agenda.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING },
        dateTime: { type: Type.STRING },
        urgent: { type: Type.BOOLEAN }
      },
      required: ['description', 'dateTime']
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
    return "Tive um problema técnico. Pode repetir?";
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
