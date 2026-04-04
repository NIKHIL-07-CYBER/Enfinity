import type { Paragraph } from '@/types';

export function generateParagraphId(index: number): string { return `p-${index}`; }
export function getParagraphById(id: string): Paragraph | undefined { return undefined; }
export function getParagraphs(): Paragraph[] { return []; }
export async function parseFile(file: File): Promise<Paragraph[]> {
  const text = await file.text();
  return text.split("\n\n").filter(Boolean).map((t, i) => ({
    id: `p-${String(i + 1).padStart(3, "0")}`,
    text: t.trim(),
    wordCount: t.split(" ").length,
    daleChallScore: 5,
  }));
}
