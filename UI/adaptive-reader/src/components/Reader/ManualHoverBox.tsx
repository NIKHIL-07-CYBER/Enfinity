import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReadingModeStore } from '@/store/readingModeStore';
import { getPhonetic } from '@/utils/pronunciationUtils';
import { useSettingsStore } from '@/store/settingsStore';

const NAV = 60;
const BOX_W = 200;
const MARGIN = 8;

function computePosition(rect: DOMRect): { top: number; left: number } {
  const estH = 140;
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

  const [ipa, setIpa] = useState<string | null>(null);

  useEffect(() => {
    if (!word || mode !== 'manual') {
      setIpa(null);
      return;
    }
    let cancelled = false;
    void getPhonetic(word).then((p) => {
      if (!cancelled) setIpa(p);
    });
    return () => {
      cancelled = true;
    };
  }, [word, mode]);

  if (mode !== 'manual' || !word || !rect) return null;

  const sel = window.getSelection()?.toString()?.trim();
  if (sel && sel.length > 0) return null;

  const { top, left } = computePosition(rect);

  const box = (
    <div
      className="manual-hover-box"
      onMouseEnter={() => {
        /* keep visible while over tooltip */
      }}
      style={{
        position: 'absolute',
        top,
        left,
        width: BOX_W,
        maxWidth: BOX_W,
        zIndex: 7500,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '10px 12px',
        boxShadow: '0 4px 16px color-mix(in srgb, var(--text-primary) 10%, transparent)',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{word}</div>
      {ipa && (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '4px' }}>
          {ipa}
        </div>
      )}
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
        <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '8px', lineHeight: 1.45 }}>
          {definition}
        </div>
      )}
      {!loading && translation && readingLang !== 'en' && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          {`🌐 ${translation} (${readingLang})`}
        </div>
      )}
    </div>
  );

  return createPortal(box, document.body);
};
