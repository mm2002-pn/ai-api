import { Language } from '../interfaces/Conversation';

// Mots fréquents en wolof
const WOLOF_MARKERS = [
  'dafa', 'damaa', 'bëgg', 'naan', 'fàww', 'ci', 'bi', 'bu', 'ni', 'ndax',
  'waaw', 'déedéet', 'xam', 'dem', 'ñëw', 'jëf', 'bind', 'jàng', 'lekk',
  'dëkk', 'nit', 'xale', 'jaamu', 'yëgël', 'sopp', 'wax', 'tëdd', 'togg',
  'wolof', 'teranga', 'ndank', 'xeex', 'mbokk', 'sama', 'sa', 'mu',
];

const ARABIC_PATTERN = /[؀-ۿ]/;

export const detectLanguage = (text: string): Language => {
  if (!text || text.trim().length === 0) return 'unknown';

  const lower = text.toLowerCase();

  if (ARABIC_PATTERN.test(text)) return 'ar';

  const wolofScore = WOLOF_MARKERS.filter((w) => lower.includes(w)).length;
  if (wolofScore >= 2) return 'wo';

  // Indicateurs français simples
  const frenchMarkers = ['je ', 'tu ', 'il ', 'nous ', 'vous ', 'ils ', 'les ', 'des ', 'est ', 'sont ', 'avec ', 'pour '];
  const frenchScore = frenchMarkers.filter((w) => lower.includes(w)).length;
  if (frenchScore >= 2) return 'fr';

  const englishMarkers = ['the ', 'is ', 'are ', 'have ', 'this ', 'that ', 'with ', 'for ', 'you '];
  const englishScore = englishMarkers.filter((w) => lower.includes(w)).length;
  if (englishScore >= 2) return 'en';

  // Si un seul mot wolof, probablement wolof quand même
  if (wolofScore >= 1) return 'wo';

  return 'fr'; // défaut
};
