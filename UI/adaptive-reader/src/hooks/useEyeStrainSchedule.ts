import { useEffect, useRef } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { saveSession } from '@/utils/persistence';

type ScheduleConfig = Record<string, string>;
type ScheduleTuple = [number, ScheduleConfig];

const SCHEDULE: ScheduleTuple[] = [
  [0,  { "--bg-color":"#FDFCF9", "--text-color":"#1a1a18", "--font-weight":"400", "--line-height":"1.75", "--font-size":"18px" }],
  [20, { "--bg-color":"#FAF8F2", "--font-weight":"400", "--line-height":"1.80" }],
  [40, { "--bg-color":"#F5F2E8", "--font-size":"19px", "--line-height":"1.85" }],
  [60, { "--bg-color":"#F0EBD8", "--font-weight":"400", "--line-height":"1.90", "--font-size":"20px" }],
];

interface UseEyeStrainScheduleProps {
  onBreakDue?: () => void;
}

export const useEyeStrainSchedule = ({ onBreakDue }: UseEyeStrainScheduleProps = {}) => {
  const onBreakDueRef = useRef(onBreakDue);
  const firedBreaks = useRef<Set<number>>(new Set());

  useEffect(() => {
    onBreakDueRef.current = onBreakDue;
  }, [onBreakDue]);

  useEffect(() => {
    const store = useSessionStore.getState();
    let { sessionStartTime } = store;

    if (!sessionStartTime) {
      sessionStartTime = Date.now();
      store.setSessionStartTime(sessionStartTime);
      
      saveSession({
        lastParagraphId: "",
        scrollY: 0,
        appliedAdaptations: [],
        sessionStartTime: sessionStartTime,
      }).catch(err => console.error("Failed to save initial session:", err));
    }

    const applySchedule = () => {
      if (!sessionStartTime) return;
      const elapsedMs = Date.now() - sessionStartTime;
      const elapsedMinutes = Math.floor(elapsedMs / 60000);

      for (let i = SCHEDULE.length - 1; i >= 0; i--) {
        const [minuteThreshold, config] = SCHEDULE[i];
        if (elapsedMinutes >= minuteThreshold) {
          Object.entries(config).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
          });
          break;
        }
      }

      if (elapsedMinutes > 0 && elapsedMinutes % 20 === 0) {
        if (!firedBreaks.current.has(elapsedMinutes)) {
          firedBreaks.current.add(elapsedMinutes);
          if (onBreakDueRef.current) {
            onBreakDueRef.current();
          }
        }
      }
    };

    applySchedule();

    const intervalId = setInterval(applySchedule, 30000);

    return () => clearInterval(intervalId);
  }, []);
};
