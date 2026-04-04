const EASY_WORDS = new Set<string>([
  'a','an','the','is','was','are','were','be','been','have','has','had',
  'do','does','did','will','would','can','could','should','may','might',
  'shall','and','or','but','if','as','at','by','for','in','of','on',
  'to','up','it','its','not','with','from','this','that','they','them',
  'we','he','she','you','i','me','my','our','your','his','her','their',
  'said','get','got','go','come','see','know','make','take','think',
  'look','want','give','use','find','tell','ask','seem','feel','try',
  'call','keep','put','show','hear','play','run','move','live','hold',
  'big','small','good','new','old','first','last','long','little','own',
  'right','high','next','early','young','important','public','private',
]);

export function extractDifficultTerms(text: string, topN: number = 5): string[] {
  const lower = text.toLowerCase();

  // Extract all words with 4+ letters (letters only)
  const words = lower.match(/\b[a-z]{4,}\b/g);
  if (!words) return [];

  // Filter out easy / common words
  const difficult = words.filter((w) => !EASY_WORDS.has(w));

  // Count frequency
  const freq: Record<string, number> = {};
  for (const w of difficult) {
    freq[w] = (freq[w] || 0) + 1;
  }

  // Deduplicate, sort by frequency descending, return top N
  const unique = [...new Set(difficult)];
  unique.sort((a, b) => freq[b] - freq[a]);

  return unique.slice(0, topN);
}
