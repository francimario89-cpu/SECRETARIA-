
import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { AppState } from "../types";

// Fallback para a chave se process.env não estiver disponível
const getApiKey = () => {
  return process.env.API_KEY || '';
};

const SYSTEM_INSTRUCTION = `
Você é uma Secretária Virtual profissional, organizada, educada e proativa. Seu objetivo é facilitar a vida do seu chefe, gerenciando sua agenda, finanças e lembrando-o de datas importantes.
Regras de Operação:
1. Agenda: Use 'add_appointment' para novos compromissos.
2. Finanças: Use 'add_expense' para gastos.
3. Aniversários: Use 'add_birthday' para datas especiais.
4. Espiritualidade: Sempre comece o dia ou finalize mensagens com um tom encorajador e, se apropriado, um versículo curto.
Tom de Voz: Cordial e discreto. Use "Senhor" ou "Senhora".
`;

const tools: FunctionDeclaration[] = [
  {
    name: 'add_appointment',
    description: 'Adiciona um novo compromisso à agenda.',
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
    description: 'Registra um novo gasto.',
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
  if (!apiKey) return "Atenção: Configure a API_KEY no painel do Render para eu poder responder.";
  
  const ai = new GoogleGenAI({ apiKey });
  const history = state.messages.slice(-10).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: userInput }] }],
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

    return response.text || "Entendido, Senhor.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Tive um erro técnico ao processar sua solicitação, Senhor.";
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Diga com voz profissional: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        }
      }
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) {
    return null;
  }
};
