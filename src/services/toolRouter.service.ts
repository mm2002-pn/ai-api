import { ITool, ToolContext, ToolResult } from '../interfaces/Tool';
import { expenseTool, listExpensesTool } from '../tools/expense.tool';
import { listProjectsTool, getProjectDetailTool } from '../tools/project.tool';
import { getDashboardTool, getProjectsStatsTool } from '../tools/dashboard.tool';
import { createQuoteTool, listQuotesTool } from '../tools/quote.tool';
import { searchSupplierTool } from '../tools/supplier.tool';
import { logger } from '../config/logger';

const TOOLS: ITool[] = [
  expenseTool,
  listExpensesTool,
  listProjectsTool,
  getProjectDetailTool,
  getDashboardTool,
  getProjectsStatsTool,
  createQuoteTool,
  listQuotesTool,
  searchSupplierTool,
];

export const getToolDefinitions = () =>
  TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }));

export const executeTool = async (
  toolName: string,
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolResult> => {
  const tool = TOOLS.find((t) => t.name === toolName);
  if (!tool) return { success: false, error: `Outil "${toolName}" introuvable` };

  logger.debug(`Executing tool: ${toolName}`, { input });
  return tool.execute(input, ctx);
};
