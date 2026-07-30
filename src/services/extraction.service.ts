import { ClaudeProvider } from '../providers/claude.provider';
import { extractionPrompt } from '../prompts/system.prompt';
import { logger } from '../config/logger';

const claude = new ClaudeProvider();

export interface ExtractedExpense {
  description: string;
  amount: number | null;
  category: string | null;
  supplierName: string | null;
  projectName: string | null;
  date: string | null;
}

export interface ExtractedQuote {
  title: string;
  description: string | null;
  estimatedAmount: number | null;
  projectName: string | null;
}

export const extractExpenseData = async (text: string): Promise<ExtractedExpense> => {
  try {
    const response = await claude.chat({
      system: extractionPrompt,
      messages: [
        {
          role: 'user',
          content: `Extrais les données de dépense de ce message et réponds UNIQUEMENT en JSON valide :\n\n"${text}"`,
        },
      ],
      maxTokens: 300,
    });

    const json = response.text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) throw new Error('No JSON in response');

    return JSON.parse(json) as ExtractedExpense;
  } catch (err) {
    logger.warn('Expense extraction failed', { err });
    return {
      description: text,
      amount: null,
      category: null,
      supplierName: null,
      projectName: null,
      date: null,
    };
  }
};

export const extractQuoteData = async (text: string): Promise<ExtractedQuote> => {
  try {
    const response = await claude.chat({
      system: extractionPrompt,
      messages: [
        {
          role: 'user',
          content: `Extrais les données de devis de ce message et réponds UNIQUEMENT en JSON valide :\n\n"${text}"`,
        },
      ],
      maxTokens: 300,
    });

    const json = response.text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) throw new Error('No JSON in response');

    return JSON.parse(json) as ExtractedQuote;
  } catch (err) {
    logger.warn('Quote extraction failed', { err });
    return { title: text, description: null, estimatedAmount: null, projectName: null };
  }
};
