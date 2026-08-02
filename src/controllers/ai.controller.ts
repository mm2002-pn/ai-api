import { Response } from 'express';
import { AIRequest } from '../middleware/auth.middleware';
import { chat, streamChat } from '../services/conversation.service';
import { transcribeAudio } from '../services/transcription.service';
import { textToSpeech } from '../services/tts.service';
import { translateWolofToFrench } from '../services/translation.service';
import { detectLanguage } from '../services/language.service';
import { detectIntent } from '../services/intent.service';
import { getToolDefinitions } from '../services/toolRouter.service';
import { ocrReceipt } from '../services/ocr.service';
import { logger } from '../config/logger';
import { env } from '../config/env';

export const chatController = async (req: AIRequest, res: Response): Promise<void> => {
  const { message, phone } = req.body as { message?: string; phone?: string };

  if (!message?.trim()) {
    res.status(422).json({ success: false, message: 'Message requis' });
    return;
  }

  try {
    const result = await chat({
      userId: req.userId!,
      tenantId: req.tenantId!,
      accessToken: req.accessToken!,
      message,
      phone,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Chat error', { err });
    res.status(500).json({ success: false, message: 'Erreur IA' });
  }
};

export const chatStreamController = async (req: AIRequest, res: Response): Promise<void> => {
  const { message } = req.body as { message?: string };

  if (!message?.trim()) {
    res.status(422).json({ success: false, message: 'Message requis' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    await streamChat(
      { userId: req.userId!, tenantId: req.tenantId!, accessToken: req.accessToken!, message },
      (chunk) => res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
    );
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    logger.error('Stream error', { err });
    res.write(`data: ${JSON.stringify({ error: 'Erreur streaming' })}\n\n`);
    res.end();
  }
};

export const transcribeController = async (req: AIRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(422).json({ success: false, message: 'Fichier audio requis' });
    return;
  }

  try {
    const provider = (req.query['provider'] as 'whisper_local' | 'gemini' | 'groq') ??
      (env.defaultTranscriptionProvider as 'gemini');

    const text = await transcribeAudio(req.file.buffer, req.file.mimetype, provider);
    const language = detectLanguage(text);

    res.json({ success: true, data: { text, language } });
  } catch (err) {
    logger.error('Transcription error', { err });
    res.status(500).json({ success: false, message: 'Erreur transcription' });
  }
};

export const ttsController = async (req: AIRequest, res: Response): Promise<void> => {
  const { text } = req.body as { text?: string };
  if (!text?.trim()) {
    res.status(422).json({ success: false, message: 'Texte requis' });
    return;
  }

  try {
    const audio = await textToSpeech(text);
    if (!audio) {
      res.status(503).json({ success: false, message: 'Service TTS indisponible' });
      return;
    }
    res.setHeader('Content-Type', 'audio/ogg');
    res.send(audio);
  } catch (err) {
    logger.error('TTS error', { err });
    res.status(500).json({ success: false, message: 'Erreur TTS' });
  }
};

export const translateController = async (req: AIRequest, res: Response): Promise<void> => {
  const { text } = req.body as { text?: string };
  if (!text?.trim()) {
    res.status(422).json({ success: false, message: 'Texte requis' });
    return;
  }

  try {
    const translation = await translateWolofToFrench(text);
    const sourceLang = detectLanguage(text);
    res.json({ success: true, data: { original: text, translation, sourceLang } });
  } catch (err) {
    logger.error('Translation error', { err });
    res.status(500).json({ success: false, message: 'Erreur traduction' });
  }
};

export const intentController = async (req: AIRequest, res: Response): Promise<void> => {
  const { text } = req.body as { text?: string };
  if (!text?.trim()) {
    res.status(422).json({ success: false, message: 'Texte requis' });
    return;
  }

  const language = detectLanguage(text);
  const intent = await detectIntent(text);
  res.json({ success: true, data: { intent, language } });
};

export const ocrController = async (req: AIRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(422).json({ success: false, message: 'Fichier image requis (champ: image)' });
    return;
  }

  try {
    const { text, category, imageUrl } = await ocrReceipt(req.file.buffer, req.file.mimetype);
    res.json({ success: true, data: { text, category, imageUrl } });
  } catch (err) {
    logger.error('OCR error', { err });
    res.status(500).json({ success: false, message: 'Erreur OCR' });
  }
};

export const providersController = (_req: AIRequest, res: Response): void => {
  res.json({
    success: true,
    data: {
      chat: ['claude', 'gemini', 'groq'],
      transcription: ['whisper_local', 'gemini', 'groq'],
      tts: ['espeak_local'],
      translation: ['nllb_local'],
      tools: getToolDefinitions().map((t) => ({ name: t.name, description: t.description })),
    },
  });
};
