import Redis from 'ioredis';
import { env } from '../config/env';
import { ConversationSession, Language, Intent } from '../interfaces/Conversation';
import { logger } from '../config/logger';

const SESSION_TTL = 60 * 60 * 24; // 24h

// In-memory fallback used when Redis is unavailable
const memStore = new Map<string, { data: string; expiresAt: number }>();
const memGet = (key: string): string | null => {
  const e = memStore.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) { memStore.delete(key); return null; }
  return e.data;
};
const memSetex = (key: string, ttlSec: number, value: string): void => {
  memStore.set(key, { data: value, expiresAt: Date.now() + ttlSec * 1000 });
};

let redis: Redis | null = null;
let redisOk = false;

const getRedis = (): Redis | null => {
  if (!redis) {
    try {
      redis = new Redis(env.redisUrl, { lazyConnect: true, enableOfflineQueue: false, connectTimeout: 3000 });
      redis.on('connect', () => { redisOk = true; });
      redis.on('error', () => { redisOk = false; });
    } catch {
      return null;
    }
  }
  return redisOk ? redis : null;
};

const sessionKey = (sessionId: string) => `btp:session:${sessionId}`;

export const getSession = async (sessionId: string): Promise<ConversationSession | null> => {
  const client = getRedis();
  const key = sessionKey(sessionId);
  try {
    const data = client ? await client.get(key) : memGet(key);
    return data ? (JSON.parse(data) as ConversationSession) : null;
  } catch {
    const data = memGet(key);
    return data ? (JSON.parse(data) as ConversationSession) : null;
  }
};

export const saveSession = async (session: ConversationSession): Promise<void> => {
  const client = getRedis();
  const key = sessionKey(session.sessionId);
  session.updatedAt = Date.now();
  const value = JSON.stringify(session);
  try {
    if (client) {
      await client.setex(key, SESSION_TTL, value);
    } else {
      memSetex(key, SESSION_TTL, value);
    }
  } catch (err) {
    logger.warn('Redis saveSession failed, using memory fallback', { err });
    memSetex(key, SESSION_TTL, value);
  }
};

export const createSession = (userId: string, tenantId: string): ConversationSession => ({
  sessionId: `${tenantId}:${userId}`,
  userId,
  tenantId,
  language: 'fr',
  history: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const addToHistory = async (
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> => {
  let session = await getSession(sessionId);
  if (!session) return;

  session.history.push({ role, content, timestamp: Date.now() });
  // Garder uniquement les 20 derniers échanges
  if (session.history.length > 20) session.history = session.history.slice(-20);

  await saveSession(session);
};

export const updateSessionMeta = async (
  sessionId: string,
  meta: { language?: Language; lastIntent?: Intent; lastProjectId?: string }
): Promise<void> => {
  const session = await getSession(sessionId);
  if (!session) return;
  Object.assign(session, meta);
  await saveSession(session);
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  const client = getRedis();
  if (!client) return;
  await client.del(sessionKey(sessionId));
};
