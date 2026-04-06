import React from 'react';
import { createPortal } from 'react-dom';
import { useReadingModeStore } from '@/store/readingModeStore';
import { useSettingsStore } from '@/store/settingsStore';

const NAV = 60;
const BOX_W = 220;
const MARGIN = 8;

function computePosition(rect: DOMRect): { top: number; left: number } {
  const estH = 160;
  let top = rect.top + window.scrollY - estH - MARGIN;
  if (top - window.scrollY < NAV + MARGIN) {
    top = rect.bottom + window.scrollY + MARGIN;
  }
  let left = rect.left + window.scrollX + rect.width / 2 - BOX_W / 2;
  const minL = window.scrollX + MARGIN;
  const maxL = window.scrollX + window.innerWidth - BOX_W - MARGIN;
  left = Math.max(minL, Math.min(left, maxL));
  return { top, left };
}

export const ManualHoverBox: React.FC = () => {
  const mode = useReadingModeStore((s) => s.mode);
  const word = useReadingModeStore((s) => s.hoverWord);
  const rect = useReadingModeStore((s) => s.hoverWordRect);
  const definition = useReadingModeStore((s) => s.hoverDefinition);
  const translation = useReadingModeStore((s) => s.hoverTranslation);
  const loading = useReadingModeStore((s) => s.manualHoverLoading);
  const readingLang = useSettingsStore((s) => s.readingLanguage);

  if (mode !== 'manual' || !word || !rect) return null;

  const { top, left } = computePosition(rect);

  const dismiss = () => {
    useReadingModeStore.getState().setHoverWord(null, null);
  };

  const box = (
    <div
      className="manual-hover-box"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top,
        left,
        width: BOX_W,
        maxWidth: BOX_W,
        zIndex: 7500,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '12px 14px',
        boxShadow: '0 4px 20px color-mix(in srgb, var(--text-primary) 14%, transparent)',
        pointerEvents: 'auto',
        animation: 'panel-appear 160ms ease-out',
      }}
    >
      {/* Header row with word and dismiss button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{word}</div>
        <button
          type="button"
          onClick={dismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-tertiary)',
            fontSize: '12px',
            padding: '2px 4px',
            borderRadius: '4px',
            lineHeight: 1,
          }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      {loading && (
        <div style={{ marginTop: '8px' }}>
          <div
            style={{
              height: '8px',
              borderRadius: '4px',
              background: 'var(--bg-tertiary)',
              width: '85%',
              marginBottom: '6px',
            }}
          />
          <div
            style={{
              height: '8px',
              borderRadius: '4px',
              background: 'var(--bg-tertiary)',
              width: '60%',
            }}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>Loading…</div>
        </div>
      )}
      {!loading && definition && (
        <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {definition}
        </div>
      )}
      {!loading && translation && readingLang !== 'en' && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          {`🌐 ${translation} (${readingLang})`}
        </div>
      )}
      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
        Click another word or ✕ to dismiss
      </div>
    </div>
  );

  return createPortal(box, document.body);
};
