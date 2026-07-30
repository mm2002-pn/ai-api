import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const translateWolofToFrench = async (text: string): Promise<string> => {
  try {
    const response = await axios.post(
      `${env.translatorUrl}/translate`,
      new URLSearchParams({ text }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
    );
    return response.data?.translation ?? text;
  } catch (err) {
    logger.warn('Translation failed, using original text', { err });
    return text;
  }
};
