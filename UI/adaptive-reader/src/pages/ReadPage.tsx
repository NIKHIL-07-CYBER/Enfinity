import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TopNav } from '@/components/Layout/TopNav';
import { SidebarNav } from '@/components/Layout/SidebarNav';
import { ReadingContainer } from '@/components/Reader/ReadingContainer';
import { ChromeShell } from '@/components/Reader/ChromeShell';
import { useEyeStrainSchedule } from '@/hooks/useEyeStrainSchedule';
import { BreakPrompt } from '@/components/Reader/BreakPrompt';

import { adaptationBus } from '@/utils/adaptationBus';
import { AdaptationEvent } from '@/types';
import { saveSession, loadSession } from '@/utils/persistence';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useSessionStore } from '@/store/sessionStore';

export const ReadPage: React.FC = () => {
  const [showBreak, setShowBreak] = useState(false);

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

  const saveDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const onScroll = () => {
      clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = setTimeout(() => {
        const activeParagraphId = useTelemetryStore.getState().activeParagraphId;
        const sessionStartTime = useSessionStore.getState().sessionStartTime ?? Date.now();
        saveSession({
          lastParagraphId: activeParagraphId || "",
          scrollY: window.scrollY,
          appliedAdaptations: [],
          sessionStartTime,
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
    const paragraphs = useSessionStore.getState().paragraphs;
    if (paragraphs.length === 0) return;

    async function restore() {
      let session = await loadSession().catch(() => null);
      if (!session) {
        const lastId = localStorage.getItem("last_paragraph_id");
        const lastY = localStorage.getItem("last_scroll_y");
        if (lastId) {
          session = {
            lastParagraphId: lastId,
            scrollY: Number(lastY) || 0,
            appliedAdaptations: [],
            sessionStartTime: Date.now(),
          };
        }
      }
      if (!session) return;

      const sessionObj = session; 
      const el = document.querySelector(`[data-paragraph-id="${sessionObj.lastParagraphId}"]`);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "instant", block: "start" }), 150);
      } else {
        setTimeout(() => window.scrollTo({ top: sessionObj.scrollY, behavior: "instant" }), 150);
      }
    }
    restore();
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

