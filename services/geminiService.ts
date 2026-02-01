
import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { AppState } from "../types";

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
  },
  {
    name: 'add_birthday',
    description: 'Registra um aniversário.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        date: { type: Type.STRING },
        relation: { type: Type.STRING }
      },
      required: ['name', 'date']
    }
  }
];

export const getSecretaryResponse = async (
  userInput: string,
  state: AppState,
  onToolCall: (name: string, args: any) => void
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
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
    return "Tive um erro técnico, Senhor. Pode repetir?";
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Diga com voz profissional e cordial: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' } // Voz feminina/neutra profissional
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (e) {
    console.error("TTS Error", e);
    return null;
  }
};
