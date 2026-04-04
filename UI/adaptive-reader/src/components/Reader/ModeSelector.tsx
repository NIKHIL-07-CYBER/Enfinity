import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useReadingModeStore } from '@/store/readingModeStore';
import type { ReadingMode } from '@/types/ReadingMode';

const MODES: { id: ReadingMode; label: string; hint: string }[] = [
  {
    id: 'automatic',
    label: 'Auto',
    hint: 'Hard words replaced automatically when you struggle',
  },
  {
    id: 'permission',
    label: 'Ask me',
    hint: "You'll be asked before definitions are shown",
  },
  {
    id: 'manual',
    label: 'Manual',
    hint: 'Hover over any word to see its definition',
  },
];

export const ModeSelector: React.FC = () => {
  const mode = useReadingModeStore((s) => s.mode);
  const setMode = useReadingModeStore((s) => s.setMode);

  return (
    <Tooltip.Provider delayDuration={400}>
      <div
        className="flex rounded-md overflow-hidden shrink-0"
        style={{
          width: '180px',
          height: '30px',
          border: '1px solid var(--border-color)',
        }}
        role="group"
        aria-label="Reading assistance mode"
      >
        {MODES.map(({ id, label, hint }) => {
          const active = mode === id;
          return (
            <Tooltip.Root key={id}>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={() => setMode(id)}
                  className="flex-1 text-[11px] font-medium transition-colors"
                  style={{
                    background: active ? 'var(--accent-blue)' : 'transparent',
                    color: active ? 'var(--toolbar-on-accent)' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  {label}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="bottom"
                  sideOffset={6}
                  style={{
                    maxWidth: '220px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    fontSize: '12px',
                    lineHeight: 1.4,
                    boxShadow: '0 4px 12px color-mix(in srgb, var(--text-primary) 8%, transparent)',
                    zIndex: 12000,
                  }}
                >
                  {hint}
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          );
        })}
      </div>
    </Tooltip.Provider>
  );
};
