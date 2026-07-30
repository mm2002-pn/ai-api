import { ITool, ToolResult, ToolContext } from '../interfaces/Tool';
import { createBtpClient } from '../utils/btpClient';

export const expenseTool: ITool = {
  name: 'create_expense',
  description: 'Crée une dépense sur un chantier BTP. Utiliser quand l\'utilisateur mentionne un achat, un paiement ou une facture.',
  parameters: {
    properties: {
      projectId: { type: 'string', description: 'ID du chantier' },
      description: { type: 'string', description: 'Description de la dépense' },
      amount: { type: 'number', description: 'Montant en FCFA' },
      category: { type: 'string', enum: ['Matériaux', "Main d'oeuvre", 'Transport', 'Équipement', 'Autre'] },
      supplierId: { type: 'string', description: 'ID du fournisseur (optionnel)' },
      source: { type: 'string', enum: ['MANUAL', 'WHATSAPP', 'AI_EXTRACTED'], default: 'AI_EXTRACTED' },
    },
    required: ['projectId', 'description', 'amount'],
  },
  async execute(input, ctx: ToolContext): Promise<ToolResult> {
    try {
      const client = createBtpClient(ctx.accessToken);
      const { data } = await client.post('/api/expenses', { ...input, source: 'AI_EXTRACTED' });
      return { success: true, data: data.data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur création dépense';
      return { success: false, error: msg };
    }
  },
};

export const listExpensesTool: ITool = {
  name: 'list_expenses',
  description: 'Liste les dépenses d\'un chantier avec le total.',
  parameters: {
    properties: {
      projectId: { type: 'string', description: 'ID du chantier (optionnel)' },
      from: { type: 'string', description: 'Date début (YYYY-MM-DD)' },
      to: { type: 'string', description: 'Date fin (YYYY-MM-DD)' },
    },
    required: [],
  },
  async execute(input, ctx: ToolContext): Promise<ToolResult> {
    try {
      const client = createBtpClient(ctx.accessToken);
      const { data } = await client.get('/api/expenses', { params: input });
      return { success: true, data: data.data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur liste dépenses';
      return { success: false, error: msg };
    }
  },
};
