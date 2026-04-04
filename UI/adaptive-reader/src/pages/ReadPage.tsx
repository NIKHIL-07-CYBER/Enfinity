// DONE: Task 1-9 — ReadPage integrating all new features
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TopNav } from '@/components/Layout/TopNav';
import { SidebarNav } from '@/components/Layout/SidebarNav';
import { ReadingContainer } from '@/components/Reader/ReadingContainer';
import { ChromeShell } from '@/components/Reader/ChromeShell';
import { useEyeStrainSchedule } from '@/hooks/useEyeStrainSchedule';
import { BreakPrompt } from '@/components/Reader/BreakPrompt';
import { ActiveParagraphBox } from '@/components/Reader/ActiveParagraphBox';
import { FocusModeButton } from '@/components/Reader/FocusModeButton';
import { SelectionToolbar } from '@/components/Selection/SelectionToolbar';
import { ChatbotAvatar } from '@/components/Chatbot/ChatbotAvatar';
import { ChatbotPanel } from '@/components/Chatbot/ChatbotPanel';

import { adaptationBus } from '@/utils/adaptationBus';
import type { AdaptationEvent } from '@/types';
import { saveSession, loadSession } from '@/utils/persistence';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useSessionStore } from '@/store/sessionStore';
import { useUIStore } from '@/store/uiStore';
import { useChatbotStore } from '@/store/chatbotStore';
import { syncParagraphsToNlp } from '@/utils/paragraphUtils';
import { useActiveParagraph } from '@/hooks/useActiveParagraph';
import { useTextSelection } from '@/hooks/useTextSelection';
import { useUIVisibility } from '@/hooks/useUIVisibility';
import { useDynamicBrightness } from '@/hooks/useDynamicBrightness';
import { usePermissionMode } from '@/hooks/usePermissionMode';
import { useManualMode } from '@/hooks/useManualMode';
import { PermissionModePanel } from '@/components/Reader/PermissionModePanel';
import { ManualHoverBox } from '@/components/Reader/ManualHoverBox';
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
  const burstActive = useUIStore(s => s.burstActive);
  const focusMode = useUIStore(s => s.focusMode);

  // --- Telemetry hooks ---
  useTelemetryResume();
  useRegressionTracker();
  useParagraphDwell(paragraphs);
  useHighlightHesitation();

  // --- New hooks (Tasks 2, 3, 6, 8) ---
  useActiveParagraph(paragraphs);
  useTextSelection();
  useUIVisibility();
  useDynamicBrightness();
  usePermissionMode();
  useManualMode();

  // Eye strain schedule
  useEyeStrainSchedule({
    onBreakDue: () => setShowBreak(true)
  });

  // Context awareness for chatbot (Task 5f)
  const activeParagraphId = useTelemetryStore(s => s.activeParagraphId);
  useEffect(() => {
    if (activeParagraphId) {
      useChatbotStore.getState().setContextParagraph(activeParagraphId);
    }
  }, [activeParagraphId]);

  // Burst cleanup (Task 6)
  useEffect(() => {
    if (burstActive) {
      const timer = setTimeout(() => {
        useUIStore.setState({ burstActive: false });
      }, 280);
      return () => clearTimeout(timer);
    }
  }, [burstActive]);

  // Focus mode init on mount (Task 7)
  useEffect(() => {
    if (focusMode) {
      document.documentElement.classList.add('focus-mode-active');
    }
    return () => {
      document.documentElement.classList.remove('focus-mode-active');
    };
  }, [focusMode]);

  // Keyboard shortcut: Ctrl+Shift+F for focus mode (Task 7e)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        useUIStore.getState().toggleFocusMode();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Adaptation announcer
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

  // Session save on scroll
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

  // Before unload save
  useEffect(() => {
    const onUnload = () => {
      const activeParagraphId = useTelemetryStore.getState().activeParagraphId;
      localStorage.setItem("last_paragraph_id", activeParagraphId || "");
      localStorage.setItem("last_scroll_y", String(window.scrollY));
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  // Session restore
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
        // Save article title for chatbot context
        const title = session.paragraphs[0]?.text?.split('\n')[0] || 'Untitled';
        localStorage.setItem('last_article_title', title);
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
      
      <main className="pl-[160px] pb-32 pt-24 w-full sm:pl-[160px] max-sm:pl-0 relative">
        <ReadingContainer />
        <PermissionModePanel />
      </main>

      {/* Task 2c: Active paragraph indicator */}
      <ActiveParagraphBox />

      {/* Task 3c: Selection toolbar */}
      <SelectionToolbar />
      <ManualHoverBox />

      {/* Task 5: Chatbot */}
      <ChatbotAvatar />
      <ChatbotPanel />

      {/* Task 7: Focus mode button */}
      <FocusModeButton />

      {/* Break prompt */}
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
