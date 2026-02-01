import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { AppState } from "../types";

const getApiKey = () => {
  return process.env.API_KEY || '';
};

const SYSTEM_INSTRUCTION = `
Você é uma Secretária Virtual profissional, organizada, educada e proativa. Seu objetivo é facilitar a vida do seu chefe, gerenciando sua agenda, finanças e lembrando-o de datas importantes.
Regras de Operação:
1. Agenda: Use 'add_appointment' para novos compromissos. 
   - Se o usuário pedir para lembrar "daqui a X minutos/horas", calcule o horário relativo ao momento atual.
2. Finanças: Use 'add_expense' para gastos.
3. Aniversários: Use 'add_birthday' para datas especiais.
4. Foco: Mantenha-se estritamente profissional e eficiente. Não inclua citações religiosas ou versículos.
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

  // O Gemini exige que a primeira mensagem do histórico seja sempre do usuário.
  // Filtramos a mensagem 'initial' (boas-vindas) do histórico de contexto.
  const history = state.messages
    .filter(m => m.id !== 'initial') 
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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

    return response.text || "Entendido, Senhor. Já tomei as providências solicitadas.";
  } catch (error: any) {
    console.error("Erro técnico detalhado:", error);
    
    // Fallback amigável com a pergunta do usuário para não perder o fluxo
    return "Peço desculpas, Senhor. Tive uma pequena instabilidade na conexão agora. Como posso ajudá-lo com '" + userInput + "'? Posso tentar processar novamente?";
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