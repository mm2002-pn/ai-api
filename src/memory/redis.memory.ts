import Redis from 'ioredis';
import { env } from '../config/env';
import { ConversationSession, Language, Intent } from '../interfaces/Conversation';
import { logger } from '../config/logger';

const SESSION_TTL = 60 * 60 * 24; // 24h

let redis: Redis | null = null;

const getRedis = (): Redis | null => {
  if (!redis) {
    try {
      redis = new Redis(env.redisUrl, { lazyConnect: true, enableOfflineQueue: false });
      redis.on('error', () => { redis = null; });
    } catch {
      return null;
    }
  }
  return redis;
};

const sessionKey = (sessionId: string) => `btp:session:${sessionId}`;

export const getSession = async (sessionId: string): Promise<ConversationSession | null> => {
  const client = getRedis();
  if (!client) return null;
  try {
    const data = await client.get(sessionKey(sessionId));
    return data ? (JSON.parse(data) as ConversationSession) : null;
  } catch {
    return null;
  }
};

export const saveSession = async (session: ConversationSession): Promise<void> => {
  const client = getRedis();
  if (!client) return;
  try {
    session.updatedAt = Date.now();
    await client.setex(sessionKey(session.sessionId), SESSION_TTL, JSON.stringify(session));
  } catch (err) {
    logger.warn('Redis saveSession failed', { err });
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
