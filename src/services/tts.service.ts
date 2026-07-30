import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const textToSpeech = async (text: string): Promise<Buffer | null> => {
  try {
    const response = await axios.get(`${env.ttsUrl}/tts`, {
      params: { text },
      responseType: 'arraybuffer',
      timeout: 15000,
    });
    return Buffer.from(response.data as ArrayBuffer);
  } catch (err) {
    logger.warn('TTS service failed', { err });
    return null;
  }
};
