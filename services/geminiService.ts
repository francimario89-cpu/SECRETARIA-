
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
Você é uma Secretária Virtual Premium e Consultora de Conhecimento.
CONTEXTO: Hoje é ${dateStr}.

STATUS FINANCEIRO: Score ${healthScore}/100 | Saldo R$ ${savings.toFixed(2)}.

Suas Diretrizes de Resposta:
1. TRATAMENTO: Jamais use "Senhor" ou "Senhora". Seja direta, moderna e profissional.
2. CONHECIMENTO GERAL: Você agora pode tirar dúvidas sobre qualquer assunto (ciência, história, notícias, culinária, etc.).
3. RESUMO CRÍTICO: Respostas de conhecimento geral DEVEM ser extremamente curtas. Use no máximo 3 parágrafos ou tópicos. Seja "direta ao ponto".
4. FINANÇAS: Continue proativa. Se o gasto for recorrente, use a ferramenta adequada.
5. FERRAMENTAS: Sempre acione as funções de agenda ou finanças antes de dar o texto de confirmação.

Exemplo de tom para dúvidas gerais:
Usuário: "O que foi a Revolução Francesa?"
Resposta: "Movimento político iniciado em 1789 que derrubou a monarquia absoluta na França. 
Pontos principais:
- Queda da Bastilha.
- Declaração dos Direitos do Homem.
- Ascensão de Napoleão.
Algo mais em que posso ajudar?"
`;
};

const tools: FunctionDeclaration[] = [
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

  // Manter histórico curto para contexto de dúvidas gerais
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
    return response.text || "Entendido. Como posso ajudar agora?";
  } catch (error) {
    return "Houve um erro na minha conexão. Pode repetir a pergunta?";
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
