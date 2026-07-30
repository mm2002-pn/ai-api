import Anthropic from '@anthropic-ai/sdk';
import { IAIProvider, ChatOptions, ChatResponse } from '../interfaces/AIProvider';
import { env } from '../config/env';

export class ClaudeProvider implements IAIProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: env.anthropicApiKey });
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    const tools = options.tools?.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: { type: 'object' as const, ...t.parameters },
    }));

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: options.maxTokens ?? 1024,
      system: options.system,
      messages: options.messages,
      ...(tools?.length ? { tools } : {}),
    });

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    const toolCalls = response.content
      .filter((b) => b.type === 'tool_use')
      .map((b) => {
        const tb = b as { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };
        return { id: tb.id, name: tb.name, input: tb.input };
      });

    return {
      text,
      toolCalls,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      stopReason: response.stop_reason ?? undefined,
    };
  }

  async chatStream(options: ChatOptions, onChunk: (chunk: string) => void): Promise<void> {
    const stream = this.client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: options.maxTokens ?? 1024,
      system: options.system,
      messages: options.messages,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        onChunk(event.delta.text);
      }
    }
  }
}
