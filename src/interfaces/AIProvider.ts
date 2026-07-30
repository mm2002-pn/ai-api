export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  system?: string;
  tools?: AITool[];
  maxTokens?: number;
  stream?: boolean;
}

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ChatResponse {
  text: string;
  toolCalls?: ToolCall[];
  inputTokens?: number;
  outputTokens?: number;
  stopReason?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface IAIProvider {
  chat(options: ChatOptions): Promise<ChatResponse>;
  chatStream(options: ChatOptions, onChunk: (chunk: string) => void): Promise<void>;
}
