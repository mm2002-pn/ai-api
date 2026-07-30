import { ITool, ToolResult, ToolContext } from '../interfaces/Tool';
import { createBtpClient } from '../utils/btpClient';

export const createQuoteTool: ITool = {
  name: 'create_quote',
  description: 'Crée un devis pour un chantier.',
  parameters: {
    properties: {
      projectId: { type: 'string', description: 'ID du chantier' },
      title: { type: 'string', description: 'Titre du devis' },
      description: { type: 'string', description: 'Description des travaux' },
      amount: { type: 'number', description: 'Montant estimé en FCFA' },
    },
    required: ['projectId', 'title', 'amount'],
  },
  async execute(input, ctx: ToolContext): Promise<ToolResult> {
    try {
      const client = createBtpClient(ctx.accessToken);
      const { data } = await client.post('/api/quotes', input);
      return { success: true, data: data.data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur création devis';
      return { success: false, error: msg };
    }
  },
};

export const listQuotesTool: ITool = {
  name: 'list_quotes',
  description: 'Liste les devis d\'un chantier.',
  parameters: {
    properties: {
      projectId: { type: 'string' },
      status: { type: 'string', enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'] },
    },
    required: [],
  },
  async execute(input, ctx: ToolContext): Promise<ToolResult> {
    try {
      const client = createBtpClient(ctx.accessToken);
      const { data } = await client.get('/api/quotes', { params: input });
      return { success: true, data: data.data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur liste devis';
      return { success: false, error: msg };
    }
  },
};
