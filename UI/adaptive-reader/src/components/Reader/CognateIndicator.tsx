// Feature 2: Multi-Lingual Cognate Mapper — Floating indicator + cognate swap panel
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adaptationBus } from '@/utils/adaptationBus';
import type { AdaptationEvent } from '@/types';
import { useSettingsStore } from '@/store/settingsStore';

const LANGUAGE_LABELS: Record<string, string> = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  hi: 'Hindi',
  zh: 'Chinese',
  en: 'English',
};

interface CognateSwap {
  original: string;
  replacement: string;
  paragraphId: string;
  timestamp: number;
}

export const CognateIndicator: React.FC = () => {
  const [active, setActive] = useState(false);
  const [swaps, setSwaps] = useState<CognateSwap[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const hideTimerRef = useRef<number | undefined>(undefined);
  const readingLanguage = useSettingsStore((s) => s.readingLanguage);

  useEffect(() => {
    const handler = (event: AdaptationEvent) => {
      if (event.type !== 'cognate') return;

      setActive(true);
      setSwaps((prev) => [
        ...prev,
        {
          original: event.originalWord,
          replacement: event.replacement,
          paragraphId: event.paragraphId,
          timestamp: Date.now(),
        },
      ]);

      // Auto-hide after 3 seconds
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => {
        setActive(false);
      }, 3000);
    };

    adaptationBus.on('adaptation', handler);
    return () => {
      adaptationBus.off('adaptation', handler);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const langLabel = LANGUAGE_LABELS[readingLanguage] || readingLanguage;

  if (swaps.length === 0 && !active) return null;

  return (
    <>
      {/* Floating indicator badge */}
      <AnimatePresence>
        {(active || panelOpen) && (
          <motion.button
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            className="cognate-indicator"
            style={{
              position: 'fixed',
              top: '72px',
              right: '24px',
              zIndex: 7700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--accent-blue)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              transition: 'box-shadow 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
            }}
          >
            <span
              style={{
                display: 'inline-block',
                animation: active ? 'pulse-ring 1.5s infinite' : 'none',
              }}
            >
              🌐
            </span>
            <span>ESL · {langLabel}</span>
            <span
              style={{
                background: 'var(--accent-blue)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '10px',
                padding: '1px 6px',
                minWidth: '18px',
                textAlign: 'center',
              }}
            >
              {swaps.length}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cognate Panel */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="cognate-panel"
            style={{
              position: 'fixed',
              top: '112px',
              right: '24px',
              zIndex: 7700,
              width: '300px',
              maxHeight: '400px',
              overflowY: 'auto',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              padding: '20px',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div
                  style={{
                    fontSize: '10px',
                    letterSpacing: '1.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase' as const,
                    color: 'var(--text-secondary)',
                    marginBottom: '2px',
                  }}
                >
                  COGNATE SWAPS
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {langLabel} ({swaps.length} swap{swaps.length !== 1 ? 's' : ''})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Language quick-switch */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {(['es', 'fr', 'de', 'pt'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => useSettingsStore.getState().setReadingLanguage(lang)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${readingLanguage === lang ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                    background:
                      readingLanguage === lang
                        ? 'var(--accent-blue-bg)'
                        : 'transparent',
                    color:
                      readingLanguage === lang
                        ? 'var(--accent-blue)'
                        : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>

            {/* Swaps List */}
            <div className="flex flex-col gap-2">
              {swaps.length === 0 ? (
                <div
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                  }}
                >
                  No cognate swaps yet
                </div>
              ) : (
                [...swaps].reverse().map((swap, i) => (
                  <div
                    key={`${swap.original}-${i}`}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          textDecoration: 'line-through',
                          opacity: 0.5,
                        }}
                      >
                        {swap.original}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        →
                      </span>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--accent-blue)',
                        }}
                      >
                        {swap.replacement}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {new Date(swap.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
