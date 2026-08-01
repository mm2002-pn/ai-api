import { Language } from '../interfaces/Conversation';

const WOLOF_MARKERS = [
  'dafa', 'damaa', 'bëgg', 'naan', 'fàww', 'ndax',
  'waaw', 'déedéet', 'xam', 'dem', 'ñëw', 'jëf', 'bind', 'jàng', 'lekk',
  'dëkk', 'nit', 'xale', 'jaamu', 'yëgël', 'sopp', 'wax', 'tëdd', 'togg',
  'wolof', 'teranga', 'ndank', 'xeex', 'mbokk', 'sama',
  // Mots courts : uniquement en tant que mots entiers (\b)
  'ci', 'bi', 'bu', 'ni', 'sa', 'mu',
];

const ARABIC_PATTERN = /[؀-ۿ]/;

// Teste si le marker apparaît comme mot entier (pas comme sous-chaîne)
const hasWordMarker = (text: string, marker: string): boolean => {
  const re = new RegExp(`(?<![\\w\\u00C0-\\u024F])${marker}(?![\\w\\u00C0-\\u024F])`, 'i');
  return re.test(text);
};

export const detectLanguage = (text: string): Language => {
  if (!text || text.trim().length === 0) return 'unknown';

  const lower = text.toLowerCase();

  if (ARABIC_PATTERN.test(text)) return 'ar';

  const wolofScore = WOLOF_MARKERS.filter((w) => hasWordMarker(lower, w)).length;
  if (wolofScore >= 2) return 'wo';

  const frenchMarkers = ['je ', 'tu ', 'il ', 'nous ', 'vous ', 'ils ', 'les ', 'des ', 'est ', 'sont ', 'avec ', 'pour '];
  const frenchScore = frenchMarkers.filter((w) => lower.includes(w)).length;
  if (frenchScore >= 2) return 'fr';

  const englishMarkers = ['the ', 'is ', 'are ', 'have ', 'this ', 'that ', 'with ', 'for ', 'you '];
  const englishScore = englishMarkers.filter((w) => lower.includes(w)).length;
  if (englishScore >= 2) return 'en';

  // Exige au moins 2 marqueurs wolof — jamais détecter wolof sur 1 seul mot ambigu
  return 'fr';
};
