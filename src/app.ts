import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import aiRoutes from './routes/ai.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use(limiter);

app.use('/ai', aiRoutes);

app.get('/', (_req, res) => { res.json({ ok: true }); });
app.get('/health', (_req, res) => { res.json({ ok: true }); });

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route introuvable' });
});

export default app;
