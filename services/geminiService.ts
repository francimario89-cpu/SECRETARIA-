import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { AppState } from "../types";

const getApiKey = () => {
  return process.env.API_KEY || '';
};

const SYSTEM_INSTRUCTION = `
Você é uma Secretária Virtual profissional, organizada e muito educada.
Seu objetivo é gerenciar a agenda, finanças e lembretes do usuário.

Regras de Comportamento:
1. Quando o usuário mencionar um compromisso ou lembrete, use a ferramenta 'add_appointment'.
2. Quando o usuário mencionar um gasto ou despesa, use a ferramenta 'add_expense'.
3. TRATAMENTO: Sempre use "Senhor" ou "Senhora" para se dirigir ao usuário.
4. CONFIRMAÇÃO NATURAL: Sempre que você realizar uma ação (adicionar gasto ou compromisso), confirme isso de forma natural no texto da resposta. 
   Exemplos: "Tá ok, Senhor. Já adicionei à sua agenda.", "Pronto, Senhor. Esse gasto já foi registrado.", "Com certeza, já anotei aqui para não esquecer."
5. Seja curta e eficiente. Não dê respostas longas demais.
6. Jamais use termos religiosos ou saudações espirituais.
7. Se não entender algo, peça educadamente para repetir.
`;

const tools: FunctionDeclaration[] = [
  {
    name: 'add_appointment',
    description: 'Adiciona um compromisso ou lembrete à agenda.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: 'O que deve ser lembrado ou feito.' },
        dateTime: { type: Type.STRING, description: 'Data e hora (ex: hoje as 15h, amanhã, 20/10).' },
        urgent: { type: Type.BOOLEAN, description: 'Se o assunto é urgente.' }
      },
      required: ['description', 'dateTime']
    }
  },
  {
    name: 'add_expense',
    description: 'Registra uma despesa ou gasto financeiro.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: 'Valor total do gasto.' },
        category: { type: Type.STRING, description: 'Categoria (ex: Mercado, Gasolina, Lanche).' },
        description: { type: Type.STRING, description: 'Detalhe opcional do gasto.' }
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
  
  if (!apiKey || apiKey.trim() === "" || !apiKey.startsWith("AIza")) {
    return "Atenção: A chave de API (API_KEY) parece estar incorreta no painel do Render. Por favor, verifique se ela começa com 'AIza'.";
  }
  
  const ai = new GoogleGenAI({ apiKey });

  // Limpeza de histórico para manter apenas mensagens válidas e alternadas
  const history: any[] = [];
  const validMessages = state.messages.filter(m => 
    m.id !== 'initial' && 
    !m.text.includes("Atenção:") && 
    !m.text.includes("ERRO:") &&
    !m.text.includes("Desculpe")
  ).slice(-6);

  let lastRole = '';
  for (const m of validMessages) {
    const role = m.role === 'user' ? 'user' : 'model';
    if (role !== lastRole) {
      history.push({ role, parts: [{ text: m.text }] });
      lastRole = role;
    }
  }

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
        tools: [{ functionDeclarations: tools }],
        temperature: 0.7
      }
    });

    if (response.functionCalls) {
      for (const fc of response.functionCalls) {
        onToolCall(fc.name, fc.args);
      }
    }

    return response.text || "Com certeza, Senhor. Já providenciei isso.";
  } catch (error: any) {
    console.error("Erro na API:", error);
    
    try {
      const fallback = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: userInput }] }],
        config: { systemInstruction: SYSTEM_INSTRUCTION }
      });
      return fallback.text || "Entendido, Senhor. Já anotei.";
    } catch (e2) {
      return "Desculpe, Senhor. Tive uma pequena falha de conexão. Poderia repetir o comando?";
    }
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  const apiKey = getApiKey();
  if (!apiKey || !apiKey.startsWith("AIza")) return null;
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