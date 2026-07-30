export type Language = 'fr' | 'wo' | 'en' | 'ar' | 'unknown';

export type Intent =
  | 'create_expense'
  | 'list_expenses'
  | 'check_budget'
  | 'create_quote'
  | 'list_quotes'
  | 'project_summary'
  | 'daily_summary'
  | 'list_projects'
  | 'supplier_info'
  | 'general_question'
  | 'unknown';

export interface ConversationSession {
  sessionId: string;
  userId: string;
  tenantId: string;
  language: Language;
  lastIntent?: Intent;
  lastProjectId?: string;
  history: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>;
  createdAt: number;
  updatedAt: number;
}
