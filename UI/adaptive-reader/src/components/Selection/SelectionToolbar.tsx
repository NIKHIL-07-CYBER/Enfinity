// DONE: Task 3c — Selection toolbar + Task 2 portal, positioning, highlight, translate
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelectionStore } from '@/store/selectionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getPhonetic, speakText } from '@/utils/pronunciationUtils';
import toast from 'react-hot-toast';

const HIGHLIGHT_SWATCHES = [
  'var(--highlight-swatch-1)',
  'var(--highlight-swatch-2)',
  'var(--highlight-swatch-3)',
  'var(--highlight-swatch-4)',
  'var(--highlight-swatch-5)',
];

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001';

function computeToolbarPosition(rect: DOMRect): { top: number; left: number } {
  const TOOLBAR_HEIGHT = 52;
  const TOOLBAR_WIDTH = 320;
  const MARGIN = 8;
  const NAV_HEIGHT = 60;

  let top = rect.top + window.scrollY - TOOLBAR_HEIGHT - MARGIN;
  let left = rect.left + rect.width / 2 - TOOLBAR_WIDTH / 2;

  if (top - window.scrollY < NAV_HEIGHT + MARGIN) {
    top = rect.bottom + window.scrollY + MARGIN;
  }

  const minLeft = MARGIN;
  const maxLeft = window.innerWidth - TOOLBAR_WIDTH - MARGIN;
  left = Math.max(minLeft, Math.min(maxLeft, left));

  return { top, left };
}

function highlightSelectedText(color: string): void {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);

  try {
    const mark = document.createElement('mark');
    mark.style.backgroundColor = color;
    mark.style.borderRadius = '3px';
    mark.style.padding = '0 1px';
    const hid = crypto.randomUUID();
    mark.dataset.highlightId = hid;
    mark.dataset.color = color;

    if (range.startContainer === range.endContainer) {
      range.surroundContents(mark);
    } else {
      const fragment = range.extractContents();
      mark.appendChild(fragment);
      range.insertNode(mark);
    }
    sel.removeAllRanges();

    const entry = useSelectionStore.getState().buildEntry({
      highlight: color,
      highlightId: hid,
    });
    useSelectionStore.getState().saveEntry(entry);
  } catch (e) {
    console.warn('[Highlight] Could not highlight range:', e);
  }
}

