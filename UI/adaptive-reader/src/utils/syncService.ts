import { supabase } from '../lib/supabase';
import type { SelectionEntry } from '../store/selectionStore';

function readSelectionEntries(): SelectionEntry[] {
  try {
    const stored = localStorage.getItem('selection_entries');
    if (stored) return JSON.parse(stored) as SelectionEntry[];
  } catch {
    /* empty */
  }
  return [];
}

export async function syncToSupabase(userId: string): Promise<void> {
  if (!import.meta.env.VITE_SUPABASE_URL) return;

  const entries = readSelectionEntries();
  for (const e of entries) {
    try {
      await supabase.from('user_highlights').insert({
        user_id: userId,
        paragraph_id: e.paragraphId,
        original_text: e.text,
        highlight_color: e.highlight ?? null,
        translation: e.translation ?? null,
        definition: e.definition ?? null,
        pronunciation: e.pronunciation ?? null,
        note_content: e.note ?? null,
        folder: e.folder ?? 'Unsorted',
      });
    } catch {
      /* duplicate or RLS */
    }
  }
}

export async function loadFromSupabase(userId: string): Promise<void> {
  if (!import.meta.env.VITE_SUPABASE_URL) return;

  try {
    const { data: docs, error: docErr } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', userId);
    if (docErr) return;

    const { parseRawTextToParagraphs } = await import('./paragraphUtils');
    const { useDocumentStore } = await import('../store/documentStore');

    if (docs?.length) {
      const mapped = [];
      for (const row of docs as Record<string, unknown>[]) {
        const content = String(row.content ?? '');
        const paragraphs = await parseRawTextToParagraphs(content);
        mapped.push({
          id: String(row.id),
          title: String(row.title ?? 'Untitled'),
          content,
          paragraphs,
          wordCount: Number(row.word_count ?? content.split(/\s+/).filter(Boolean).length),
          paragraphCount: Number(row.paragraph_count ?? paragraphs.length),
          summary: (row.summary as string) || undefined,
          summaryStartParagraph: Number(row.summary_start_paragraph ?? 0),
          summaryEndParagraph: Number(row.summary_end_paragraph ?? -1),
          lastReadParagraphId: (row.last_paragraph_id as string) || undefined,
          lastScrollY: row.scroll_y != null ? Number(row.scroll_y) : undefined,
          lastReadAt: row.last_read_at ? String(row.last_read_at) : undefined,
          createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
        });
      }
      useDocumentStore.setState({ documents: mapped });
    }

    const { data: highlights } = await supabase
      .from('user_highlights')
      .select('*')
      .eq('user_id', userId);

    if (highlights?.length) {
      const entries: SelectionEntry[] = (highlights as Record<string, unknown>[]).map((h) => ({
        id: String(h.id ?? crypto.randomUUID()),
        text: String(h.original_text ?? ''),
        paragraphId: String(h.paragraph_id ?? ''),
        timestamp: Date.now(),
        type: 'phrase' as const,
        translation: (h.translation as string) || undefined,
        definition: (h.definition as string) || undefined,
        pronunciation: (h.pronunciation as string) || undefined,
        highlight: (h.highlight_color as string) || undefined,
        folder: (h.folder as string) || 'Unsorted',
        note: (h.note_content as string) || undefined,
      }));
      localStorage.setItem('selection_entries', JSON.stringify(entries));
    }
  } catch {
    /* empty */
  }
}
