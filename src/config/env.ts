import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: parseInt(process.env['PORT'] ?? '4000', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',

  anthropicApiKey: process.env['ANTHROPIC_API_KEY'] ?? '',
  geminiApiKey: process.env['GEMINI_API_KEY'] ?? '',
  groqApiKey: process.env['GROQ_API_KEY'] ?? '',

  btpApiUrl: process.env['BTP_API_URL'] ?? 'http://localhost:3000',
  btpApiSecret: process.env['BTP_API_SECRET'] ?? '',

  redisUrl: process.env['REDIS_URL'] ?? 'redis://localhost:6379',

  whisperUrl: process.env['WHISPER_URL'] ?? 'http://185.227.108.55:5003',
  translatorUrl: process.env['TRANSLATOR_URL'] ?? 'http://185.227.108.55:5001',
  ttsUrl: process.env['TTS_URL'] ?? 'http://185.227.108.55:5002',

  defaultAiProvider: process.env['DEFAULT_AI_PROVIDER'] ?? 'claude',
  defaultTranscriptionProvider: process.env['DEFAULT_TRANSCRIPTION_PROVIDER'] ?? 'gemini',
};
