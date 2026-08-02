import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { uploadImage } from '../lib/s3';

const client = new Anthropic({ apiKey: env.anthropicApiKey });

export interface OcrResult { text: string; category: 'recu' | 'photo_chantier' | 'autre'; imageUrl?: string; }

export const ocrReceipt = async (imageBuffer: Buffer, mimeType: string): Promise<OcrResult> => {
  const mediaType = (
    mimeType.startsWith('image/') ? mimeType : 'image/jpeg'
  ) as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

  const base64 = imageBuffer.toString('base64');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 }
        },
        {
          type: 'text',
          text: `Analyse cette image dans le contexte d'un chantier BTP.
Réponds en deux parties séparées par "---" :
1. Une phrase décrivant ce que tu vois (article/montant/fournisseur si c'est un reçu, ou description de la scène si c'est un chantier).
2. CATEGORIE: recu | photo_chantier | autre

Exemple reçu: "Reçu Quincaillerie Ndar — 15 sacs ciment — 75 000 FCFA.\n---\nCATEGORIE: recu"
Exemple photo: "Vue du chantier : fondations en cours, 3 ouvriers présents.\n---\nCATEGORIE: photo_chantier"`
        }
      ]
    }]
  });

  const raw = response.content[0]?.type === 'text' ? response.content[0].text : '';
  if (!raw) throw new Error('OCR returned empty response');

  const parts = raw.split('---');
  const text = (parts[0] ?? raw).trim();
  const catLine = (parts[1] ?? '').toLowerCase();
  const category = catLine.includes('recu') ? 'recu'
    : catLine.includes('photo_chantier') ? 'photo_chantier'
    : 'autre';

  // Upload image to S3 bucket (Railway) in parallel with OCR result
  let imageUrl: string | undefined;
  try {
    imageUrl = await uploadImage(imageBuffer, mimeType, 'chantiers');
  } catch (err) {
    logger.warn('S3 upload failed, continuing without URL', { err });
  }

  logger.info('OCR completed', { chars: text.length, category, imageUrl });
  return { text, category, imageUrl };
};
