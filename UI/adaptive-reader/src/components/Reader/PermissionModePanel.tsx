import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useReadingModeStore } from '@/store/readingModeStore';
import { getParagraphById, getDifficultWords, isAcronym, expandAcronym, fetchDefinition } from '@/utils/nlpStubs';

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
  const setPermissionPanel = useReadingModeStore((s) => s.setPermissionPanel);

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

  if (!visible || mode !== 'permission' || !paragraphId) return null;

  const para = getParagraphById(paragraphId);
  const hardCount =
    words.length > 0 ? words.length : para ? mergeHardWords(para.text).length : 0;

  // Use a fixed bottom-right panel that never overlaps text
  const panel = (
    <div
      className="permission-mode-panel"
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '24px',
        width: '280px',
        maxHeight: '440px',
        overflowY: 'auto',
        zIndex: 750,
        background: 'var(--bg-secondary)',
        border: '1px solid color-mix(in srgb, var(--accent-blue) 35%, var(--border-color))',
        borderRadius: '12px',
        padding: '14px',
        boxSizing: 'border-box',
        boxShadow: '0 8px 24px color-mix(in srgb, var(--text-primary) 12%, transparent)',
        animation: 'panel-appear 200ms ease-out',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-blue)' }}>
          📖 Ask Me Mode
        </div>
        <button
          type="button"
          onClick={() => setPermissionPanel(null, false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {!expanded ? (
        <>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '10px', lineHeight: 1.5 }}>
            This paragraph has <strong>{hardCount || 'several'}</strong> hard word{hardCount === 1 ? '' : 's'}. Want to see them?
          </div>
          <button
            type="button"
            onClick={toggleExpanded}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--accent-blue)',
              background: 'var(--accent-blue)',
              color: '#ffffff',
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
              background: 'var(--bg-tertiary)',
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

  return createPortal(panel, document.body);
};
