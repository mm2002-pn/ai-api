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

  // Railway S3-compatible bucket (same pattern as diayma project)
  s3Bucket: process.env['BUCKET'] ?? '',
  s3Endpoint: process.env['ENDPOINT'] ?? '',
  s3AccessKeyId: process.env['ACCESS_KEY_ID'] ?? '',
  s3SecretAccessKey: process.env['SECRET_ACCESS_KEY'] ?? '',
  s3Region: process.env['REGION'] ?? 'us-east-1',
  s3PublicUrl: process.env['BUCKET_PUBLIC_URL'] ?? '',
  appUrl: process.env['APP_URL'] ?? 'http://localhost:4000',
};
