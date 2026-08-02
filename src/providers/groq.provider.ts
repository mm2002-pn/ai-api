import Groq from 'groq-sdk';
import { IAIProvider, ChatOptions, ChatResponse } from '../interfaces/AIProvider';
import { env } from '../config/env';

export class GroqProvider implements IAIProvider {
  private client: Groq;

  constructor() {
    this.client = new Groq({ apiKey: env.groqApiKey });
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    const messages = [
      ...(options.system ? [{ role: 'system' as const, content: options.system }] : []),
      ...options.messages,
    ];

    const response = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: options.maxTokens ?? 1024,
      messages,
    });

    const text = response.choices[0]?.message?.content ?? '';
    return { text };
  }

  async chatStream(options: ChatOptions, onChunk: (chunk: string) => void): Promise<void> {
    const messages = [
      ...(options.system ? [{ role: 'system' as const, content: options.system }] : []),
      ...options.messages,
    ];

    const stream = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: options.maxTokens ?? 1024,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) onChunk(text);
    }
  }

  // Whisper via Groq — auto-detect langue (wolof inclus), verbose_json pour récupérer la langue
  async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
    const ext = filename.split('.').pop() ?? 'ogg';
    const mimeMap: Record<string, string> = { ogg: 'audio/ogg', webm: 'audio/webm', mp3: 'audio/mpeg', wav: 'audio/wav', mp4: 'audio/mp4' };
    const mimeType = mimeMap[ext] ?? 'audio/ogg';
    const file = new File([new Uint8Array(audioBuffer)], filename, { type: mimeType });

    // Pas de restriction de langue → Whisper auto-détecte le wolof
    const response = await (this.client.audio.transcriptions.create as Function)({
      file,
      model: 'whisper-large-v3',
      response_format: 'verbose_json',
    });

    return (response as { text: string }).text ?? '';
  }
}
