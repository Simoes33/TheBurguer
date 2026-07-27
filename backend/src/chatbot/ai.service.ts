import { Injectable } from "@nestjs/common";
import { GoogleGenAI } from "@google/genai";

@Injectable()
export class AiService {

  private ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  async ask(prompt: string) {

    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text;
  }
}