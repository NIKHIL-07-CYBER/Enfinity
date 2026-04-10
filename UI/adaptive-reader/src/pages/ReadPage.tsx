// DONE: Task 1-9 — ReadPage integrating all new features + Cognate Indicator + Zero-Chrome
import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion'; 
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
import { CognateIndicator } from '@/components/Reader/CognateIndicator';

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
import { EyeStrainControl } from '@/components/Reader/EyeStrainControl';
import { 
  useParagraphDwell, 
  useRegressionTracker, 
  useHighlightHesitation, 
  useTelemetryResume,
  TelemetryOverlay
} from '@telemetry';
import { useDocumentPersistence } from '@/hooks/useDocumentPersistence';
import { endReadingSession } from '@/utils/endReadingSession';
import { SummaryPanel } from '@/components/Document/SummaryPanel';
import { useDocumentStore } from '@/store/documentStore';

const ReadingProgressBar: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] z- origin-left"
      style={{ 
        scaleX, 
        backgroundColor: 'var(--accent-blue)',
        boxShadow: '0 0 8px var(--accent-blue)' 
      }}
    />
  );
};

export const ReadPage: React.FC = () => {
  const paragraphs = useSessionStore(s => s.paragraphs);
  const [showBreak, setShowBreak] = useState(false);
  const burstActive = useUIStore(s => s.burstActive);
  const focusMode = useUIStore(s => s.focusMode);
  const zeroChrome = useUIStore(s => s.zeroChrome);
  const summaryDrawerOpen = useUIStore((s) => s.summaryDrawerOpen);
  const setSummaryDrawerOpen = useUIStore((s) => s.setSummaryDrawerOpen);
  const currentDocument = useDocumentStore((s) => s.currentDocument);
  
  useTelemetryResume();
  useRegressionTracker();
  useParagraphDwell(paragraphs);
  useHighlightHesitation();

  useActiveParagraph(paragraphs);
  useTextSelection();
  useUIVisibility();
  useDynamicBrightness();
  usePermissionMode();
  useManualMode();
  useDocumentPersistence();

  useEyeStrainSchedule({
    onBreakDue: () => setShowBreak(true)
  });

  const activeParagraphId = useTelemetryStore(s => s.activeParagraphId);
  useEffect(() => {
    if (activeParagraphId) {
      useChatbotStore.getState().setContextParagraph(activeParagraphId);
    }
  }, [activeParagraphId]);

  useEffect(() => {
    if (burstActive) {
      const timer = setTimeout(() => {
        useUIStore.setState({ burstActive: false });
      }, 280);
      return () => clearTimeout(timer);
    }
  }, [burstActive]);

  useEffect(() => {
    if (focusMode) {
      document.documentElement.classList.add('focus-mode-active');
    }
    return () => {
      document.documentElement.classList.remove('focus-mode-active');
    };
  }, [focusMode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        const ui = useUIStore.getState();
        ui.zeroChrome ? ui.exitZeroChrome() : ui.enterZeroChrome();
      }
      if (e.key === 'Escape') {
        const ui = useUIStore.getState();
        if (ui.zeroChrome) ui.exitZeroChrome();
        ui.setSummaryDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && useUIStore.getState().zeroChrome) {
        useUIStore.getState().exitZeroChrome();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!zeroChrome) {
      document.documentElement.classList.remove('cursor-hidden');
      return;
    }
    let cursorTimer: number;
    const handleMouseMove = () => {
      document.documentElement.classList.remove('cursor-hidden');
      clearTimeout(cursorTimer);
      cursorTimer = window.setTimeout(() => {
        if (useUIStore.getState().zeroChrome) {
          document.documentElement.classList.add('cursor-hidden');
        }
      }, 3000);
    };
    cursorTimer = window.setTimeout(() => {
      document.documentElement.classList.add('cursor-hidden');
    }, 3000);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(cursorTimer);
      document.documentElement.classList.remove('cursor-hidden');
    };
  }, [zeroChrome]);

  useEffect(() => {
    return () => {
      void endReadingSession();
    };
  }, []);

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
      clearTimeout(saveDebounceRef.current);
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
            paragraphs: useSessionStore.getState().paragraphs 
          };
        }
      }
      if (cancelled || !session) return;

      if (session.paragraphs?.length) {
        useSessionStore.getState().setParagraphs(session.paragraphs);
        syncParagraphsToNlp(session.paragraphs);
        // FIX: Access paragraphs to get the text of the first paragraph 
        const title = session.paragraphs?.text?.split('\n') || 'Untitled';
        localStorage.setItem('last_article_title', title);
      }
      
      if (session.sessionStartTime) {
        useSessionStore.getState().setSessionStartTime(session.sessionStartTime);
      }

      const targetId = session.lastParagraphId;
      const fallbackY = session.scrollY;
      const delays = [50];
      let attempt = 0;

      const tryScroll = () => {
        if (cancelled) return;
        const el = targetId ? document.querySelector(`[data-paragraph-id="${targetId}"]`) : null;
        if (el) {
          el.scrollIntoView({ behavior: "instant", block: "start" });
          return;
        }
        if (attempt < delays.length) {
          setTimeout(tryScroll, delays[attempt++]);
        } else {
          window.scrollTo({ top: fallbackY, behavior: "instant" });
        }
      };

      if (session.paragraphs?.length) {
        requestAnimationFrame(() => tryScroll());
      } else {
        tryScroll();
      }
    }
    restore();
    return () => { cancelled = true; };
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
      <ReadingProgressBar />
      <TelemetryOverlay />
      
      <ChromeShell>
        <TopNav />
      </ChromeShell>
      
      <SidebarNav activePage="reader" />
      
      <main
        className={`pb-32 w-full relative transition-[padding] duration-500 ease-in-out ${
          zeroChrome ? 'pl-0 pt-12' : 'pl-[160px] pt-24 sm:pl-[160px] max-sm:pl-0'
        }`}
      >
        <ReadingContainer />
        <PermissionModePanel />
      </main>

      <ActiveParagraphBox />
      <SelectionToolbar />
      <ManualHoverBox />
      <EyeStrainControl />
      <CognateIndicator />
      <ChatbotAvatar />
      <ChatbotPanel />
      <FocusModeButton />

      <BreakPrompt isVisible={showBreak} onDismiss={() => setShowBreak(false)} />

      <div
        aria-live="polite"
        aria-atomic="true"
        id="adaptation-announcer"
        className="sr-only"
        style={{ position: "absolute", left: "-9999px" }}
      />

      {summaryDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z- cursor-default"
            style={{ background: 'color-mix(in srgb, var(--text-primary) 50%, transparent)' }}
            onClick={() => setSummaryDrawerOpen(false)}
          />
          <aside
            className="fixed right-0 top-0 z- h-full w-[300px] overflow-y-auto border-l p-4 shadow-xl"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Summary</span>
              <button
                type="button"
                className="text-2xl bg-transparent border-none cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setSummaryDrawerOpen(false)}
              >
                ×
              </button>
            </div>
            <SummaryPanel doc={currentDocument} />
          </aside>
        </>
      )}
    </motion.div>
  );
};