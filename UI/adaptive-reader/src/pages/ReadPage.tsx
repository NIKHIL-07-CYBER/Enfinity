import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TopNav } from '@/components/Layout/TopNav';
import { SidebarNav } from '@/components/Layout/SidebarNav';
import { ReadingContainer } from '@/components/Reader/ReadingContainer';
import { ChromeShell } from '@/components/Reader/ChromeShell';
import { useEyeStrainSchedule } from '@/hooks/useEyeStrainSchedule';
import { BreakPrompt } from '@/components/Reader/BreakPrompt';

import { adaptationBus } from '@/utils/adaptationBus';
import type { AdaptationEvent } from '@/types';
import { saveSession, loadSession } from '@/utils/persistence';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useSessionStore } from '@/store/sessionStore';
import { syncParagraphsToNlp } from '@/utils/paragraphUtils';
import { 
  useParagraphDwell, 
  useRegressionTracker, 
  useHighlightHesitation, 
  useTelemetryResume,
  TelemetryOverlay
} from '@telemetry';

export const ReadPage: React.FC = () => {
  const paragraphs = useSessionStore(s => s.paragraphs);
  const [showBreak, setShowBreak] = useState(false);

  // --- Telemetry hooks (Integrated) ---
  useTelemetryResume();                                  // 1. restore session state
  useRegressionTracker();                                // 2. track scroll-up behavior
  useParagraphDwell(paragraphs);                         // 3. dwell-time tracking
  useHighlightHesitation();                              // 4. word-level hesitation

  useEyeStrainSchedule({
    onBreakDue: () => setShowBreak(true)
  });

  useEffect(() => {
    const handler = (event: AdaptationEvent) => {
      const el = document.getElementById("adaptation-announcer");
      if (!el) return;
      el.textContent = "";
      setTimeout(() => {
        if (el) el.textContent = `Word "${event.originalWord}" simplified to "${event.replacement}"`;
      }, 100);
      setTimeout(() => {
        if (el) el.textContent = "";
      }, 2100);
    };
    adaptationBus.on("adaptation", handler);
    return () => {
      adaptationBus.off("adaptation", handler);
    };
  }, []);

  const saveDebounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onScroll = () => {
      if (saveDebounceRef.current !== undefined) {
        clearTimeout(saveDebounceRef.current);
      }
      saveDebounceRef.current = window.setTimeout(() => {
        const activeParagraphId = useTelemetryStore.getState().activeParagraphId;
        const sessionStartTime = useSessionStore.getState().sessionStartTime ?? Date.now();
        saveSession({
          lastParagraphId: activeParagraphId || "",
          scrollY: window.scrollY,
          appliedAdaptations: [],
          sessionStartTime,
          paragraphs: useSessionStore.getState().paragraphs,
        }).catch(() => {});
      }, 5000);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onUnload = () => {
      const activeParagraphId = useTelemetryStore.getState().activeParagraphId;
      localStorage.setItem("last_paragraph_id", activeParagraphId || "");
      localStorage.setItem("last_scroll_y", String(window.scrollY));
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      let session = await loadSession().catch(() => null);
      if (!session) {
        const lastId = localStorage.getItem("last_paragraph_id");
        const lastY = localStorage.getItem("last_scroll_y");
        if (lastId) {
          session = {
            id: "current",
            lastParagraphId: lastId,
            scrollY: Number(lastY) || 0,
            appliedAdaptations: [],
            sessionStartTime: Date.now(),
          };
        }
      }
      if (cancelled || !session) return;

      if (session.paragraphs?.length) {
        useSessionStore.getState().setParagraphs(session.paragraphs);
        syncParagraphsToNlp(session.paragraphs);
      }
      if (session.sessionStartTime) {
        useSessionStore.getState().setSessionStartTime(session.sessionStartTime);
      }

      const scrollToSession = () => {
        const el = document.querySelector(
          `[data-paragraph-id="${session.lastParagraphId}"]`,
        );
        if (el) {
          el.scrollIntoView({ behavior: "instant", block: "start" });
        } else {
          window.scrollTo({ top: session.scrollY, behavior: "instant" });
        }
      };

      setTimeout(scrollToSession, session.paragraphs?.length ? 200 : 0);
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="min-h-screen relative overflow-x-hidden" 
      style={{ backgroundColor: 'var(--bg-color)' }}
    >
      <TelemetryOverlay />
      <ChromeShell>
        <TopNav />
      </ChromeShell>
      <SidebarNav activePage="reader" />
      
      <main className="pl-[160px] pb-32 pt-24 w-full sm:pl-[160px] max-sm:pl-0">
        <ReadingContainer />
      </main>

      <BreakPrompt isVisible={showBreak} onDismiss={() => setShowBreak(false)} />

      <div
        aria-live="polite"
        aria-atomic="true"
        id="adaptation-announcer"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      />
    </motion.div>
  );
};

