export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ITool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult>;
}

export interface ToolContext {
  tenantId: string;
  userId: string;
  accessToken: string;
}
