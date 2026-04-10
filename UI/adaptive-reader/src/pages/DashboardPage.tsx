import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '@/components/Layout/TopNav';
import { useReadingAnalytics } from '@/hooks/useReadingAnalytics';
import { ROUTES } from '@/constants/routes';
import { useDocumentStore } from '@/store/documentStore';
import { useSessionStore } from '@/store/sessionStore';
import { saveSession } from '@/utils/persistence';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessions, dailyData, metrics, isLoading } = useReadingAnalytics();
  const setCurrentDocument = useDocumentStore((s) => s.setCurrentDocument);

  const last14 = [...Array(14)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().split('T')[0];
    const row = dailyData.find((x) => String((x as { date: string }).date) === key) as
      | { minutes_read?: number; avg_wpm?: number }
      | undefined;
    return {
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      wpm: row?.avg_wpm ?? 0,
      minutes: row?.minutes_read ?? 0,
    };
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <TopNav />
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-2xl font-semibold mb-8">Your reading journey</h1>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl animate-pulse"
                style={{ background: 'var(--bg-secondary)' }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { n: metrics.totalMinutesThisWeek, l: 'This week' },
              { n: metrics.avgWPMThisWeek, l: 'Avg speed' },
              { n: metrics.totalSessionsThisMonth, l: 'This month' },
              { n: metrics.streakDays, l: 'Streak' },
            ].map((c) => (
              <div
                key={c.l}
                className="rounded-xl p-4 border"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <div className="text-2xl font-bold">{c.n}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {c.l}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mb-8 rounded-xl border p-4" style={{ borderColor: 'var(--border-color)' }}>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last14}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <YAxis domain={[0, 300]} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
                <Line type="monotone" dataKey="wpm" stroke="var(--chart-accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mb-8 rounded-xl border p-4" style={{ borderColor: 'var(--border-color)' }}>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last14}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
                <Bar dataKey="minutes" fill="var(--chart-accent)" fillOpacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-medium mb-3">Words you struggled with most</h2>
          <div className="flex flex-wrap gap-2">
            {metrics.mostStruggled.map(({ word, count }) => (
              <span
                key={word}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                style={{ background: 'var(--accent-blue-bg)', color: 'var(--accent-blue)' }}
              >
                {word}
                <span className="text-xs opacity-80">{count}</span>
              </span>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-3">Recent sessions</h2>
          <div className="space-y-3">
            {sessions.slice(0, 10).map((s) => {
              const row = s as {
                id?: string;
                document_id?: string;
                article_title?: string;
                total_duration_seconds?: number;
                avg_wpm?: number;
                last_paragraph_id?: string;
                created_at?: string;
              };
              const title = row.article_title || 'Untitled document';
              const mins = Math.round((row.total_duration_seconds ?? 0) / 60);
              const date = row.created_at ? new Date(row.created_at).toLocaleDateString() : '';
              return (
                <div
                  key={String(row.id ?? title + date)}
                  className="rounded-xl border p-4 flex flex-col gap-2"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                >
                  <div className="font-semibold">{title}</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {date} · {mins} min · ~{Math.round(row.avg_wpm ?? 0)} wpm
                  </div>
                  {row.last_paragraph_id && (
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Last paragraph: {row.last_paragraph_id}
                    </div>
                  )}
                  <button
                    type="button"
                    className="self-start text-sm px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--accent-blue)' }}
                    onClick={() => {
                      const st = useDocumentStore.getState();
                      const doc = row.document_id
                        ? st.documents.find((d) => d.id === row.document_id)
                        : st.documents.find((d) => d.title === title);
                      if (doc) {
                        setCurrentDocument(doc);
                        const sessionStartTime = Date.now();
                        useSessionStore.getState().setSessionStartTime(sessionStartTime);
                        void saveSession({
                          lastParagraphId: doc.lastReadParagraphId || doc.paragraphs[0]?.id || '',
                          scrollY: doc.lastScrollY ?? 0,
                          appliedAdaptations: [],
                          sessionStartTime,
                          paragraphs: doc.paragraphs,
                        });
                        navigate(ROUTES.read);
                      } else {
                        navigate(ROUTES.upload);
                      }
                    }}
                  >
                    Continue reading
                  </button>
                </div>
              );
            })}
          </div>
          {sessions.length === 0 && !isLoading && (
            <p style={{ color: 'var(--text-tertiary)' }}>No reading data yet. Start a reading session.</p>
          )}
        </section>
      </main>
    </div>
  );
};
