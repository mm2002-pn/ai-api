import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import aiRoutes from './routes/ai.routes';
import { useS3, streamFromS3 } from './lib/s3';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use(limiter);

// Proxy privé S3 — même pattern que diayma project
// GET /uploads/chantiers/:filename → stream depuis Railway bucket (privé)
if (useS3) {
  app.get(
    '/uploads/:folder/:filename',
    helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = `${req.params['folder']}/${req.params['filename']}`;
        const { stream, contentType } = await streamFromS3(key);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 jours
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        stream.pipe(res);
      } catch (err: unknown) {
        const e = err as { name?: string };
        if (e.name === 'NoSuchKey') res.status(404).json({ success: false, message: 'Image introuvable' });
        else next(err);
      }
    }
  );
}

app.use('/ai', aiRoutes);

app.get('/', (_req, res) => { res.json({ ok: true }); });
app.get('/health', (_req, res) => { res.json({ ok: true }); });

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route introuvable' });
});

export default app;
