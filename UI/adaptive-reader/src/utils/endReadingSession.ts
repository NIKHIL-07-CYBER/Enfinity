import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useConceptStore } from '@telemetry';
import { useDocumentStore } from '@/store/documentStore';

export async function endReadingSession(): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user) return;

  const startTime = useSessionStore.getState().sessionStartTime ?? Date.now();
  const duration = Math.max(0, Math.round((Date.now() - startTime) / 1000));
  const struggleLog = useTelemetryStore.getState().struggleLog;
  const paragraphsRead = Object.keys(struggleLog).length;
  const cfsVals = Object.values(struggleLog);
  const avgCFS =
    cfsVals.reduce((a, b) => a + b, 0) / Math.max(1, cfsVals.length);
  const latest = useTelemetryStore.getState().latestCFS;
  const avgWPM = latest?.observedWPM ?? 0;
  const activeParagraphId = useTelemetryStore.getState().activeParagraphId;
  const doc = useDocumentStore.getState().currentDocument;

  if (!import.meta.env.VITE_SUPABASE_URL) return;

  try {
    await supabase.from('reading_sessions').insert({
      user_id: user.id,
      article_title: localStorage.getItem('last_article_title'),
      document_id: doc?.id ?? null,
      ended_at: new Date().toISOString(),
      total_duration_seconds: duration,
      paragraphs_read: paragraphsRead,
      avg_wpm: avgWPM,
      struggled_terms: useConceptStore.getState().struggledTerms,
      last_paragraph_id: activeParagraphId,
      scroll_y: window.scrollY,
    });

    const day = new Date().toISOString().split('T')[0];
    await supabase.from('reading_analytics').upsert(
      {
        user_id: user.id,
        date: day,
        minutes_read: Math.max(1, Math.round(duration / 60)),
        words_read: paragraphsRead * 150,
        avg_wpm: avgWPM,
        cfs_avg: avgCFS,
        paragraphs_completed: paragraphsRead,
      },
      { onConflict: 'user_id,date' },
    );

    if (doc?.id) {
      await supabase
        .from('user_documents')
        .update({
          last_read_at: new Date().toISOString(),
          last_paragraph_id: activeParagraphId,
          scroll_y: window.scrollY,
        })
        .eq('id', doc.id);
    }
  } catch {
    /* offline */
  }
}
