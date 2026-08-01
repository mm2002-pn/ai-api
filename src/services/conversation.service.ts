import { ClaudeProvider } from '../providers/claude.provider';
import { getSession, createSession, saveSession, addToHistory } from '../memory/redis.memory';
import { detectLanguage } from './language.service';
import { translateWolofToFrench } from './translation.service';
import { btpSystemPrompt } from '../prompts/system.prompt';
import { ChatMessage } from '../interfaces/AIProvider';
import { logger } from '../config/logger';

const claude = new ClaudeProvider();

export interface ChatInput {
  userId: string;
  tenantId: string;
  accessToken: string;
  message: string;
  phone?: string;
}

export interface ChatOutput {
  reply: string;
  language: string;
  parsed: Record<string, unknown>;
}

export const chat = async (input: ChatInput): Promise<ChatOutput> => {
  const { userId, tenantId, message, phone } = input;

  // Session par numéro de téléphone → chaque utilisateur WhatsApp a sa propre mémoire
  const sessionId = phone ? `${tenantId}:${phone}` : `${tenantId}:${userId}`;

  let session = await getSession(sessionId);
  if (!session) {
    session = createSession(phone ?? userId, tenantId);
    await saveSession(session);
  }

  // Détecter la langue uniquement sur le texte utilisateur (avant le bloc [CHANTIERS DISPONIBLES])
  const userTextOnly = message.split('\n\n[CHANTIERS DISPONIBLES]')[0];
  const language = detectLanguage(userTextOnly);
  let processedMessage = message;
  if (language === 'wo') {
    // Traduire uniquement la partie utilisateur, puis réattacher le contexte injecté
    const contextBlock = message.slice(userTextOnly.length);
    const translatedUser = await translateWolofToFrench(userTextOnly);
    processedMessage = translatedUser + contextBlock;
    logger.debug('Translated wolof', { original: userTextOnly, translated: translatedUser });
  }

  // Construire l'historique (30 derniers messages)
  const history: ChatMessage[] = session.history.slice(-30).map((h) => ({
    role: h.role,
    content: h.content,
  }));
  history.push({ role: 'user', content: processedMessage });

  // Appel Claude — réponse attendue en JSON structuré { type, data }
  const response = await claude.chat({
    system: btpSystemPrompt,
    messages: history,
    tools: [],
    maxTokens: 1024,
  });

  const reply = response.text ?? '';

  // Parser la réponse JSON de Claude
  let parsed: Record<string, unknown> = { type: 'response_user', data: { message: reply } };
  try {
    const raw = typeof reply === 'string' ? reply : JSON.stringify(reply);
    const candidate = JSON.parse(raw);
    if (candidate && typeof candidate.type === 'string') {
      parsed = candidate;
    }
  } catch {
    // Si Claude n'a pas renvoyé du JSON valide, on encapsule le texte
    const match = reply.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const candidate = JSON.parse(match[0]);
        if (candidate && typeof candidate.type === 'string') parsed = candidate;
      } catch { /* garder le fallback */ }
    }
  }

  // Sauvegarder dans l'historique Redis
  await addToHistory(sessionId, 'user', message);
  await addToHistory(sessionId, 'assistant', reply);

  session.language = language;
  await saveSession(session);

  return { reply, language, parsed };
};

export const streamChat = async (
  input: ChatInput,
  onChunk: (chunk: string) => void
): Promise<void> => {
  const { userId, tenantId, message, phone } = input;
  const sessionId = phone ? `${tenantId}:${phone}` : `${tenantId}:${userId}`;

  const userTextOnly = message.split('\n\n[CHANTIERS DISPONIBLES]')[0];
  const language = detectLanguage(userTextOnly);
  let processedMessage = message;
  if (language === 'wo') {
    const contextBlock = message.slice(userTextOnly.length);
    const translatedUser = await translateWolofToFrench(userTextOnly);
    processedMessage = translatedUser + contextBlock;
  }

  const session = await getSession(sessionId);
  const history: ChatMessage[] = (session?.history.slice(-30) ?? []).map((h) => ({
    role: h.role,
    content: h.content,
  }));
  history.push({ role: 'user', content: processedMessage });

  let fullReply = '';
  await claude.chatStream({ system: btpSystemPrompt, messages: history }, (chunk) => {
    fullReply += chunk;
    onChunk(chunk);
  });

  await addToHistory(sessionId, 'user', message);
  await addToHistory(sessionId, 'assistant', fullReply);
};
