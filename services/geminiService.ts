
import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { AppState } from "../types";

const getApiKey = () => {
  return process.env.API_KEY || '';
};

const SYSTEM_INSTRUCTION = `
Você é uma Secretária Virtual profissional, organizada, educada e proativa. Seu objetivo é facilitar a vida do seu chefe, gerenciando sua agenda, finanças e lembrando-o de datas importantes.
Regras de Operação:
1. Agenda: Use 'add_appointment' para novos compromissos. 
   - IMPORTANTE: Se o usuário pedir para lembrar "daqui a X horas", calcule o horário relativo ao momento atual.
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
        description: { type: Type.STRING, description: 'Descrição do que deve ser lembrado.' },
        dateTime: { type: Type.STRING, description: 'Data e hora no formato ISO (ex: 2023-10-27T14:30:00).' },
        urgent: { type: Type.BOOLEAN, description: 'Se o compromisso é urgente.' }
      },
      required: ['description', 'dateTime']
    }
  },
  {
    name: 'add_expense',
    description: 'Registra um novo gasto financeiro.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: 'Valor numérico do gasto.' },
        category: { type: Type.STRING, description: 'Categoria (ex: Alimentação, Transporte, Lazer).' },
        description: { type: Type.STRING, description: 'Opcional: detalhe do gasto.' }
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

  // Prepara o histórico. O Gemini exige que o histórico comece com 'user'.
  let history = state.messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model' as 'user' | 'model',
    parts: [{ text: m.text }]
  }));

  // Remove mensagens do início até encontrar a primeira mensagem do usuário
  while (history.length > 0 && history[0].role !== 'user') {
    history.shift();
  }

  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: history,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: tools }]
      }
    });

    const result = await chat.sendMessage({ message: userInput });
    const response = result;

    if (response.functionCalls) {
      for (const fc of response.functionCalls) {
        onToolCall(fc.name, fc.args);
      }
    }

    return response.text || "Entendido, Senhor. Já tomei as providências solicitadas.";
  } catch (error) {
    console.error("Gemini Error:", error);
    // Se for erro de segurança ou modelo, tentamos uma resposta simplificada
    return "Peço desculpas, Senhor. Tive uma instabilidade na conexão, mas estou pronta para continuar. Poderia repetir?";
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
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        }
      }
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) {
    console.error("Erro TTS:", e);
    return null;
  }
};
