
import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { AppState } from "../types";

const getApiKey = () => process.env.API_KEY || '';

const getSystemInstruction = (state: AppState) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  
  return `
Você é uma Secretária Virtual Premium e Life Coach de Alta Performance.
CONTEXTO: Hoje é ${dateStr}.

MISSÃO DE COMPRAS INTELIGENTES:
Ao agendar itens que envolvam mercado (receitas, limpeza, etc), você deve separar a "Quantidade da Receita" da "Embalagem de Mercado".
Use o bom senso comercial brasileiro:
- Óleo: Mínimo 900ml.
- Farinha/Açúcar/Arroz: Mínimo 1kg.
- Leite: Mínimo 1L.
- Ovos: Mínimo 6 ou 12 unidades.
- Manteiga: 200g ou 500g.

No campo 'items':
- 'quantity': O que o usuário vai usar (ex: 250g).
- 'marketQuantity': O que ele deve comprar (ex: 1kg).

DIRETRIZES GERAIS:
- Seja direta e executiva.
- Gerencie saúde (hábitos), tarefas (to-do) e finanças proativamente.
`;
};

const tools: FunctionDeclaration[] = [
  {
    name: 'add_appointment',
    description: 'Adiciona compromisso com lista de compras inteligente separando uso de compra.',
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
              quantity: { type: Type.STRING, description: 'Qtd da receita/uso' },
              marketQuantity: { type: Type.STRING, description: 'Tamanho da embalagem no mercado' }
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
    description: 'Atualiza progresso de saúde.',
    parameters: {
      type: Type.OBJECT,
      properties: { name: { type: Type.STRING }, amount: { type: Type.NUMBER } },
      required: ['name', 'amount']
    }
  },
  {
    name: 'add_transaction',
    description: 'Registra finanças.',
    parameters: {
      type: Type.OBJECT,
      properties: { amount: { type: Type.NUMBER }, type: { type: Type.STRING, enum: ['income', 'expense'] }, category: { type: Type.STRING } },
      required: ['amount', 'type', 'category']
    }
  }
];

export const getSecretaryResponse = async (
  userInput: string,
  state: AppState,
  onToolCall: (name: string, args: any) => void
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const history = state.messages.slice(-6).map(m => ({
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
    return response.text || "Pronto. Agenda atualizada com lista de mercado.";
  } catch (error) {
    return "Tive um problema na rede, mas pode tentar novamente?";
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
