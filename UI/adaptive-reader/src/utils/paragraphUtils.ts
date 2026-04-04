import type { Paragraph } from '@/types';
import { useSessionStore } from '@/store/sessionStore';
import {
  parseFile as parseMarkdownToParagraphs,
  generateParagraphId as backendGenerateParagraphId,
} from '@backend/utils/paragraphUtils';
import { registerParagraph as registerParagraphForNlp } from '@nlp/utils/paragraphUtils';

export function generateParagraphId(index: number): string {
  return backendGenerateParagraphId(index);
}

/** Sync paragraph text into the NLP layer so adaptations resolve real document IDs. */
export function syncParagraphsToNlp(paragraphs: Paragraph[]): void {
  for (const p of paragraphs) {
    registerParagraphForNlp(p.id, p.text);
  }
}

export async function parseFile(file: File): Promise<Paragraph[]> {
  const text = await file.text();
  return await parseMarkdownToParagraphs(text);
}

export function getParagraphById(id: string): Paragraph | undefined {
  return useSessionStore.getState().paragraphs.find((p) => p.id === id);
}

export function getParagraphs(): Paragraph[] {
  return useSessionStore.getState().paragraphs;
}
