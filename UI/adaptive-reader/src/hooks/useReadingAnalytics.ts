import { useEffect, useState } from 'react';
// Updated to relative path to ensure module resolution if path aliases fail
import { supabase } from '../lib/supabase'; 
import { useAuthStore } from '../store/authStore';

// LOCAL INTERFACES FOR TYPE SAFETY
interface SessionRow {
  created_at?: string;
  struggled_terms?: string[];
  [key: string]: any;
}

interface AnalyticsRow {
  date: string;
  minutes_read?: number;
  avg_wpm?: number;
  [key: string]: any;
}

export interface ReadingMetrics {
  totalMinutesThisWeek: number;
  avgWPMThisWeek: number;
  totalSessionsThisMonth: number;
  streakDays: number;
  mostStruggled: { word: string; count: number }[];
}

export function useReadingAnalytics() {
  // Fix: Explicitly type the selector to avoid implicit 'any'
  const user = useAuthStore((s) => s.user);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [dailyData, setDailyData] = useState<AnalyticsRow[]>([]);
  const [metrics, setMetrics] = useState<ReadingMetrics>({
    totalMinutesThisWeek: 0,
    avgWPMThisWeek: 0,
    totalSessionsThisMonth: 0,
    streakDays: 0,
    mostStruggled: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Phase 1 Contract: Check for both user and env presence
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
        .gte('date', since.toISOString().split('T'));

      if (cancelled) return;

      const sessionRows = (sess as SessionRow[]) ?? [];
      const dailyRows = (daily as AnalyticsRow[]) ?? [];

      setSessions(sessionRows);
      setDailyData(dailyRows);

      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Fix: Parameter 'd' explicitly typed to AnalyticsRow
      const weekRows = dailyRows.filter((d: AnalyticsRow) => {
        const dt = new Date(String(d.date));
        return dt >= weekAgo;
      });

      // Fix: Parameters 'a' and 'd' explicitly typed
      const totalMinutesThisWeek = weekRows.reduce(
        (a: number, d: AnalyticsRow) => a + Number(d.minutes_read ?? 0),
        0,
      );

      const avgWPMThisWeek =
        weekRows.length > 0
          ? weekRows.reduce((a: number, d: AnalyticsRow) => a + Number(d.avg_wpm ?? 0), 0) /
            weekRows.length
          : 0;

      const month = now.getMonth();
      const year = now.getFullYear();
      
      // Fix: Parameter 's' explicitly typed
      const totalSessionsThisMonth = sessionRows.filter((s: SessionRow) => {
        const c = new Date(String(s.created_at ?? 0));
        return c.getMonth() === month && c.getFullYear() === year;
      }).length;

      // Fix: Parameter 'd' explicitly typed
      const dates = [...new Set(dailyRows.map((d: AnalyticsRow) => String(d.date)))].sort();
      
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T');
        if (dates.includes(key)) streak++;
        else if (i === 0) continue;
        else break;
      }

      const termCount: Record<string, number> = {};
      for (const row of sessionRows) {
        const terms = row.struggled_terms ?? [];
        for (const t of terms) {
          const w = t.toLowerCase();
          termCount[w] = (termCount[w] ?? 0) + 1;
        }
      }

      // Fix: Parameters 'a' and 'b' explicitly typed
      const mostStruggled = Object.entries(termCount)
        .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
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