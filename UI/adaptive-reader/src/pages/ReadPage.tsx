// DONE: Task 1-9 — ReadPage integrating all new features + Cognate Indicator + Zero-Chrome
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

export const ReadPage: React.FC = () => {
  const paragraphs = useSessionStore(s => s.paragraphs);
  const [showBreak, setShowBreak] = useState(false);
  const burstActive = useUIStore(s => s.burstActive);
  const focusMode = useUIStore(s => s.focusMode);
  const zeroChrome = useUIStore(s => s.zeroChrome);
  const summaryDrawerOpen = useUIStore((s) => s.summaryDrawerOpen);
  const setSummaryDrawerOpen = useUIStore((s) => s.setSummaryDrawerOpen);
  const currentDocument = useDocumentStore((s) => s.currentDocument);

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
  useDocumentPersistence();

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
        if (useUIStore.getState().zeroChrome) {
          useUIStore.getState().exitZeroChrome();
        } else {
          useUIStore.getState().enterZeroChrome();
        }
      }
      if (e.key === 'Escape') {
        if (useUIStore.getState().zeroChrome) {
          useUIStore.getState().exitZeroChrome();
        }
        useUIStore.getState().setSummaryDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Sync zero-chrome state with native fullscreen exit (Esc key exits fullscreen)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && useUIStore.getState().zeroChrome) {
        useUIStore.getState().exitZeroChrome();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Zero-chrome cursor auto-hide: hide cursor after 3s of no movement
  useEffect(() => {
    if (!zeroChrome) {
      document.documentElement.classList.remove('cursor-hidden');
      return;
    }

    let cursorTimer: number | undefined;

    const handleMouseMove = () => {
      document.documentElement.classList.remove('cursor-hidden');
      if (cursorTimer) clearTimeout(cursorTimer);
      cursorTimer = window.setTimeout(() => {
        if (useUIStore.getState().zeroChrome) {
          document.documentElement.classList.add('cursor-hidden');
        }
      }, 3000);
    };

    // Initial hide after 3s
    cursorTimer = window.setTimeout(() => {
      document.documentElement.classList.add('cursor-hidden');
    }, 3000);

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (cursorTimer) clearTimeout(cursorTimer);
      document.documentElement.classList.remove('cursor-hidden');
    };
  }, [zeroChrome]);

  useEffect(() => {
    return () => {
      void endReadingSession();
    };
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
      
      <main
        className={`pb-32 w-full relative ${
          zeroChrome
            ? 'pl-0 pt-12'
            : 'pl-[160px] pt-24 sm:pl-[160px] max-sm:pl-0'
        }`}
        style={{
          transition: 'padding 500ms ease-in-out',
        }}
      >
        <ReadingContainer />
        <PermissionModePanel />
      </main>

      {/* Task 2c: Active paragraph indicator */}
      <ActiveParagraphBox />

      {/* Task 3c: Selection toolbar */}
      <SelectionToolbar />
      <ManualHoverBox />
      <EyeStrainControl />

      {/* Cognate Indicator */}
      <CognateIndicator />

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

      {summaryDrawerOpen && (
        <>
          <button
            type="button"
            className="summary-drawer fixed inset-0 z-[8500] border-none cursor-default"
            style={{
              background: 'color-mix(in srgb, var(--text-primary) 50%, transparent)',
            }}
            aria-label="Close summary"
            onClick={() => setSummaryDrawerOpen(false)}
          />
          <aside
            className="summary-drawer fixed right-0 top-0 z-[8600] h-full w-[300px] overflow-y-auto border-l p-4 shadow-xl"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Summary
              </span>
              <button
                type="button"
                className="text-lg leading-none bg-transparent border-none cursor-pointer"
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
