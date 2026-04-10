import type { Paragraph } from '@/types';
import { useSessionStore } from '@/store/sessionStore';
import { extractTextFromPdf } from '@/utils/pdfParser';

// Local implementation: generate paragraph IDs
function generateParagraphIdLocal(index: number): string {
  return `p-${index}-${Date.now()}`;
}

export function generateParagraphId(index: number): string {
  return generateParagraphIdLocal(index);
}

/** Sync paragraph text into local state (NLP layer would receive this via event bus). */
export function syncParagraphsToNlp(paragraphs: Paragraph[]): void {
  // Local sync - paragraphs are already in sessionStore
  useSessionStore.getState().setParagraphs(paragraphs);
}

// Local implementation: parse markdown/text to paragraphs
async function parseMarkdownToParagraphs(content: string): Promise<Paragraph[]> {
  const lines = content.split('\n').filter(line => line.trim());
  const paragraphs: Paragraph[] = [];
  let currentParagraph = '';
  
  for (const line of lines) {
    if (line.startsWith('#')) {
      if (currentParagraph.trim()) {
        paragraphs.push({
          id: `p-${paragraphs.length}-${Date.now()}`,
          text: currentParagraph.trim(),
          wordCount: currentParagraph.trim().split(/\s+/).length,
          daleChallScore: 0,
        });
        currentParagraph = '';
      }
    } else {
      currentParagraph += (currentParagraph ? ' ' : '') + line;
    }
  }
  
  if (currentParagraph.trim()) {
    paragraphs.push({
      id: `p-${paragraphs.length}-${Date.now()}`,
      text: currentParagraph.trim(),
      wordCount: currentParagraph.trim().split(/\s+/).length,
      daleChallScore: 0,
    });
  }
  
  return paragraphs;
}

export async function parseRawTextToParagraphs(content: string): Promise<Paragraph[]> {
  return parseMarkdownToParagraphs(content);
}

export async function parseFile(file: File): Promise<Paragraph[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) {
    // Parse PDFs entirely client-side — no backend needed.
    const text = await extractTextFromPdf(file);
    if (!text.trim()) throw new Error('PDF appears to be empty or image-only');
    return parseMarkdownToParagraphs(text);
  }
  const text = await file.text();
  return parseMarkdownToParagraphs(text);
}

export function getParagraphById(id: string): Paragraph | undefined {
  return useSessionStore.getState().paragraphs.find((p) => p.id === id);
}

export function getParagraphs(): Paragraph[] {
  return useSessionStore.getState().paragraphs;
}
