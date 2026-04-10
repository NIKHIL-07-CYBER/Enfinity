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
import { motion } from 'framer-motion';

export const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const struggledTerms = useConceptStore(s => s.struggledTerms);
  const struggledParagraphs = useConceptStore(s => s.struggledParagraphs);
  const readingMode = useReadingModeStore(s => s.mode);

  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [wordsProcessed, setWordsProcessed] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<string>('');
  const [showAllTerms, setShowAllTerms] = useState(false);

  useEffect(() => {
    async function loadData() {
      const session = await loadSession().catch(() => null);
      if (session?.paragraphs?.length) {
        useSessionStore.getState().setParagraphs(session.paragraphs);
        syncParagraphsToNlp(session.paragraphs);
      }
      if (session?.sessionStartTime) {
        const elapsed = Date.now() - session.sessionStartTime;
        const minutes = elapsed > 86400000
          ? 0
          : Math.round(elapsed / 60000);
        setSessionDuration(minutes);
        setSessionStartTime(new Date(session.sessionStartTime).toISOString());
      }
      const allParagraphs = getParagraphs();
      if (allParagraphs && allParagraphs.length > 0) {
        const totalWords = allParagraphs.reduce((sum, p) => sum + (p?.wordCount || 0), 0);
        setWordsProcessed(totalWords);
      } else {
        setWordsProcessed(0); 
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const terms = struggledTerms;
  const paragraphExcerpts = struggledParagraphs
    .map((id) => {
      const p = getParagraphById(id);
      return p ? `${p.text.slice(0, 160)}…` : "";
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

      alert(`✓ Session archived!\n\nDuration: ${archived.insights.totalTime}\nWords: ${archived.wordsRead}\nSpeed: ${archived.avgReadingSpeed}`);
      navigate(ROUTES.archive);
    } catch (error) {
      console.error('Failed to archive session:', error);
      alert('Failed to archive session. Please try again.');
    }
  };

  const initialTermsCount = 4;
  const visibleTerms = showAllTerms ? terms : terms.slice(0, initialTermsCount);
  const hasMoreTerms = terms.length > initialTermsCount;

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: 'var(--bg-color)' }}>
      <TopNav />
      <SidebarNav activePage="annotate" />
      
      <main className="w-full max-w-[800px] mx-auto pb-16 pt-32 px-6 sm:pr-8 sm:pl-[160px] max-sm:pl-6">
        {loading ? (
          <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Header */}
            <div className="flex justify-between items-end mb-6">
              <div>
                <div className="text-[10px] tracking-[0.2em] font-bold uppercase mb-3" style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-ui)' }}>
                  READING REVIEW
                </div>
                <h1 className="text-4xl sm:text-[42px] font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', letterSpacing: '-0.02em' }}>
                  Deep Session Analysis
                </h1>
              </div>
              
              <button 
                onClick={() => navigate(ROUTES.graph)}
                className="hidden sm:flex text-[11px] uppercase tracking-widest font-bold items-center gap-2 px-4 py-2 rounded-lg transition-all"
                style={{ background: 'var(--accent-blue-bg)', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)' }}
              >
                View Concept Graph →
              </button>
            </div>
            
            <p className="text-[17px] mb-12 sm:mb-16" style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: 'var(--font-reading)' }}>
              Based on your reading velocity and regression patterns, we've identified several domains requiring further synthesis. The system has automatically isolated terms where your cognitive load temporarily spiked.
            </p>

            {/* Terms Section */}
            <section className="mb-16">
              <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', letterSpacing: '-0.01em' }}>Terms to Review</h2>
              {terms.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No difficult terms recorded yet. They appear when comprehension friction spikes on a paragraph.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {visibleTerms.map((term, i) => (
                      <TermCard key={i} category={i % 2 === 0 ? "REVIEW" : "FOCUS"} term={term} definition="Definition pending synthesis..." />
                    ))}
                  </div>
                  {hasMoreTerms && (
                    <button 
                      onClick={() => setShowAllTerms(!showAllTerms)}
                      className="mt-6 text-sm font-semibold mx-auto block hover:underline"
                      style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-ui)' }}
                    >
                      {showAllTerms ? 'Show Less' : `Show ${terms.length - initialTermsCount} More Words`}
                    </button>
                  )}
                </>
              )}
            </section>

            {/* Struggle Points Section */}
            <section className="mb-16">
              <div className="flex justify-between items-center mb-8 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', letterSpacing: '-0.01em' }}>Struggle Points</h2>
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
                  <span className="text-[10px] tracking-widest font-bold uppercase" style={{ color: '#f59e0b', fontFamily: 'var(--font-ui)' }}>RE-READ INTENSITY: HIGH</span>
                </div>
              </div>
              
              {paragraphExcerpts.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No struggled paragraphs yet. Scroll through text (or use Simulate Struggle in the debug overlay) to record friction.
                </p>
              ) : (
                paragraphExcerpts.map((excerpt, i) => (
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

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-center mb-8 gap-4">
              <button 
                onClick={() => navigate(ROUTES.read)} 
                className="w-full sm:max-w-[200px] py-3.5 rounded-xl font-bold text-[12px] tracking-widest uppercase transition-colors" 
                style={{ color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', fontFamily: 'var(--font-ui)' }}
              >
                Back to Reading
              </button>
              <button 
                onClick={handleArchiveSession}
                className="w-full sm:max-w-[320px] py-3.5 rounded-xl font-bold text-[12px] tracking-widest uppercase text-white transition-opacity hover:opacity-90 shadow-lg" 
                style={{ background: 'linear-gradient(135deg, var(--accent-blue), #4f46e5)', fontFamily: 'var(--font-ui)', border: 'none' }}
              >
                Archive Session Insights
              </button>
            </div>

            {/* Footer */}
            <footer className="text-center text-[10px] tracking-widest font-bold uppercase" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-ui)' }}>
              Session Duration: {sessionDuration > 0 ? sessionDuration : (wordsProcessed ? 1 : 0)} Min • {wordsProcessed} Words Processed
            </footer>
          </motion.div>
        )}
      </main>
    </div>
  );
};
