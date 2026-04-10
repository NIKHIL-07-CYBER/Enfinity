import React, { useState, useEffect } from 'react';
import { TopNav } from '@/components/Layout/TopNav';
import { SidebarNav } from '@/components/Layout/SidebarNav';
import { TermCard } from '@/components/Review/TermCard';
import { StrugglePoint } from '@/components/Review/StrugglePoint';
import { useConceptStore } from "@/store/conceptStore";
import { loadSession } from "@/utils/persistence";
import { getParagraphById, getParagraphs, syncParagraphsToNlp } from "@/utils/paragraphUtils";
import { useSessionStore } from "@/store/sessionStore";
import { useReadingModeStore } from "@/store/readingModeStore";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { finalizeAndArchiveSession, getCurrentSession } from "@/utils/sessionArchive";

export const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const struggledTerms = useConceptStore(s => s.struggledTerms);
  const struggledParagraphs = useConceptStore(s => (s as unknown as { struggledParagraphs?: string[] })?.struggledParagraphs ?? []);
  const readingMode = useReadingModeStore(s => s.mode);

  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [wordsProcessed, setWordsProcessed] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      const session = await loadSession().catch(() => null);
      const paragraphs = session?.paragraphs as unknown as Array<any> | undefined;
      const sessionStartTime = session?.sessionStartTime as unknown as number | undefined;
      
      if (Array.isArray(paragraphs) && paragraphs.length) {
        useSessionStore.getState().setParagraphs(paragraphs);
        syncParagraphsToNlp(paragraphs);
      }
      if (sessionStartTime) {
        const elapsed = Date.now() - sessionStartTime;
        const minutes = elapsed > 86400000
          ? 0
          : Math.round(elapsed / 60000);
        setSessionDuration(minutes);
        setSessionStartTime(new Date(sessionStartTime).toISOString());
      }
      const allParagraphs = getParagraphs();
      if (allParagraphs && allParagraphs.length > 0) {
        const totalWords = allParagraphs.reduce((sum, p) => sum + (p?.wordCount || 0), 0);
        setWordsProcessed(totalWords);
      } else {
        setWordsProcessed(0); // If empty, handle it
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const terms = struggledTerms;
  const paragraphExcerpts = struggledParagraphs
    .map((id: string) => {
      const p = getParagraphById(id);
      return p ? `${p.text.slice(0, 120)}…` : "";
    })
    .filter(Boolean);

  const handleArchiveSession = () => {
    if (!sessionStartTime) {
      console.warn('Session start time not available');
      return;
    }
    
    try {
      const currentSession = getCurrentSession();
      const archived = finalizeAndArchiveSession({
        startTime: sessionStartTime,
        mode: readingMode,
        title: currentSession.title,
        wordsRead: wordsProcessed,
        paragraphsRead: currentSession.paragraphs,
      });

      // Show success feedback and navigate to archive
      alert(`✓ Session archived!\n\nDuration: ${archived.insights.totalTime}\nWords: ${archived.wordsRead}\nSpeed: ${archived.avgReadingSpeed}`);
      navigate(ROUTES.archive);
    } catch (error) {
      console.error('Failed to archive session:', error);
      alert('Failed to archive session. Please try again.');
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: 'var(--bg-color)' }}>
      <TopNav />
      <SidebarNav activePage="reader" />
      
      <main className="w-full max-w-[800px] mx-auto pb-16 pt-32 px-6 sm:pr-8 sm:pl-[160px] max-sm:pl-6">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : (
          <>
            <div className="text-[11px] tracking-widest font-bold uppercase mb-4" style={{ color: 'var(--nav-text)' }}>
              READING REVIEW
            </div>
            <h1 className="text-[42px] font-bold mb-6 text-gray-900">
              Deep Session Analysis
            </h1>
            
            <p className="text-[17px] mb-16" style={{ color: 'var(--text-color)', opacity: 0.8, lineHeight: 1.6 }}>
              Based on your reading velocity and regression patterns, we've identified several domains requiring further synthesis. The system has automatically isolated terms where your cognitive load temporarily spiked.
            </p>

            <section className="mb-16">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Terms to Review</h2>
              {terms.length === 0 ? (
                <p className="text-sm opacity-70" style={{ color: 'var(--text-color)' }}>
                  No difficult terms recorded yet. They appear when comprehension friction spikes on a paragraph.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {terms.map((term: string, i: number) => (
                    <TermCard key={i} category={i % 2 === 0 ? "REVIEW" : "FOCUS"} term={term} definition="Definition pending synthesis..." />
                  ))}
                </div>
              )}
            </section>

            <section className="mb-16">
              <div className="flex justify-between items-center mb-8 border-b pb-4" style={{ borderColor: 'var(--card-border)' }}>
                <h2 className="text-xl font-bold text-gray-900">Struggle Points</h2>
                <div className="flex items-center space-x-2 bg-orange-100/50 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-[10px] tracking-widest font-bold uppercase text-orange-700">RE-READ INTENSITY: HIGH</span>
                </div>
              </div>
              
              {paragraphExcerpts.length === 0 ? (
                <p className="text-sm opacity-70" style={{ color: 'var(--text-color)' }}>
                  No struggled paragraphs yet. Scroll through text (or use Simulate Struggle in the debug overlay) to record friction.
                </p>
              ) : (
                paragraphExcerpts.map((excerpt: string, i: number) => (
                  <StrugglePoint
                    key={i}
                    quote={excerpt}
                    highlightedWord=""
                    chapter="CURRENT"
                    page={1}
                  />
                ))
              )}
            </section>

            <div className="flex justify-center mb-8 px-4 gap-4">
              <button 
                onClick={() => navigate(ROUTES.read)} 
                className="w-full max-w-[200px] py-4 rounded-lg font-bold text-[13px] tracking-widest uppercase border border-gray-300 transition-opacity hover:opacity-70" style={{ color: 'var(--text-color)' }}
              >
                BACK TO READING
              </button>
              <button 
                onClick={handleArchiveSession}
                className="w-full max-w-[320px] py-4 rounded-lg font-bold text-[13px] tracking-widest uppercase text-white transition-opacity hover:opacity-90 shadow-lg" style={{ backgroundColor: 'var(--toast-bg)' }}
              >
                ARCHIVE SESSION INSIGHTS
              </button>
            </div>

            <footer className="text-center text-[11px] tracking-widest font-bold uppercase" style={{ color: 'var(--nav-text)' }}>
              Session Duration: {sessionDuration > 0 ? sessionDuration : (wordsProcessed ? 1 : 0)} Minutes • {wordsProcessed} Words Processed
            </footer>
          </>
        )}
      </main>
    </div>
  );
};

