import React, { useEffect, useState, useCallback } from 'react';
import { useReadingModeStore } from '@/store/readingModeStore';
import { getParagraphById } from '@nlp/utils/paragraphUtils';
import { getDifficultWords, isAcronym, expandAcronym } from '@nlp/utils/nlpUtils';
import { fetchDefinition } from '@nlp/utils/definitionFetcher';

function mergeHardWords(text: string): string[] {
  const difficult = getDifficultWords(text);
  const acronyms = [...text.matchAll(/\b[A-Z]{2,6}\b/g)].map((m) => m[0]);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of [...difficult, ...acronyms]) {
    const k = w.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(w);
  }
  return out.slice(0, 14);
}

export const PermissionModePanel: React.FC = () => {
  const mode = useReadingModeStore((s) => s.mode);
  const paragraphId = useReadingModeStore((s) => s.permissionPanelParagraphId);
  const visible = useReadingModeStore((s) => s.permissionPanelVisible);
  const expanded = useReadingModeStore((s) => s.permissionPanelExpanded);
  const words = useReadingModeStore((s) => s.permissionPanelWords);
  const loading = useReadingModeStore((s) => s.permissionPanelLoading);
  const toggleExpanded = useReadingModeStore((s) => s.togglePermissionExpanded);
  const setWords = useReadingModeStore((s) => s.setPermissionPanelWords);
  const setLoading = useReadingModeStore((s) => s.setPermissionPanelLoading);

  const [layout, setLayout] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    placement: 'right' | 'bottom';
  } | null>(null);

  useEffect(() => {
    if (!visible || !paragraphId || mode !== 'permission') return;

    const run = async () => {
      const p = getParagraphById(paragraphId);
      if (!p) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const list = mergeHardWords(p.text);
      const settled = await Promise.allSettled(
        list.map(async (w) => {
          let definition: string;
          if (isAcronym(w)) {
            const ex = await expandAcronym(w, p.text);
            definition = ex ?? (await fetchDefinition(w));
          } else {
            definition = await fetchDefinition(w);
          }
          return { word: w, definition, isAcronym: isAcronym(w) };
        }),
      );
      const rows = settled
        .filter((r): r is PromiseFulfilledResult<{ word: string; definition: string; isAcronym: boolean }> => r.status === 'fulfilled')
        .map((r) => r.value);
      setWords(rows);
    };

    void run();
  }, [visible, paragraphId, mode, setWords, setLoading]);

  const recomputeLayout = useCallback(() => {
    if (!paragraphId || !visible) return;
    const el = document.querySelector(`[data-paragraph-id="${paragraphId}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const panelW = 220;
    const gap = 12;
    const vw = window.innerWidth;
    const rightEdge = r.right + gap + panelW;
    if (rightEdge <= vw - 8) {
      setLayout({
        top: r.top + window.scrollY,
        left: r.right + gap + window.scrollX,
        width: panelW,
        maxHeight: Math.max(120, r.height),
        placement: 'right',
      });
    } else {
      const readCol = document.querySelector('.reading-container');
      const rc = readCol?.getBoundingClientRect();
      const left = rc ? rc.left + window.scrollX : 16;
      const width = rc ? rc.width : Math.min(680, vw - 32);
      setLayout({
        top: r.bottom + window.scrollY + gap,
        left,
        width,
        maxHeight: 320,
        placement: 'bottom',
      });
    }
  }, [paragraphId, visible]);

  useEffect(() => {
    if (!visible || !paragraphId) {
      setLayout(null);
      return;
    }
    recomputeLayout();
    const onScroll = () => recomputeLayout();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [visible, paragraphId, recomputeLayout]);

  if (!visible || mode !== 'permission' || !paragraphId || !layout) return null;

  const para = getParagraphById(paragraphId);
  const hardCount =
    words.length > 0 ? words.length : para ? mergeHardWords(para.text).length : 0;

  return (
    <div
      className="permission-mode-panel"
      style={{
        position: 'absolute',
        top: layout.top,
        left: layout.left,
        width: layout.width,
        maxHeight: layout.maxHeight,
        overflow: 'auto',
        zIndex: 750,
        background: 'var(--accent-blue-bg)',
        border: '1px solid color-mix(in srgb, var(--accent-blue) 25%, var(--border-color))',
        borderRadius: '10px',
        padding: '12px',
        boxSizing: 'border-box',
      }}
    >
      {!expanded ? (
        <>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '10px', lineHeight: 1.45 }}>
            This paragraph has {hardCount || 'several'} hard word{hardCount === 1 ? '' : 's'}. Want to see them?
          </div>
          <button
            type="button"
            onClick={toggleExpanded}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--accent-blue)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Show definitions ▼
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
            Hard words in this paragraph:
          </div>
          {loading && (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Loading definitions…</div>
          )}
          {!loading &&
            words.map((row, i) => (
              <div
                key={`${row.word}-${i}`}
                style={{
                  paddingBottom: '10px',
                  marginBottom: '10px',
                  borderBottom: i < words.length - 1 ? '1px solid var(--border-color)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{row.word}</span>
                  {row.isAcronym && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'color-mix(in srgb, var(--accent-blue) 15%, var(--bg-tertiary))',
                        color: 'var(--accent-blue)',
                        fontFamily: 'ui-monospace, monospace',
                      }}
                    >
                      ACRONYM
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '4px' }}>
                  {row.definition}
                </div>
              </div>
            ))}
          <button
            type="button"
            onClick={toggleExpanded}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Hide ▲
          </button>
        </>
      )}
    </div>
  );
};
