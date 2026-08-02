import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIProvider, ChatOptions, ChatResponse } from '../interfaces/AIProvider';
import { env } from '../config/env';

export class GeminiProvider implements IAIProvider {
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(env.geminiApiKey);
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const history = options.messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = options.messages[options.messages.length - 1]?.content ?? '';

    const chat = model.startChat({
      history,
      systemInstruction: options.system,
    });

    const result = await chat.sendMessage(lastMessage);
    const text = result.response.text();

    return { text };
  }

  async chatStream(options: ChatOptions, onChunk: (chunk: string) => void): Promise<void> {
    const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const lastMessage = options.messages[options.messages.length - 1]?.content ?? '';

    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: lastMessage }] }],
      systemInstruction: options.system,
    });

    for await (const chunk of result.stream) {
      onChunk(chunk.text());
    }
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Tu reçois un message vocal en wolof et/ou en français. Analyse-le.
Tâches :
1. lang : "wo" si wolof (même mélangé français), "fr" si français uniquement.
2. original : transcription mot pour mot dans la langue parlée.
3. french : traduction française fidèle (si lang="fr", identique à original).

Si rien d'intelligible : tous les champs vides, lang="fr".
Réponds UNIQUEMENT en JSON strict sans markdown :
{"lang":"wo"|"fr","original":"...","french":"..."}`;

    const result = await model.generateContent([
      { inlineData: { data: audioBuffer.toString('base64'), mimeType } },
      prompt,
    ]);

    const raw = result.response.text().trim()
      .replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

    try {
      const obj = JSON.parse(raw) as { lang?: string; original?: string; french?: string };
      const french = (obj.french || obj.original || '').trim();
      return french;
    } catch {
      return raw;
    }
  }
}
