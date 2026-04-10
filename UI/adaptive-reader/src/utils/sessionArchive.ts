export interface ArchivedSession {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  wordsRead: number;
  paragraphsRead: number;
  avgReadingSpeed: string;
  mode: string;
  words?: number;
  paragraphs?: number;
  insights: {
    totalTime: string;
    wordsRead: number;
    avgReadingSpeed: string;
    mode: string;
    date: string;
  };
}

export interface CurrentSessionData {
  startTime: string;
  words: number;
  paragraphs: number;
  mode: string;
  title: string;
}

const ARCHIVE_STORAGE_KEY = 'readingArchives';
const CURRENT_SESSION_KEY = 'currentSession';

export function getCurrentSession(): CurrentSessionData {
  try {
    const raw = localStorage.getItem(CURRENT_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CurrentSessionData;
      if (parsed.startTime) {
        return {
          words: parsed.words ?? 0,
          paragraphs: parsed.paragraphs ?? 0,
          mode: parsed.mode ?? 'automatic',
          title: parsed.title ?? localStorage.getItem('last_article_title') ?? 'Untitled',
          startTime: parsed.startTime,
        };
      }
    }
  } catch {
    /* empty */
  }
  const now = new Date().toISOString();
  const title = localStorage.getItem('last_article_title') || 'Untitled';
  const fallback = { startTime: now, words: 0, paragraphs: 0, mode: 'automatic', title };
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(fallback));
  return fallback;
}

export function saveCurrentSession(data: Partial<CurrentSessionData>): CurrentSessionData {
  const current = getCurrentSession();
  const next = {
    ...current,
    ...data,
  };
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(next));
  return next;
}

export function loadArchivedSessions(): ArchivedSession[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ArchivedSession[];
  } catch {
    return [];
  }
}

export function archiveSession(session: Partial<ArchivedSession> & { startTime: string; mode?: string; title?: string; words?: number; paragraphs?: number }): ArchivedSession {
  const archives = loadArchivedSessions();
  const endTime = new Date().toISOString();
  const now = Date.now();
  const title = session.title || localStorage.getItem('last_article_title') || 'Untitled';
  const duration = session.duration ?? Math.max(0, Math.round((new Date(endTime).getTime() - new Date(session.startTime).getTime()) / 1000));
  const wordsRead = session.wordsRead ?? session.words ?? 0;
  const paragraphsRead = session.paragraphsRead ?? session.paragraphs ?? 0;
  const mode = session.mode || 'automatic';
  const archived: ArchivedSession = {
    id: now,
    title,
    startTime: session.startTime,
    endTime,
    duration,
    wordsRead,
    paragraphsRead,
    avgReadingSpeed: session.avgReadingSpeed ?? `${wordsRead && duration ? Math.round(wordsRead / (duration / 60)) : 0} WPM`,
    mode,
    insights: session.insights ?? generateInsights({ duration, wordsRead, mode, endTime }),
  };
  archives.push(archived);
  localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archives));
  saveCurrentSession({ startTime: new Date().toISOString(), words: 0, paragraphs: 0, mode, title });
  return archived;
}

export function generateInsights(session: { duration: number; wordsRead: number; mode: string; endTime: string }) {
  return {
    totalTime: `${Math.max(1, Math.round(session.duration / 60))} min`,
    wordsRead: session.wordsRead,
    avgReadingSpeed: `${session.wordsRead && session.duration ? Math.round(session.wordsRead / (session.duration / 60)) : 0} WPM`,
    mode: session.mode,
    date: new Date(session.endTime).toLocaleDateString(),
  };
}

export function finalizeAndArchiveSession(session: Partial<ArchivedSession> & { startTime: string; mode: string; title?: string; words?: number; paragraphs?: number }): ArchivedSession {
  return archiveSession(session);
}
