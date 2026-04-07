import { create } from 'zustand';
import type { Paragraph } from '../types';
import { supabase } from '../lib/supabase';
import { parseRawTextToParagraphs, parseFile, syncParagraphsToNlp } from '../utils/paragraphUtils';
import { useSessionStore } from './sessionStore';
import { db } from '@backend/db/database';

export interface UserDocument {
  id: string;
  title: string;
  content: string;
  paragraphs: Paragraph[];
  wordCount: number;
  paragraphCount: number;
  summary?: string;
  summaryStartParagraph: number;
  summaryEndParagraph: number;
  lastReadParagraphId?: string;
  lastScrollY?: number;
  lastReadAt?: string;
  createdAt: string;
}

interface DocumentState {
  documents: UserDocument[];
  currentDocument: UserDocument | null;
  isLoading: boolean;
  isUploading: boolean;
  isSummarizing: boolean;
  loadDocuments: (userId: string) => Promise<void>;
  uploadDocument: (file: File, title: string | undefined, userId: string) => Promise<UserDocument | null>;
  setCurrentDocument: (doc: UserDocument | null) => void;
  deleteDocument: (id: string, userId: string) => Promise<void>;
  updateSummaryRange: (id: string, start: number, end: number) => Promise<void>;
  generateSummary: (id: string, userId: string) => Promise<void>;
  patchLocalDocument: (id: string, partial: Partial<UserDocument>) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  currentDocument: null,
  isLoading: false,
  isUploading: false,
  isSummarizing: false,

  loadDocuments: async (userId: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) return;
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('user_documents').select('*').eq('user_id', userId);
      if (error || !data) {
        set({ isLoading: false });
        return;
      }
      const mapped: UserDocument[] = [];
      for (const row of data as Record<string, unknown>[]) {
        const content = String(row.content ?? '');
        const paragraphs = await parseRawTextToParagraphs(content);
        mapped.push({
          id: String(row.id),
          title: String(row.title ?? 'Untitled'),
          content,
          paragraphs,
          wordCount: Number(row.word_count ?? 0),
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
      set({ documents: mapped, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  uploadDocument: async (file, title, userId) => {
    set({ isUploading: true });
    try {
      const paragraphs = await parseFile(file);
      const rawText = paragraphs.map((p) => p.text).join('\n\n');
      const docTitle =
        title?.trim() ||
        file.name.replace(/\.[^/.]+$/, '') ||
        paragraphs[0]?.text?.slice(0, 80) ||
        'Untitled';
      const wordCount = rawText.split(/\s+/).filter(Boolean).length;
      const createdAt = new Date().toISOString();

      // Try Supabase cloud sync first — with a 4s timeout so we never hang
      let cloudId: string | null = null;
      let supabaseData: Record<string, unknown> | null = null;
      try {
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
        const insertPromise = supabase
          .from('user_documents')
          .insert({
            user_id: userId,
            title: docTitle,
            original_filename: file.name,
            content: rawText,
            word_count: wordCount,
            paragraph_count: paragraphs.length,
          })
          .select()
          .single()
          .then(({ data, error }: { data: any; error: any }) => {
            if (error || !data) return null;
            return data as Record<string, unknown>;
          });

        const result = await Promise.race([insertPromise, timeoutPromise]);
        if (result) {
          cloudId = String(result.id);
          supabaseData = result;
        } else {
          console.warn('[documentStore] Supabase insert timed out or failed — saving locally');
        }
      } catch (e) {
        console.warn('[documentStore] Supabase insert threw:', e);
      }

      // Generate a stable local ID (use cloud ID if we got one)
      const docId = cloudId ?? `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const doc: UserDocument = {
        id: docId,
        title: docTitle,
        content: rawText,
        paragraphs,
        wordCount,
        paragraphCount: paragraphs.length,
        summaryStartParagraph: 0,
        summaryEndParagraph: -1,
        createdAt: cloudId && supabaseData
          ? String(supabaseData.created_at ?? createdAt)
          : createdAt,
      };

      // Always save to local IndexedDB (Dexie) as offline cache
      try {
        await db.documents.put({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          userId,
          createdAt: doc.createdAt,
        });
      } catch {
        /* Dexie is optional */
      }

      set((s) => ({
        documents: [doc, ...s.documents.filter((d) => d.id !== doc.id)],
        isUploading: false,
      }));

      // Return doc regardless of cloud status — null = parse failure
      return doc;
    } catch (err) {
      console.error('[documentStore] uploadDocument failed:', err);
      set({ isUploading: false });
      return null;
    }

  },

  setCurrentDocument: (doc) => {
    set({ currentDocument: doc });
    if (doc?.paragraphs?.length) {
      useSessionStore.getState().setParagraphs(doc.paragraphs);
      syncParagraphsToNlp(doc.paragraphs);
      localStorage.setItem('last_article_title', doc.title);
    }
  },

  deleteDocument: async (id, userId) => {
    await supabase.from('user_documents').delete().eq('id', id).eq('user_id', userId);
    try {
      await db.documents.delete(id);
    } catch {
      /* empty */
    }
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
  },

  updateSummaryRange: async (id, start, end) => {
    await supabase
      .from('user_documents')
      .update({ summary_start_paragraph: start, summary_end_paragraph: end })
      .eq('id', id);
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === id ? { ...d, summaryStartParagraph: start, summaryEndParagraph: end } : d,
      ),
      currentDocument:
        s.currentDocument?.id === id
          ? {
              ...s.currentDocument,
              summaryStartParagraph: start,
              summaryEndParagraph: end,
            }
          : s.currentDocument,
    }));
  },

  generateSummary: async (id, userId) => {
    const doc = get().documents.find((d) => d.id === id) ?? get().currentDocument;
    if (!doc) return;
    set({ isSummarizing: true });
    const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001';
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    const start = doc.summaryStartParagraph;
    const end = doc.summaryEndParagraph >= 0 ? doc.summaryEndParagraph : doc.paragraphs.length - 1;
    const slice = doc.paragraphs.slice(start, end + 1).map((p) => p.text).join('\n\n');

    try {
      const res = await fetch(`${API_BASE}/api/documents/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          documentId: id,
          text: slice.slice(0, 4000),
          userId,
        }),
      });
      const raw = await res.json();
      const summary = raw.summary ?? raw?.data?.summary;
      if (summary) {
        await supabase.from('user_documents').update({ summary }).eq('id', id);
        set((s) => ({
          documents: s.documents.map((d) => (d.id === id ? { ...d, summary } : d)),
          currentDocument:
            s.currentDocument?.id === id ? { ...s.currentDocument, summary } : s.currentDocument,
          isSummarizing: false,
        }));
      } else {
        set({ isSummarizing: false });
      }
    } catch {
      set({ isSummarizing: false });
    }
  },

  patchLocalDocument: (id, partial) =>
    set((s) => ({
      documents: s.documents.map((d) => (d.id === id ? { ...d, ...partial } : d)),
      currentDocument: s.currentDocument?.id === id ? { ...s.currentDocument, ...partial } : s.currentDocument,
    })),
}));
