import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

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

  async ask(prompt: string, systemInstruction?: string): Promise<string | null> {
    if (!this.ai || !process.env.GEMINI_API_KEY) {
      return null;
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: systemInstruction
          ? {
              systemInstruction,
              temperature: 0.7,
              maxOutputTokens: 350,
            }
          : undefined,
      });

      return response.text || null;
    } catch (err: any) {
      this.logger.warn(`Erro na chamada ao Gemini AI: ${err?.message}`);
      return null;
    }
  }
}