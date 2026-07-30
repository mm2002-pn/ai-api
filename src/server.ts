import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';

app.listen(env.port, () => {
  logger.info(`🤖 AI API démarrée sur le port ${env.port}`);
  logger.info(`📡 Environnement: ${env.nodeEnv}`);
  logger.info(`🧠 Provider IA: ${env.defaultAiProvider}`);
  logger.info(`🎙️  Transcription: ${env.defaultTranscriptionProvider}`);
});
