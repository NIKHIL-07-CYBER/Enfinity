import { useEffect, useRef } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { saveSession } from '@/utils/persistence';
import { applyEyeStrainSettings, getEyeStrainLevel } from '@/utils/eyeStrain';

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

      const newLevel = getEyeStrainLevel(elapsedMinutes);
      applyEyeStrainSettings(newLevel);

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
