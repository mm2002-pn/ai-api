import { ClaudeProvider } from '../providers/claude.provider';
import { getSession, createSession, saveSession, addToHistory } from '../memory/redis.memory';
import { detectLanguage } from './language.service';
import { btpSystemPrompt } from '../prompts/system.prompt';
import { ChatMessage } from '../interfaces/AIProvider';

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

  const sessionId = phone ? `${tenantId}:${phone}` : `${tenantId}:${userId}`;

  let session = await getSession(sessionId);
  if (!session) {
    session = createSession(phone ?? userId, tenantId);
    await saveSession(session);
  }

  // Sépare le texte utilisateur du contexte injecté [CHANTIERS DISPONIBLES]
  const userTextOnly = message.split('\n\n[CHANTIERS DISPONIBLES]')[0];
  const language = detectLanguage(userTextOnly);

  // Historique Redis = texte utilisateur propre (sans contexte injecté)
  // Message envoyé à Claude = texte complet avec contexte (uniquement pour le tour courant)
  const history: ChatMessage[] = session.history.slice(-30).map((h) => ({
    role: h.role,
    content: h.content,
  }));
  history.push({ role: 'user', content: message });

  const response = await claude.chat({
    system: btpSystemPrompt,
    messages: history,
    tools: [],
    maxTokens: 1024,
  });

  const reply = response.text ?? '';

  let parsed: Record<string, unknown> = { type: 'response_user', data: { message: reply } };
  try {
    const raw = typeof reply === 'string' ? reply : JSON.stringify(reply);
    const candidate = JSON.parse(raw);
    if (candidate && typeof candidate.type === 'string') {
      parsed = candidate;
    }
  } catch {
    const match = reply.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const candidate = JSON.parse(match[0]);
        if (candidate && typeof candidate.type === 'string') parsed = candidate;
      } catch { /* garder le fallback */ }
    }
  }

  // Sauvegarder UNIQUEMENT le texte utilisateur dans Redis (pas le contexte injecté)
  await addToHistory(sessionId, 'user', userTextOnly);
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

  const session = await getSession(sessionId);
  const history: ChatMessage[] = (session?.history.slice(-30) ?? []).map((h) => ({
    role: h.role,
    content: h.content,
  }));
  history.push({ role: 'user', content: message });

  let fullReply = '';
  await claude.chatStream({ system: btpSystemPrompt, messages: history }, (chunk) => {
    fullReply += chunk;
    onChunk(chunk);
  });

  await addToHistory(sessionId, 'user', userTextOnly);
  await addToHistory(sessionId, 'assistant', fullReply);
};
