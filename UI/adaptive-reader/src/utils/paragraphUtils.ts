import type { Paragraph } from '@/types';
import { useSessionStore } from '@/store/sessionStore';
import {
  parseFile as parseMarkdownToParagraphs,
  generateParagraphId as backendGenerateParagraphId,
} from '@backend/utils/paragraphUtils';
import { registerParagraph as registerParagraphForNlp } from '@nlp/utils/paragraphUtils';
import { extractTextFromPdf } from '@/utils/pdfParser';

export function generateParagraphId(index: number): string {
  return backendGenerateParagraphId(index);
}

/** Sync paragraph text into the NLP layer so adaptations resolve real document IDs. */
export function syncParagraphsToNlp(paragraphs: Paragraph[]): void {
  for (const p of paragraphs) {
    registerParagraphForNlp(p.id, p.text);
  }
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