export const SelectionToolbar: React.FC = () => {
  const isVisible = useSelectionStore((s) => s.isToolbarVisible);
  const selectionRect = useSelectionStore((s) => s.selectionRect);
  const currentSelection = useSelectionStore((s) => s.currentSelection);
  const folders = useSelectionStore((s) => s.folders);
  const currentTranslation = useSelectionStore((s) => s.currentTranslation);
  const currentDefinition = useSelectionStore((s) => s.currentDefinition);
  const currentPhonetic = useSelectionStore((s) => s.currentPhonetic);
  const isFetchingTranslation = useSelectionStore((s) => s.isFetchingTranslation);
  const isFetchingDefinition = useSelectionStore((s) => s.isFetchingDefinition);
  const isFetchingPhonetic = useSelectionStore((s) => s.isFetchingPhonetic);
  const noteContent = useSelectionStore((s) => s.noteContent);
  const patchActionPanel = useSelectionStore((s) => s.patchActionPanel);

  const [showColors, setShowColors] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Determine if any results panel should be shown
  const hasResults = !!(
    isFetchingPhonetic ||
    currentPhonetic ||
    isFetchingTranslation ||
    currentTranslation ||
    isFetchingDefinition ||
    currentDefinition ||
    showNote
  );

  if (!isVisible || !selectionRect) return null;

  const domRect = new DOMRect(
    selectionRect.left,
    selectionRect.top,
    selectionRect.width,
    selectionRect.height,
  );
  const position = computeToolbarPosition(domRect);

  const handleTranslate = async () => {
    const text = useSelectionStore.getState().currentSelection;
    if (!text) return;
    patchActionPanel({ isFetchingTranslation: true, currentTranslation: null });
    try {
      const targetLang = useSettingsStore.getState().readingLanguage || 'es';
      const response = await fetch(`${API_BASE}/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          text,
          source: 'en',
          target: targetLang,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = await response.json();
      const data = raw?.data ?? raw;
      const translated =
        data?.translatedText ?? data?.translation ?? raw?.translatedText ?? null;
      patchActionPanel({
        currentTranslation: translated ?? 'Translation unavailable',
        isFetchingTranslation: false,
      });
    } catch (err) {
      console.error('[Translate]', err);
      patchActionPanel({
        currentTranslation: 'Translation unavailable',
        isFetchingTranslation: false,
      });
    }
  };

  const handleDefine = async () => {
    const word = useSelectionStore.getState().currentSelection.split(' ')[0];
    patchActionPanel({ isFetchingDefinition: true, currentDefinition: null });
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      );
      const data = await res.json();
      const def =
        data[0]?.meanings?.[0]?.definitions?.[0]?.definition ?? 'No definition found';
      patchActionPanel({ currentDefinition: def, isFetchingDefinition: false });
    } catch {
      patchActionPanel({ currentDefinition: 'No definition found', isFetchingDefinition: false });
    }
  };

  const handlePronounce = async () => {
    const word = useSelectionStore.getState().currentSelection.split(' ')[0];
    patchActionPanel({ isFetchingPhonetic: true, currentPhonetic: null });
    try {
      const ipa = await getPhonetic(word);
      patchActionPanel({ currentPhonetic: ipa, isFetchingPhonetic: false });
      speakText(useSelectionStore.getState().currentSelection);
    } catch {
      patchActionPanel({ currentPhonetic: '—', isFetchingPhonetic: false });
      speakText(useSelectionStore.getState().currentSelection);
    }
  };

  const handleHighlight = (color: string) => {
    highlightSelectedText(color);
    setShowColors(false);
  };

  const handleSave = (folder: string) => {
    const s = useSelectionStore.getState();
    const entry = s.buildEntry({
      translation: s.currentTranslation ?? undefined,
      definition: s.currentDefinition ?? undefined,
      pronunciation: s.currentPhonetic ?? undefined,
      note: s.noteContent?.trim() || undefined,
      folder,
    });
    s.saveEntry(entry);

    // Show success feedback
    toast.success(`Saved to "${folder}"`, { duration: 2000 });

    // Clear note and close everything
    patchActionPanel({ noteContent: '' });
    setShowFolders(false);
    setShowNote(false);
    s.setToolbarVisible(false);
  };

  const handleNewFolder = () => {
    if (newFolderName.trim()) {
      useSelectionStore.getState().addFolder(newFolderName.trim());
      handleSave(newFolderName.trim());
      setNewFolderName('');
    }
  };

  // Offset for secondary panels
  const secondaryTop = 48;
  const tertiaryTop = showColors || showFolders ? 88 : 48;

  const toolbarInner = (
    <div
      className="selection-toolbar"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 7800,
        pointerEvents: 'auto',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Main toolbar row */}
      <div
        style={{
          background: 'var(--toolbar-surface)',
          borderRadius: '10px',
          padding: '6px 10px',
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
          boxShadow: '0 4px 16px color-mix(in srgb, var(--text-primary) 12%, transparent)',
          border: '1px solid var(--border-color)',
        }}
      >
        <button onClick={handleTranslate} title="Translate" style={btnStyle}>
          🌐
        </button>
        <button onClick={() => { setShowColors(!showColors); setShowFolders(false); }} title="Highlight" style={btnStyle}>
          🔆
        </button>
        <button onClick={handlePronounce} title="Pronounce" style={btnStyle}>
          🔊
        </button>
        <button onClick={handleDefine} title="Define" style={btnStyle}>
          📖
        </button>
        <button
          onClick={() => { setShowNote(!showNote); setShowColors(false); setShowFolders(false); }}
          title="Add Note"
          style={{
            ...btnStyle,
            background: showNote ? 'var(--accent-blue-bg)' : 'none',
            color: showNote ? 'var(--accent-blue)' : 'var(--text-primary)',
          }}
        >
          📝
        </button>
        <button
          onClick={() => { setShowFolders(!showFolders); setShowColors(false); setShowNote(false); }}
          title="Save to Library"
          style={btnStyle}
        >
          🔖
        </button>
      </div>

      {/* Highlight color picker */}
      {showColors && (
        <div
          style={{
            position: 'absolute',
            top: `${secondaryTop}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--toolbar-surface)',
            borderRadius: '8px',
            padding: '6px',
            display: 'flex',
            gap: '4px',
            border: '1px solid var(--border-color)',
            zIndex: 1,
          }}
        >
          {HIGHLIGHT_SWATCHES.map((color, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleHighlight(color)}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: color,
                border: '2px solid var(--border-color)',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}

      {/* Save to folder picker */}
      {showFolders && (
        <div
          style={{
            position: 'absolute',
            top: `${secondaryTop}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--toolbar-surface)',
            borderRadius: '8px',
            padding: '8px',
            minWidth: '160px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 12px color-mix(in srgb, var(--text-primary) 10%, transparent)',
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', paddingLeft: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Save to folder
          </div>
          {folders.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => handleSave(f)}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px 8px',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '13px',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-blue-bg)';
                e.currentTarget.style.color = 'var(--accent-blue)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
            >
              📁 {f}
            </button>
          ))}
          <div
            style={{
              borderTop: '1px solid var(--border-color)',
              margin: '6px 0 4px',
              paddingTop: '6px',
            }}
          >
            <input
              placeholder="New folder…"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNewFolder();
              }}
              style={{
                width: '100%',
                padding: '5px 8px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      )}

      {/* Note textarea — only shown when user clicks the note button */}
      {showNote && (
        <div
          style={{
            position: 'absolute',
            top: `${secondaryTop}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            padding: '10px',
            width: '260px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 12px color-mix(in srgb, var(--text-primary) 8%, transparent)',
            zIndex: 1,
          }}
        >
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📝 Your Note
          </label>
          <textarea
            value={noteContent}
            onChange={(e) => patchActionPanel({ noteContent: e.target.value })}
            rows={3}
            placeholder="Add a note about this selection…"
            autoFocus
            style={{
              width: '100%',
              resize: 'vertical',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '6px 8px',
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Click 🔖 to save note to your library
          </div>
        </div>
      )}

      {/* Results panel — only when there's something to show */}
      {hasResults && !showNote && (
        <div
          key={currentSelection}
          className="toolbar-results"
          style={{
            position: 'absolute',
            top: `${tertiaryTop}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: 'var(--text-primary)',
            fontSize: '12px',
            minWidth: '200px',
            maxWidth: '300px',
            lineHeight: 1.4,
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 12px color-mix(in srgb, var(--text-primary) 8%, transparent)',
          }}
        >
          {isFetchingPhonetic && <div style={{ opacity: 0.7 }}>Loading pronunciation…</div>}
          {currentPhonetic && !isFetchingPhonetic && (
            <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>🔊 {currentPhonetic}</div>
          )}
          {isFetchingTranslation && <div style={{ opacity: 0.7 }}>Translating…</div>}
          {currentTranslation && !isFetchingTranslation && (
            <div style={{ marginBottom: '4px' }}>🌐 {currentTranslation}</div>
          )}
          {isFetchingDefinition && <div style={{ opacity: 0.7 }}>Looking up…</div>}
          {currentDefinition && !isFetchingDefinition && (
            <div style={{ color: 'var(--text-secondary)' }}>📖 {currentDefinition}</div>
          )}
        </div>
      )}
    </div>
  );

  return createPortal(toolbarInner, document.body);
};

const btnStyle: React.CSSProperties = {
  width: '30px',
  height: '30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  borderRadius: '6px',
  transition: 'background 150ms',
  color: 'var(--text-primary)',
};
