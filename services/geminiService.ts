
import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { AppState } from "../types";

const getApiKey = () => process.env.API_KEY || '';

const getSystemInstruction = (state: AppState) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  
  return `
Você é uma Secretária Virtual Premium e Life Coach de Alta Performance.
CONTEXTO: Hoje é ${dateStr}.

IMPORTANTE PARA FINANÇAS:
Ao receber valores monetários (ex: "6.680,00"), converta sempre para o formato numérico padrão (ex: 6680.00) antes de chamar a ferramenta 'add_transaction'. Ignore pontos de milhar e trate a vírgula como ponto decimal.

MISSÃO DE COMPRAS INTELIGENTES:
Ao agendar itens que envolvam mercado (receitas, limpeza, etc), separe a "Quantidade da Receita" da "Embalagem de Mercado".
- Óleo: 900ml.
- Farinha/Açúcar/Arroz: 1kg.
- Leite: 1L.
- Ovos: 6 ou 12 un.

DIRETRIZES GERAIS:
- Seja direta, executiva e proativa.
- Se o usuário pedir para "colocar que recebi", use 'add_transaction' com type='income'.
- Se o usuário pedir para "gastei" ou "paguei", use 'add_transaction' com type='expense'.
`;
};

const tools: FunctionDeclaration[] = [
  {
    name: 'add_transaction',
    description: 'Registra uma entrada (income) ou saída (expense) financeira. Converta formatos como 1.500,00 para 1500.00.',
    parameters: {
      type: Type.OBJECT,
      properties: { 
        amount: { type: Type.NUMBER, description: 'Valor numérico decimal' }, 
        type: { type: Type.STRING, enum: ['income', 'expense'] }, 
        category: { type: Type.STRING, description: 'Ex: Salário, Alimentação, Aluguel' },
        description: { type: Type.STRING }
      },
      required: ['amount', 'type', 'category']
    }
  },
  {
    name: 'add_appointment',
    description: 'Adiciona compromisso com lista de compras inteligente.',
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
    description: 'Atualiza progresso de saúde.',
    parameters: {
      type: Type.OBJECT,
      properties: { name: { type: Type.STRING }, amount: { type: Type.NUMBER } },
      required: ['name', 'amount']
    }
  }
];

export const getSecretaryResponse = async (
  userInput: string,
  state: AppState,
  onToolCall: (name: string, args: any) => void
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Erro: Chave de API não configurada.";

  const ai = new GoogleGenAI({ apiKey });
  
  // Garante que o histórico seja alternado e não comece com mensagem vazia
  const history = state.messages
    .filter(m => m.text && m.text.trim() !== "")
    .slice(-8)
    .map(m => ({
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
        temperature: 0.7,
      }
    });

    if (response.functionCalls) {
      for (const fc of response.functionCalls) {
        console.log(`[Tool Call] ${fc.name}:`, fc.args);
        onToolCall(fc.name, fc.args);
      }
    }
    
    return response.text || "Comando processado com sucesso.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("SAFE")) {
      return "Esta mensagem foi filtrada por segurança. Pode tentar reformular?";
    }
    return "Tive um problema de conexão com a inteligência central. Pode repetir sua solicitação?";
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
