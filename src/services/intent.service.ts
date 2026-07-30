import { Intent } from '../interfaces/Conversation';
import { ClaudeProvider } from '../providers/claude.provider';
import { intentDetectionPrompt } from '../prompts/system.prompt';

const claude = new ClaudeProvider();

const INTENT_PATTERNS: Array<{ patterns: RegExp[]; intent: Intent }> = [
  {
    patterns: [/achet|dépen|pay|factur|fourniss|livr|matéri|ciment|fer|sable|gravi/i],
    intent: 'create_expense',
  },
  {
    patterns: [/dépens|combien.*dépen|liste.*dépen|voir.*dépen|dépen.*semain|dépen.*mois/i],
    intent: 'list_expenses',
  },
  {
    patterns: [/budget|restant|combien.*rest|argent.*rest|dépas|solde/i],
    intent: 'check_budget',
  },
  {
    patterns: [/devis|estimat|prix.*travaux|coût.*projet|chiffr/i],
    intent: 'create_quote',
  },
  {
    patterns: [/liste.*devis|voir.*devis|mes devis|devis.*chanties/i],
    intent: 'list_quotes',
  },
  {
    patterns: [/résumé|rapport|bilan|avancement|état.*chantier/i],
    intent: 'project_summary',
  },
  {
    patterns: [/résumé.*aujourd|bilan.*jour|journée|aujourd.*hui/i],
    intent: 'daily_summary',
  },
  {
    patterns: [/mes chantiers|liste.*chantier|projets.*cours|chantiers.*actifs/i],
    intent: 'list_projects',
  },
  {
    patterns: [/fournisseur|contact.*fourniss|infos.*fourniss/i],
    intent: 'supplier_info',
  },
];

export const detectIntent = async (text: string, useLLM = false): Promise<Intent> => {
  // Détection rapide par regex
  for (const { patterns, intent } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return intent;
  }

  if (!useLLM) return 'general_question';

  // Fallback LLM pour les cas ambigus
  try {
    const response = await claude.chat({
      system: intentDetectionPrompt,
      messages: [{ role: 'user', content: text }],
      maxTokens: 50,
    });

    const detected = response.text.trim().toLowerCase() as Intent;
    const validIntents: Intent[] = [
      'create_expense', 'list_expenses', 'check_budget', 'create_quote',
      'list_quotes', 'project_summary', 'daily_summary', 'list_projects',
      'supplier_info', 'general_question',
    ];

    return validIntents.includes(detected) ? detected : 'general_question';
  } catch {
    return 'general_question';
  }
};
