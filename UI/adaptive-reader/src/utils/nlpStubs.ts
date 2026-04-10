// Local NLP utility stubs for client-side text analysis
import { useSessionStore } from '@/store/sessionStore';

/**
 * Get a paragraph by ID from session store
 */
export function getParagraphById(id: string) {
  return useSessionStore.getState().paragraphs.find((p) => p.id === id);
}

/**
 * Identify difficult words using Dale-Chall word list (simplified)
 */
const DIFFICULT_WORDS_SET = new Set([
  'heterogeneous', 'amalgamation', 'jurisprudential', 'precedents',
  'substantiates', 'epistemological', 'framework', 'substantive',
  'obfuscate', 'elucidate', 'perspicacious', 'ephemeral',
  'phenomenon', 'concatenation', 'dichotomy', 'paradigm',
  'ambiguous', 'serendipity', 'ubiquitous', 'eloquent',
  'pragmatic', 'idiomatic', 'nuanced', 'esoteric',
  'arcane', 'nebulous', 'cognate', 'lexicon',
]);

export function getDifficultWords(text: string): string[] {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const word of words) {
    const lower = word.toLowerCase();
    if (!seen.has(lower) && DIFFICULT_WORDS_SET.has(lower)) {
      seen.add(lower);
      // Return original case from text
      const match = text.match(new RegExp(`\\b${word}\\b`, 'i'));
      if (match) result.push(match[0]);
    }
  }

  return result.slice(0, 20);
}

/**
 * Check if a word is an acronym (all caps, 2+ letters)
 */
export function isAcronym(word: string): boolean {
  return /^[A-Z]{2,}$/.test(word) && word.length <= 6;
}

/**
 * Expand an acronym to its definition (stub)
 */
export async function expandAcronym(acronym: string, context: string): Promise<string | null> {
  const acronymMap: Record<string, string> = {
    'PDF': 'Portable Document Format',
    'API': 'Application Programming Interface',
    'JSON': 'JavaScript Object Notation',
    'HTML': 'HyperText Markup Language',
    'CSS': 'Cascading Style Sheets',
    'AI': 'Artificial Intelligence',
    'ML': 'Machine Learning',
    'NLP': 'Natural Language Processing',
    'UI': 'User Interface',
    'UX': 'User Experience',
    'SQL': 'Structured Query Language',
    'HTTP': 'HyperText Transfer Protocol',
    'REST': 'Representational State Transfer',
    'URL': 'Uniform Resource Locator',
    'CFS': 'Comprehension Friction Score',
    'WPM': 'Words Per Minute',
    'ESL': 'English as a Second Language',
  };

  return acronymMap[acronym.toUpperCase()] || null;
}

/**
 * Fetch definition from local cache or API (stub)
 */
export async function fetchDefinition(word: string): Promise<string> {
  // Stub implementation - return a generic definition
  // In production, this would call Free Dictionary API or similar
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
    if (!response.ok) {
      return `Definition for "${word}" not available.`;
    }
    const data = (await response.json()) as Array<{ meanings?: Array<{ definitions?: Array<{ definition?: string }> }> }>;
    if (data[0]?.meanings?.[0]?.definitions?.[0]?.definition) {
      return data[0].meanings[0].definitions[0].definition;
    }
  } catch (e) {
    console.error(`Failed to fetch definition for ${word}:`, e);
  }

  return `Definition for "${word}" not available.`;
}

/**
 * Fetch a cognate (word in user's native language)
 */
export async function fetchCognate(word: string, targetLanguage: string = 'es'): Promise<string | null> {
  // Stub: return null to indicate no cognate found
  // In production, would call translation API
  return null;
}

/**
 * Detect user's native language from browser settings
 */
export function detectUserLanguage(): string {
  // Return browser language or default to English
  return navigator.language?.split('-')[0] || 'en';
}
