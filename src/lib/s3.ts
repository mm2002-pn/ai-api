import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { env } from '../config/env';
import { Readable } from 'stream';

export const useS3 = !!(env.s3Bucket && env.s3Endpoint && env.s3AccessKeyId);

const s3 = useS3
  ? new S3Client({
      region: env.s3Region,
      endpoint: env.s3Endpoint,
      credentials: { accessKeyId: env.s3AccessKeyId, secretAccessKey: env.s3SecretAccessKey },
      forcePathStyle: true,
    })
  : null;

/**
 * Upload image to Railway S3 bucket.
 * Returns a proxy URL via the ai-api backend (same pattern as diayma project).
 * Bucket is private — images are always served through the backend proxy.
 */
export const uploadImage = async (buffer: Buffer, mimeType: string, folder = 'chantiers'): Promise<string> => {
  const ext = mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg';
  const rand = crypto.randomBytes(12).toString('hex');
  const filename = `${Date.now()}-${rand}${ext}`;
  const key = `${folder}/${filename}`;

  if (!s3 || !useS3) {
    throw new Error('S3 not configured');
  }

  await s3.send(new PutObjectCommand({
    Bucket: env.s3Bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));

  // Return proxy URL (backend serves the image, bucket stays private)
  return `${env.appUrl.replace(/\/$/, '')}/uploads/${key}`;
};

/**
 * Stream an object from S3 to an HTTP response (proxy route handler).
 */
export const streamFromS3 = async (key: string): Promise<{ stream: Readable; contentType: string }> => {
  if (!s3) throw new Error('S3 not configured');

  const data = await s3.send(new GetObjectCommand({ Bucket: env.s3Bucket, Key: key }));

  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const contentType = mimeMap[ext] ?? 'image/jpeg';

  return { stream: data.Body as Readable, contentType };
};
