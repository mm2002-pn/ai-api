import { ITool, ToolResult, ToolContext } from '../interfaces/Tool';
import { createBtpClient } from '../utils/btpClient';

export const searchSupplierTool: ITool = {
  name: 'search_supplier',
  description: 'Recherche un fournisseur par nom.',
  parameters: {
    properties: {
      search: { type: 'string', description: 'Nom ou partie du nom du fournisseur' },
    },
    required: ['search'],
  },
  async execute(input, ctx: ToolContext): Promise<ToolResult> {
    try {
      const client = createBtpClient(ctx.accessToken);
      const { data } = await client.get('/api/suppliers', { params: { search: input['search'] } });
      return { success: true, data: data.data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur recherche fournisseur';
      return { success: false, error: msg };
    }
  },
};
