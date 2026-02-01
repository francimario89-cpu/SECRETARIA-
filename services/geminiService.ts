import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { AppState } from "../types";

const getApiKey = () => {
  return process.env.API_KEY || '';
};

const SYSTEM_INSTRUCTION = `
Você é uma Secretária Virtual profissional, organizada e educada.
Objetivo: Gerenciar agenda, finanças e lembretes.
Regras:
1. 'add_appointment': Use para compromissos. Calcule horários relativos.
2. 'add_expense': Use para gastos financeiros.
3. Sem religião: Não use versículos ou termos religiosos.
4. Responda de forma curta e eficiente.
`;

const tools: FunctionDeclaration[] = [
  {
    name: 'add_appointment',
    description: 'Adiciona um compromisso ou lembrete.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING },
        dateTime: { type: Type.STRING },
        urgent: { type: Type.BOOLEAN }
      },
      required: ['description', 'dateTime']
    }
  },
  {
    name: 'add_expense',
    description: 'Registra um gasto.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER },
        category: { type: Type.STRING },
        description: { type: Type.STRING }
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
  if (!apiKey) return "ERRO: API_KEY não configurada no ambiente.";
  
  const ai = new GoogleGenAI({ apiKey });

  // 1. Filtrar mensagens: Remover a mensagem de boas-vindas e mensagens de erro anteriores
  // O Gemini exige que a primeira mensagem seja 'user' e as mensagens alternem.
  let history = state.messages
    .filter(m => m.id !== 'initial' && !m.text.includes("Peço desculpas") && !m.text.includes("Erro técnico"))
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

  // 2. Garantir que o histórico comece com 'user'
  if (history.length > 0 && history[0].role === 'model') {
    history.shift();
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: userInput }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: tools }]
      }
    });

    if (response.functionCalls) {
      for (const fc of response.functionCalls) {
        onToolCall(fc.name, fc.args);
      }
    }

    return response.text || "Com certeza, Senhor. Já processei sua solicitação.";
  } catch (error: any) {
    console.error("Erro na API Gemini:", error);
    
    // Se falhar, tentamos uma resposta sem histórico (limpa o cache de erro)
    try {
      const simpleResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: userInput }] }],
        config: { systemInstruction: SYSTEM_INSTRUCTION }
      });
      return simpleResponse.text || "Entendido, Senhor.";
    } catch (innerError) {
      return "Desculpe, Senhor. Estou com dificuldade de conexão com meus servidores de IA. Por favor, verifique se a chave de API está correta.";
    }
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