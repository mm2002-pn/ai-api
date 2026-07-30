import axios from 'axios';
import FormData from 'form-data';
import { GeminiProvider } from '../providers/gemini.provider';
import { GroqProvider } from '../providers/groq.provider';
import { env } from '../config/env';
import { logger } from '../config/logger';

const gemini = new GeminiProvider();
const groq = new GroqProvider();

export const transcribeAudio = async (
  audioBuffer: Buffer,
  mimeType: string = 'audio/ogg',
  provider: 'whisper_local' | 'gemini' | 'groq' = 'whisper_local'
): Promise<string> => {

  if (provider === 'whisper_local') {
    try {
      const form = new FormData();
      form.append('audio', audioBuffer, { filename: 'audio.ogg', contentType: mimeType });
      const response = await axios.post(`${env.whisperUrl}/transcribe`, form, {
        headers: form.getHeaders(),
        timeout: 30000,
      });
      return response.data?.text ?? '';
    } catch (err) {
      logger.warn('Whisper local failed, fallback to Gemini', { err });
      return transcribeAudio(audioBuffer, mimeType, 'gemini');
    }
  }

  if (provider === 'gemini') {
    try {
      return await gemini.transcribeAudio(audioBuffer, mimeType);
    } catch (err) {
      logger.warn('Gemini transcription failed, fallback to Groq', { err });
      return transcribeAudio(audioBuffer, mimeType, 'groq');
    }
  }

  if (provider === 'groq') {
    return groq.transcribeAudio(audioBuffer, 'audio.ogg');
  }

  return '';
};
