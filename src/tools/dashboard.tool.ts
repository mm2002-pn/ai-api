import { ITool, ToolResult, ToolContext } from '../interfaces/Tool';
import { createBtpClient } from '../utils/btpClient';

export const getDashboardTool: ITool = {
  name: 'get_dashboard',
  description: 'Obtient le résumé global de l\'entreprise : chantiers actifs, dépenses du mois, devis acceptés, top fournisseurs.',
  parameters: { properties: {}, required: [] },
  async execute(_input, ctx: ToolContext): Promise<ToolResult> {
    try {
      const client = createBtpClient(ctx.accessToken);
      const { data } = await client.get('/api/dashboard');
      return { success: true, data: data.data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur dashboard';
      return { success: false, error: msg };
    }
  },
};

export const getProjectsStatsTool: ITool = {
  name: 'get_projects_stats',
  description: 'Obtient les statistiques financières de tous les chantiers : budget vs dépenses.',
  parameters: { properties: {}, required: [] },
  async execute(_input, ctx: ToolContext): Promise<ToolResult> {
    try {
      const client = createBtpClient(ctx.accessToken);
      const { data } = await client.get('/api/dashboard/projects');
      return { success: true, data: data.data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur stats projets';
      return { success: false, error: msg };
    }
  },
};
