import { Router } from 'express';
import {
  chatController,
  chatStreamController,
  transcribeController,
  ttsController,
  translateController,
  intentController,
  providersController,
} from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadAudio } from '../middleware/upload.middleware';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ai-api', timestamp: new Date().toISOString() });
});

router.get('/providers', providersController);

router.use(authenticate);

router.post('/chat', chatController);
router.post('/chat/stream', chatStreamController);
router.post('/transcribe', uploadAudio, transcribeController);
router.post('/tts', ttsController);
router.post('/translate', translateController);
router.post('/intent', intentController);

export default router;
