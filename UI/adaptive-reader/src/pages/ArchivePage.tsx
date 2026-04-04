// DONE: Task 1a — ArchivePage
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '@/components/Layout/TopNav';
import { ROUTES } from '@/constants/routes';
import { loadSession } from '@/utils/persistence';
import { useSessionStore } from '@/store/sessionStore';
import { syncParagraphsToNlp } from '@/utils/paragraphUtils';

interface ArchivedSession {
  id: string;
  title: string;
  date: string;
  paragraphCount: number;
  sessionStartTime?: number;
  paragraphs?: any[];
}

export const ArchivePage: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ArchivedSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessions() {
      try {
        const session = await loadSession().catch(() => null);
        const loaded: ArchivedSession[] = [];
        if (session) {
          const title = localStorage.getItem('last_article_title') ||
            (session.paragraphs?.[0]?.text?.split('\n')[0]?.slice(0, 60) || 'Untitled');
          loaded.push({
            id: session.id || 'current',
            title,
            date: session.sessionStartTime
              ? new Date(session.sessionStartTime).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })
              : 'Unknown date',
            paragraphCount: session.paragraphs?.length || 0,
            sessionStartTime: session.sessionStartTime,
            paragraphs: session.paragraphs,
          });
        }
        setSessions(loaded);
      } catch { /* empty */ }
      setLoading(false);
    }
    loadSessions();
  }, []);

  const handleResume = async (session: ArchivedSession) => {
    if (session.paragraphs?.length) {
      useSessionStore.getState().setParagraphs(session.paragraphs);
      syncParagraphsToNlp(session.paragraphs);
    }
    if (session.sessionStartTime) {
      useSessionStore.getState().setSessionStartTime(session.sessionStartTime);
    }
    navigate(ROUTES.read);
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--bg-color)' }}>
      <TopNav />
      <main className="w-full max-w-[720px] mx-auto px-6 pt-32 pb-16">
        <div className="text-[11px] tracking-widest font-bold uppercase mb-4" style={{ color: 'var(--nav-text)' }}>
          READING ARCHIVE
        </div>
        <h1 className="text-[42px] font-bold mb-8" style={{ color: 'var(--text-color)' }}>
          Past Sessions
        </h1>

        {loading ? (
          <div className="text-center py-20" style={{ color: 'var(--nav-text)' }}>Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20">
            <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>📚</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-color)' }}>No archived sessions yet</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--nav-text)' }}>
              Upload a document to start reading and your sessions will appear here.
            </p>
            <button
              onClick={() => navigate(ROUTES.upload)}
              className="px-6 py-3 rounded-lg font-bold text-sm tracking-widest uppercase text-white"
              style={{ backgroundColor: 'var(--accent-blue)' }}
            >
              Upload Document
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-6 rounded-xl border transition-all hover:shadow-md"
                style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--bg-color)' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>
                    {session.title}
                  </h3>
                  <span className="text-[10px] tracking-widest font-bold uppercase" style={{ color: 'var(--nav-text)' }}>
                    {session.date}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-xs" style={{ color: 'var(--nav-text)' }}>
                    {session.paragraphCount} paragraphs
                  </span>
                </div>
                <button
                  onClick={() => handleResume(session)}
                  className="px-4 py-2 rounded-lg text-xs tracking-widest font-bold uppercase border transition-colors hover:opacity-80"
                  style={{ color: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }}
                >
                  Resume Reading
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
