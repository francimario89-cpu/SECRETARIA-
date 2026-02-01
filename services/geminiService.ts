
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { AppState, Appointment, Expense, Birthday } from "../types";

const SYSTEM_INSTRUCTION = `
Você é uma Secretária Virtual profissional, organizada, educada e proativa. Seu objetivo é facilitar a vida do seu chefe, gerenciando sua agenda, finanças e lembrando-o de datas importantes.

Regras de Operação:
1. Agenda: Ao receber um compromisso, use a ferramenta 'add_appointment'. Confirme os detalhes (data e hora).
2. Finanças: Registre cada gasto mencionado usando 'add_expense'.
3. Aniversários: Registre aniversários usando 'add_birthday'.
4. Relatórios: Se o usuário pedir um relatório financeiro ou resumo da agenda, use as ferramentas de listagem.
5. Espiritualidade: Se for o início do dia ou solicitado, forneça um versículo bíblico motivador.

Tom de Voz: Cordial, eficiente e discreto. Use "Senhor" ou "Senhora" conforme apropriado.
Mantenha as respostas concisas e profissionais, como se estivesse no WhatsApp.
`;

const tools: FunctionDeclaration[] = [
  {
    name: 'add_appointment',
    description: 'Adiciona um novo compromisso à agenda.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: 'Descrição do compromisso' },
        dateTime: { type: Type.STRING, description: 'Data e hora no formato ISO ou legível' },
        urgent: { type: Type.BOOLEAN, description: 'Se o compromisso é urgente' }
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
        amount: { type: Type.NUMBER, description: 'Valor do gasto' },
        category: { type: Type.STRING, description: 'Categoria do gasto (ex: Alimentação, Lazer)' },
        description: { type: Type.STRING, description: 'Descrição opcional do gasto' }
      },
      required: ['amount', 'category']
    }
  },
  {
    name: 'add_birthday',
    description: 'Registra a data de aniversário de um contato.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Nome da pessoa' },
        date: { type: Type.STRING, description: 'Data do aniversário' },
        relation: { type: Type.STRING, description: 'Relação com o usuário' }
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
  
  // Prepare history for context (simplified for this demo)
  const history = state.messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));

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
      // After a tool call, we might want a verbal confirmation from the AI.
      // We can do another call or just assume the AI provides a text part too.
    }

    return response.text || "Entendido, Senhor. Já processei sua solicitação.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Peço desculpas, Senhor. Tive um problema técnico ao processar sua mensagem.";
  }
};
