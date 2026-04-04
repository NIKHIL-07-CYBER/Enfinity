import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export interface ReadingMetrics {
  totalMinutesThisWeek: number;
  avgWPMThisWeek: number;
  totalSessionsThisMonth: number;
  streakDays: number;
  mostStruggled: { word: string; count: number }[];
}

export function useReadingAnalytics() {
  const user = useAuthStore((s) => s.user);
  const [sessions, setSessions] = useState<Record<string, unknown>[]>([]);
  const [dailyData, setDailyData] = useState<Record<string, unknown>[]>([]);
  const [metrics, setMetrics] = useState<ReadingMetrics>({
    totalMinutesThisWeek: 0,
    avgWPMThisWeek: 0,
    totalSessionsThisMonth: 0,
    streakDays: 0,
    mostStruggled: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !import.meta.env.VITE_SUPABASE_URL) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data: sess } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(30);

      const { data: daily } = await supabase
        .from('reading_analytics')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', since.toISOString().split('T')[0]);

      if (cancelled) return;

      setSessions(sess ?? []);
      setDailyData(daily ?? []);

      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekRows = (daily ?? []).filter((d) => {
        const dt = new Date(String((d as { date: string }).date));
        return dt >= weekAgo;
      });
      const totalMinutesThisWeek = weekRows.reduce(
        (a, d) => a + Number((d as { minutes_read?: number }).minutes_read ?? 0),
        0,
      );
      const avgWPMThisWeek =
        weekRows.length > 0
          ? weekRows.reduce((a, d) => a + Number((d as { avg_wpm?: number }).avg_wpm ?? 0), 0) /
            weekRows.length
          : 0;

      const month = now.getMonth();
      const year = now.getFullYear();
      const totalSessionsThisMonth = (sess ?? []).filter((s) => {
        const c = new Date(String((s as { created_at?: string }).created_at ?? 0));
        return c.getMonth() === month && c.getFullYear() === year;
      }).length;

      const dates = [...new Set((daily ?? []).map((d) => String((d as { date: string }).date)))].sort();
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        if (dates.includes(key)) streak++;
        else if (i === 0) continue;
        else break;
      }

      const termCount: Record<string, number> = {};
      for (const row of sess ?? []) {
        const terms = (row as { struggled_terms?: string[] }).struggled_terms ?? [];
        for (const t of terms) {
          const w = t.toLowerCase();
          termCount[w] = (termCount[w] ?? 0) + 1;
        }
      }
      const mostStruggled = Object.entries(termCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, count]) => ({ word, count }));

      setMetrics({
        totalMinutesThisWeek,
        avgWPMThisWeek: Math.round(avgWPMThisWeek),
        totalSessionsThisMonth,
        streakDays: streak,
        mostStruggled,
      });
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { sessions, dailyData, metrics, isLoading };
}
