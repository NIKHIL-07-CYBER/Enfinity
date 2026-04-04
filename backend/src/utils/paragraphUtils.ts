import { marked } from 'marked';
import { Paragraph } from '../types';

export function generateParagraphId(index: number): string {
  // Returns zero-padded strings like p-001, p-002
  return `p-${index.toString().padStart(3, '0')}`;
}

export function computeDaleChallScore(text: string): number {
  const words = text.match(/\b\w+\b/g) || [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  const numWords = words.length;
  const numSentences = sentences.length || 1;
  
  if (numWords === 0) return 0;
  
  // Scaffolding logic: Assuming words > 6 characters are "difficult" for the sake of the formula
  const difficultWordsCount = words.filter(word => word.length > 6).length;
  
  const percentDifficultWords = (difficultWordsCount / numWords) * 100;
  const avgSentenceLength = numWords / numSentences;
  
  let score = 0.1579 * percentDifficultWords + 0.0496 * avgSentenceLength;
  
  if (percentDifficultWords > 5) {
    score += 3.6365;
  }
  
  return score;
}

export async function parseFile(fileContent: string): Promise<Paragraph[]> {
  // Uses marked to strip Markdown.
  let strippedText = await marked.parse(fileContent);
  // Remove HTML tags created by marked
  strippedText = strippedText.replace(/<\/?[^>]+(>|$)/g, "");

  // Split into paragraphs based on double newlines
  const chunks = strippedText.split(/\n\s*\n/);
  
  const finalChunks: string[] = [];
  
  for (const chunk of chunks) {
    const trimmedChunk = chunk.trim();
    if (!trimmedChunk) continue;
    
    // Split into sentences logic
    const sentences = trimmedChunk.match(/[^.!?]+[.!?]+/g) || [trimmedChunk];
    
    // Split if 4+ sentences
    if (sentences.length >= 4) {
      let currentSubChunk = "";
      let sentenceCount = 0;
      for (const sentence of sentences) {
        currentSubChunk += sentence + " ";
        sentenceCount++;
        if (sentenceCount >= 4) {
          finalChunks.push(currentSubChunk.trim());
          currentSubChunk = "";
          sentenceCount = 0;
        }
      }
      if (currentSubChunk.trim()) {
        finalChunks.push(currentSubChunk.trim());
      }
    } else {
      finalChunks.push(trimmedChunk);
    }
  }

  return finalChunks.map((text, index) => {
    const wordCount = (text.match(/\b\w+\b/g) || []).length;
    return {
      id: generateParagraphId(index + 1),
      text: text,
      wordCount: wordCount,
      daleChallScore: computeDaleChallScore(text)
    };
  });
}
