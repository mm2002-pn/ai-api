import { ClaudeProvider } from '../providers/claude.provider';
import { getSession, createSession, saveSession, addToHistory } from '../memory/redis.memory';
import { detectLanguage } from './language.service';
import { translateWolofToFrench } from './translation.service';
import { detectIntent } from './intent.service';
import { getToolDefinitions, executeTool } from './toolRouter.service';
import { btpSystemPrompt } from '../prompts/system.prompt';
import { ToolContext } from '../interfaces/Tool';
import { ChatMessage } from '../interfaces/AIProvider';
import { logger } from '../config/logger';

const claude = new ClaudeProvider();

export interface ChatInput {
  userId: string;
  tenantId: string;
  accessToken: string;
  message: string;
}

export interface ChatOutput {
  reply: string;
  language: string;
  intent: string;
  toolsUsed: string[];
}

export const chat = async (input: ChatInput): Promise<ChatOutput> => {
  const { userId, tenantId, accessToken, message } = input;
  const sessionId = `${tenantId}:${userId}`;

  // Récupérer ou créer la session
  let session = await getSession(sessionId);
  if (!session) {
    session = createSession(userId, tenantId);
    await saveSession(session);
  }

  // Détection langue + traduction si wolof
  const language = detectLanguage(message);
  let processedMessage = message;
  if (language === 'wo') {
    processedMessage = await translateWolofToFrench(message);
    logger.debug('Translated wolof', { original: message, translated: processedMessage });
  }

  // Détection intention
  const intent = await detectIntent(processedMessage);
  logger.debug('Intent detected', { intent, language });

  // Construire l'historique pour Claude
  const history: ChatMessage[] = session.history.slice(-10).map((h) => ({
    role: h.role,
    content: h.content,
  }));
  history.push({ role: 'user', content: processedMessage });

  const toolCtx: ToolContext = { tenantId, userId, accessToken };
  const toolsUsed: string[] = [];

  // Premier appel Claude avec tools
  let response = await claude.chat({
    system: btpSystemPrompt,
    messages: history,
    tools: getToolDefinitions(),
    maxTokens: 1024,
  });

  // Boucle tool use (agentic loop)
  let iterations = 0;
  while (response.toolCalls?.length && iterations < 5) {
    iterations++;
    const toolResults: ChatMessage[] = [];

    for (const toolCall of response.toolCalls) {
      toolsUsed.push(toolCall.name);
      const result = await executeTool(toolCall.name, toolCall.input, toolCtx);
      toolResults.push({
        role: 'user',
        content: JSON.stringify({
          tool_result: { tool_use_id: toolCall.id, content: JSON.stringify(result.data ?? result.error) },
        }),
      });
    }

    // Relancer Claude avec les résultats des outils
    const updatedHistory = [
      ...history,
      { role: 'assistant' as const, content: response.text || '[tool call]' },
      ...toolResults,
    ];

    response = await claude.chat({
      system: btpSystemPrompt,
      messages: updatedHistory,
      tools: getToolDefinitions(),
      maxTokens: 1024,
    });
  }

  const reply = response.text;

  // Sauvegarder dans l'historique
  await addToHistory(sessionId, 'user', message);
  await addToHistory(sessionId, 'assistant', reply);

  // Mettre à jour les métadonnées de session
  session.language = language;
  session.lastIntent = intent;
  await saveSession(session);

  return { reply, language, intent, toolsUsed };
};

export const streamChat = async (
  input: ChatInput,
  onChunk: (chunk: string) => void
): Promise<void> => {
  const { userId, tenantId, message } = input;
  const sessionId = `${tenantId}:${userId}`;

  const language = detectLanguage(message);
  let processedMessage = message;
  if (language === 'wo') {
    processedMessage = await translateWolofToFrench(message);
  }

  const session = await getSession(sessionId);
  const history: ChatMessage[] = (session?.history.slice(-10) ?? []).map((h) => ({
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
