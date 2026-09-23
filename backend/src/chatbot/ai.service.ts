import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

export interface ChatHistoryMessage {
  role: 'user' | 'assistant' | string;
  content: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      try {
        this.ai = new GoogleGenAI({ apiKey });
        this.logger.log('Gemini AI Service inicializado com sucesso.');
      } catch (err: any) {
        this.logger.warn(`Falha ao instanciar GoogleGenAI: ${err?.message}`);
        this.ai = null;
      }
    } else {
      this.logger.log('GEMINI_API_KEY não configurada. Chatbot operará em modo regras/NLP local.');
    }
  }

  isAvailable(): boolean {
    return !!this.ai && !!process.env.GEMINI_API_KEY;
  }

  /**
   * Envia prompt ao Gemini 2.5 Flash, opcionalmente com instruções de sistema
   * e histórico recente da conversa para manter contexto.
   */
  async ask(
    prompt: string,
    systemInstruction?: string,
    history?: ChatHistoryMessage[],
  ): Promise<string | null> {
    if (!this.ai || !process.env.GEMINI_API_KEY) {
      return null;
    }

    try {
      let finalPrompt = prompt;

      // Se houver histórico recente, contextualiza a conversa
      if (history && history.length > 0) {
        const historyText = history
          .slice(-6) // últimas 6 mensagens
          .map((m) => `${m.role === 'user' ? 'Cliente' : 'Assistente'}: ${m.content}`)
          .join('\n');

        finalPrompt = `Histórico da conversa recente:\n${historyText}\n\nCliente: ${prompt}\nAssistente:`;
      }

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: finalPrompt,
        config: systemInstruction
          ? {
              systemInstruction,
              temperature: 0.7,
              maxOutputTokens: 600,
            }
          : {
              maxOutputTokens: 600,
            },
      });

      return response.text ? response.text.trim() : null;
    } catch (err: any) {
      this.logger.warn(`Erro na chamada ao Gemini AI: ${err?.message || err}`);
      return null;
    }
  }
}