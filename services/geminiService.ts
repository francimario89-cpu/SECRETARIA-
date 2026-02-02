
import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { AppState, Message } from "../types";

const getApiKey = () => process.env.API_KEY || '';

const getSystemInstruction = (state: AppState) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  
  return `
Você é uma Secretária Virtual Premium e Life Coach de Alta Performance.
CONTEXTO: Hoje é ${dateStr}.

IMPORTANTE PARA FINANÇAS:
Ao receber valores monetários (ex: "6.680,00" ou "R$ 1.500"), converta para o formato numérico padrão (ex: 6680.00) antes de usar 'add_transaction'. 
- Remova pontos de milhar.
- Substitua vírgula por ponto para decimais.

DIRETRIZES:
- Se o usuário pedir receitas, dê o passo a passo e ofereça agendar o preparo.
- Se ele disser apenas "sim" ou "ok" após você sugerir algo, execute a ação sugerida usando as ferramentas.
- Seja executiva, breve e eficiente.
`;
};

const tools: FunctionDeclaration[] = [
  {
    name: 'add_transaction',
    description: 'Registra finanças. Entrada (income) ou Saída (expense).',
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
    name: 'add_appointment',
    description: 'Adiciona compromisso com lista de compras.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING },
        dateTime: { type: Type.STRING },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { 
              name: { type: Type.STRING }, 
              quantity: { type: Type.STRING },
              marketQuantity: { type: Type.STRING }
            },
            required: ['name', 'quantity', 'marketQuantity']
          }
        }
      },
      required: ['description', 'dateTime']
    }
  },
  {
    name: 'add_task',
    description: 'Adiciona tarefa ao To-Do.',
    parameters: {
      type: Type.OBJECT,
      properties: { text: { type: Type.STRING }, priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] } },
      required: ['text']
    }
  },
  {
    name: 'update_habit',
    description: 'Atualiza progresso de saúde (Água, Exercício, etc).',
    parameters: {
      type: Type.OBJECT,
      properties: { name: { type: Type.STRING }, amount: { type: Type.NUMBER } },
      required: ['name', 'amount']
    }
  }
];

/**
 * Função Blindada para construir o histórico.
 * Resolve o erro de turnos não alternados fundindo mensagens consecutivas do mesmo papel
 * e garantindo que o histórico comece com 'user'.
 */
const buildSafeHistory = (messages: Message[]) => {
  const safe: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
  
  // 1. Filtrar mensagens inválidas ou de erro do sistema
  const validMessages = messages.filter(m => 
    m.text && 
    m.text.trim() !== "" && 
    !m.text.includes("problema de conexão") &&
    !m.text.includes("soluço técnico")
  );

  validMessages.forEach((msg) => {
    const role = msg.role === 'user' ? 'user' : 'model';

    if (safe.length === 0) {
      // O histórico deve SEMPRE começar com o usuário
      if (role === 'user') {
        safe.push({ role, parts: [{ text: msg.text }] });
      }
    } else {
      const last = safe[safe.length - 1];
      if (last.role === role) {
        // Se o papel for o mesmo, anexa o texto para não quebrar a alternância
        last.parts[0].text += "\n" + msg.text;
      } else {
        safe.push({ role, parts: [{ text: msg.text }] });
      }
    }
  });

  return safe;
};

export const getSecretaryResponse = async (
  userInput: string,
  state: AppState,
  onToolCall: (name: string, args: any) => void
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Erro: Configure sua API_KEY.";

  const ai = new GoogleGenAI({ apiKey });
  const safeHistory = buildSafeHistory(state.messages);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...safeHistory, { role: 'user', parts: [{ text: userInput }] }],
      config: {
        systemInstruction: getSystemInstruction(state),
        tools: [{ functionDeclarations: tools }],
        temperature: 0.2, // Mais baixo para ser mais determinístico e evitar erros
      }
    });

    if (response.functionCalls) {
      for (const fc of response.functionCalls) {
        onToolCall(fc.name, fc.args);
      }
    }
    
    return response.text || "Comando processado com sucesso.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    // Fallback de Emergência: Tenta enviar SEM histórico se houver erro de validação
    try {
      const emergencyResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: userInput }] }],
        config: { systemInstruction: getSystemInstruction(state), tools: [{ functionDeclarations: tools }] }
      });
      if (emergencyResponse.functionCalls) {
        for (const fc of emergencyResponse.functionCalls) onToolCall(fc.name, fc.args);
      }
      return emergencyResponse.text || "Processado (Modo de Recuperação).";
    } catch (e) {
      return "Tive uma falha de comunicação. Pode tentar reformular ou enviar novamente?";
    }
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
