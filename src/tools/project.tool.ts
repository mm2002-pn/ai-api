import { ITool, ToolResult, ToolContext } from '../interfaces/Tool';
import { createBtpClient } from '../utils/btpClient';

export const listProjectsTool: ITool = {
  name: 'list_projects',
  description: 'Liste les chantiers de l\'entreprise avec leur statut et budget.',
  parameters: {
    properties: {
      status: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] },
    },
    required: [],
  },
  async execute(input, ctx: ToolContext): Promise<ToolResult> {
    try {
      const client = createBtpClient(ctx.accessToken);
      const { data } = await client.get('/api/projects', { params: input });
      return { success: true, data: data.data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur liste projets';
      return { success: false, error: msg };
    }
  },
};

export const getProjectDetailTool: ITool = {
  name: 'get_project_detail',
  description: 'Obtient le détail d\'un chantier avec ses stats financières (budget, dépenses, restant).',
  parameters: {
    properties: {
      projectId: { type: 'string', description: 'ID du chantier' },
    },
    required: ['projectId'],
  },
  async execute(input, ctx: ToolContext): Promise<ToolResult> {
    try {
      const client = createBtpClient(ctx.accessToken);
      const { data } = await client.get(`/api/projects/${input['projectId']}`);
      return { success: true, data: data.data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur détail projet';
      return { success: false, error: msg };
    }
  },
};
