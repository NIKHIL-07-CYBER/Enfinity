// Feature 1: Contextual Concept Graph — Zustand store
import { create } from 'zustand';
import { useConceptStore } from '@/store/conceptStore';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useSessionStore } from '@/store/sessionStore';
import { getParagraphById } from '@/utils/paragraphUtils';

export interface ConceptNode {
  id: string;
  term: string;
  cfsPeak: number;
  paragraphIds: string[];
  occurrenceCount: number;
  reviewed: boolean;
}

export interface ConceptEdge {
  termId: string;
  paragraphId: string;
  cfs: number;
}

export interface ParagraphSummary {
  id: string;
  excerpt: string;
  cfs: number;
  difficultTerms: string[];
}

export interface ConceptGraphState {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  paragraphSummaries: ParagraphSummary[];
  reviewSheetVisible: boolean;
  sessionStats: {
    duration: number;
    wordsRead: number;
    avgCFS: number;
    paragraphsRead: number;
  };
  buildGraph: () => void;
  showReviewSheet: () => void;
  hideReviewSheet: () => void;
  markReviewed: (termId: string) => void;
  reset: () => void;
}

export const useConceptGraphStore = create<ConceptGraphState>((set, get) => ({
  nodes: [],
  edges: [],
  paragraphSummaries: [],
  reviewSheetVisible: false,
  sessionStats: { duration: 0, wordsRead: 0, avgCFS: 0, paragraphsRead: 0 },

  buildGraph: () => {
    const conceptState = useConceptStore.getState();
    const telemetryState = useTelemetryStore.getState();
    const sessionState = useSessionStore.getState();

    const { struggledTerms, struggledParagraphs } = conceptState;
    const { struggleLog } = telemetryState;
    const paragraphs = sessionState.paragraphs;
    const startTime = sessionState.sessionStartTime ?? Date.now();

    // Build nodes from struggled terms
    const nodes: ConceptNode[] = struggledTerms.map((term, idx) => {
      // Find which paragraphs contain this term
      const matchingParagraphIds = paragraphs
        .filter((p) => p.text.toLowerCase().includes(term.toLowerCase()))
        .map((p) => p.id);

      const cfsPeak = matchingParagraphIds.reduce((max, pid) => {
        return Math.max(max, struggleLog[pid] ?? 0);
      }, 0);

      return {
        id: `term-${idx}`,
        term,
        cfsPeak,
        paragraphIds: matchingParagraphIds,
        occurrenceCount: matchingParagraphIds.length,
        reviewed: false,
      };
    });

    // Build edges (term → paragraph)
    const edges: ConceptEdge[] = [];
    nodes.forEach((node) => {
      node.paragraphIds.forEach((pid) => {
        edges.push({
          termId: node.id,
          paragraphId: pid,
          cfs: struggleLog[pid] ?? 0,
        });
      });
    });

    // Build paragraph summaries for struggled paragraphs
    const paragraphSummaries: ParagraphSummary[] = struggledParagraphs
      .map((pid) => {
        const p = getParagraphById(pid);
        if (!p) return null;
        const cfs = struggleLog[pid] ?? 0;
        const difficultTerms = struggledTerms.filter((t) =>
          p.text.toLowerCase().includes(t.toLowerCase())
        );
        return {
          id: pid,
          excerpt: p.text.slice(0, 200) + (p.text.length > 200 ? '…' : ''),
          cfs,
          difficultTerms,
        };
      })
      .filter(Boolean) as ParagraphSummary[];

    // Sort by CFS severity (highest first)
    nodes.sort((a, b) => b.cfsPeak - a.cfsPeak);
    paragraphSummaries.sort((a, b) => b.cfs - a.cfs);

    // Session stats
    const duration = Math.round((Date.now() - startTime) / 60000);
    const totalWords = paragraphs.reduce((sum, p) => sum + p.wordCount, 0);
    const cfsValues = Object.values(struggleLog);
    const avgCFS =
      cfsValues.length > 0
        ? cfsValues.reduce((a, b) => a + b, 0) / cfsValues.length
        : 0;

    set({
      nodes,
      edges,
      paragraphSummaries,
      sessionStats: {
        duration: Math.max(duration, 1),
        wordsRead: totalWords,
        avgCFS: Math.round(avgCFS * 100) / 100,
        paragraphsRead: Object.keys(struggleLog).length,
      },
    });
  },

  showReviewSheet: () => {
    get().buildGraph();
    set({ reviewSheetVisible: true });
  },

  hideReviewSheet: () => set({ reviewSheetVisible: false }),

  markReviewed: (termId) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === termId ? { ...n, reviewed: true } : n
      ),
    })),

  reset: () =>
    set({
      nodes: [],
      edges: [],
      paragraphSummaries: [],
      reviewSheetVisible: false,
      sessionStats: { duration: 0, wordsRead: 0, avgCFS: 0, paragraphsRead: 0 },
    }),
}));
