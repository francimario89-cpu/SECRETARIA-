
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
Ao receber valores monetários (ex: "6.680,00"), converta sempre para o formato numérico padrão (ex: 6680.00) antes de chamar a ferramenta 'add_transaction'. 
- Ignore pontos de milhar (6.680 -> 6680).
- Trate a vírgula como ponto decimal (,00 -> .00).

MISSÃO DE COMPRAS INTELIGENTES:
Ao agendar itens que envolvam mercado, separe a "Quantidade da Receita" da "Embalagem de Mercado".
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
    description: 'Registra finanças. Converta 1.500,00 para 1500.00.',
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

/**
 * Filtra e organiza o histórico para garantir turnos alternados (user/model)
 * e evita erros de requisição inválida.
 */
const buildCleanHistory = (messages: Message[], currentUserInput: string) => {
  const clean: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
  
  // Pegamos as últimas mensagens do histórico (limitando para não estourar contexto)
  const lastMessages = messages.slice(-10);
  
  lastMessages.forEach((msg) => {
    const role = msg.role === 'user' ? 'user' : 'model';
    // Evita adicionar duas mensagens seguidas do mesmo papel
    if (clean.length > 0 && clean[clean.length - 1].role === role) {
      // Se for duplicado, concatena o texto ou ignora
      clean[clean.length - 1].parts[0].text += " " + msg.text;
    } else {
      clean.push({ role, parts: [{ text: msg.text }] });
    }
  });

  // Se o último papel for 'user', removemos para adicionar o userInput atual de forma limpa
  if (clean.length > 0 && clean[clean.length - 1].role === 'user') {
    clean.pop();
  }

  return clean;
};

export const getSecretaryResponse = async (
  userInput: string,
  state: AppState,
  onToolCall: (name: string, args: any) => void
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Erro: Chave de API não configurada.";

  const ai = new GoogleGenAI({ apiKey });
  const cleanContents = buildCleanHistory(state.messages, userInput);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...cleanContents, { role: 'user', parts: [{ text: userInput }] }],
      config: {
        systemInstruction: getSystemInstruction(state),
        tools: [{ functionDeclarations: tools }],
        temperature: 0.4, // Menos aleatoriedade ajuda na precisão de ferramentas
      }
    });

    if (response.functionCalls) {
      for (const fc of response.functionCalls) {
        onToolCall(fc.name, fc.args);
      }
    }
    
    return response.text || "Comando processado. Verifique seu painel para detalhes.";
  } catch (error: any) {
    console.error("Gemini Critical Error:", error);
    
    // Se o erro for de turnos não alternados (comum quando o histórico corrompe)
    if (error.message?.includes("400") || error.message?.includes("turn")) {
       // Tenta uma chamada de emergência sem histórico para não deixar o usuário no vácuo
       try {
         const quickResponse = await ai.models.generateContent({
           model: 'gemini-3-flash-preview',
           contents: [{ role: 'user', parts: [{ text: userInput }] }],
           config: { systemInstruction: getSystemInstruction(state), tools: [{ functionDeclarations: tools }] }
         });
         if (quickResponse.functionCalls) {
           for (const fc of quickResponse.functionCalls) onToolCall(fc.name, fc.args);
         }
         return quickResponse.text || "Processado em modo de segurança.";
       } catch (e) {
         return "Minha memória de curto prazo falhou. Pode tentar falar de uma forma mais simples?";
       }
    }

    return "Tive um soluço técnico na conexão. Poderia repetir essa última frase?";
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
