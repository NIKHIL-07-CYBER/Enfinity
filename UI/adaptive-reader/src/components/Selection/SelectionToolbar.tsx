// DONE: Task 3c — Selection toolbar
import React, { useState } from 'react';
import { useSelectionStore } from '@/store/selectionStore';
import { getPhonetic, speakText } from '@/utils/pronunciationUtils';

const HIGHLIGHT_COLORS = [
  '#FFE066', '#A8F0C6', '#A8D8F0', '#F0A8C8', '#D4A8F0'
];

export const SelectionToolbar: React.FC = () => {
  const isVisible = useSelectionStore(s => s.isToolbarVisible);
  const selectionRect = useSelectionStore(s => s.selectionRect);
  const currentSelection = useSelectionStore(s => s.currentSelection);
  const currentParagraphId = useSelectionStore(s => s.currentParagraphId);
  const folders = useSelectionStore(s => s.folders);

  const [showColors, setShowColors] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const [definition, setDefinition] = useState<string | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [pronunciation, setPronunciation] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

  if (!isVisible || !selectionRect) return null;

  const left = Math.max(80, Math.min(
    selectionRect.left + selectionRect.width / 2,
    window.innerWidth - 80
  ));
  const top = selectionRect.top + window.scrollY - 48;

  const handleTranslate = async () => {
    try {
      const settings = JSON.parse(localStorage.getItem('reader_settings') || '{}');
      const target = settings.defaultLanguage || 'es';
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: currentSelection, source: 'en', target }),
      });
      const data = await res.json();
      setTranslation(data.data?.translatedText || data.translatedText || 'Translation unavailable');
    } catch {
      setTranslation('Translation unavailable');
    }
  };

  const handleDefine = async () => {
    try {
      const word = currentSelection.split(' ')[0];
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      const data = await res.json();
      const def = data[0]?.meanings?.[0]?.definitions?.[0]?.definition || 'No definition found';
      setDefinition(def);
    } catch {
      setDefinition('No definition found');
    }
  };

  const handlePronounce = async () => {
    const ipa = await getPhonetic(currentSelection.split(' ')[0]);
    setPronunciation(ipa);
    speakText(currentSelection);
  };

  const handleHighlight = (color: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const mark = document.createElement('mark');
    mark.style.background = color;
    mark.style.borderRadius = '3px';
    mark.style.padding = '0 1px';

    try {
      range.surroundContents(mark);
    } catch {
      // Handle partial selections
    }

    useSelectionStore.getState().saveEntry({
      id: crypto.randomUUID(),
      text: currentSelection,
      paragraphId: currentParagraphId,
      timestamp: Date.now(),
      type: 'word',
      highlight: color,
    });

    setShowColors(false);
  };

  const handleSave = (folder: string) => {
    useSelectionStore.getState().saveEntry({
      id: crypto.randomUUID(),
      text: currentSelection,
      paragraphId: currentParagraphId,
      timestamp: Date.now(),
      type: currentSelection.includes(' ') ? (currentSelection.match(/[.?!]$/) ? 'sentence' : 'phrase') : 'word',
      translation: translation || undefined,
      definition: definition || undefined,
      pronunciation: pronunciation || undefined,
      folder,
    });
    setShowFolders(false);
    useSelectionStore.getState().setToolbarVisible(false);
  };

  const handleNewFolder = () => {
    if (newFolderName.trim()) {
      useSelectionStore.getState().addFolder(newFolderName.trim());
      handleSave(newFolderName.trim());
      setNewFolderName('');
    }
  };

  return (
    <div
      className="selection-toolbar"
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        transform: 'translateX(-50%)',
        zIndex: 7800,
        animation: 'toolbar-appear 120ms ease-out',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={{
        background: 'rgba(30, 58, 95, 0.95)',
        borderRadius: '10px',
        padding: '6px 10px',
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      }}>
        <button onClick={handleTranslate} title="Translate" style={btnStyle}>🌐</button>
        <button onClick={() => setShowColors(!showColors)} title="Highlight" style={btnStyle}>🔆</button>
        <button onClick={handlePronounce} title="Pronounce" style={btnStyle}>🔊</button>
        <button onClick={handleDefine} title="Define" style={btnStyle}>📖</button>
        <button onClick={() => setShowFolders(!showFolders)} title="Save" style={btnStyle}>🔖</button>
      </div>

      {/* Color picker */}
      {showColors && (
        <div style={{
          position: 'absolute',
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(30, 58, 95, 0.95)',
          borderRadius: '8px',
          padding: '6px',
          display: 'flex',
          gap: '4px',
        }}>
          {HIGHLIGHT_COLORS.map(color => (
            <button
              key={color}
              onClick={() => handleHighlight(color)}
              style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: color, border: '2px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}

      {/* Folder picker */}
      {showFolders && (
        <div style={{
          position: 'absolute',
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(30, 58, 95, 0.95)',
          borderRadius: '8px',
          padding: '8px',
          minWidth: '140px',
        }}>
          {folders.map(f => (
            <button
              key={f}
              onClick={() => handleSave(f)}
              style={{
                display: 'block', width: '100%', padding: '4px 8px',
                background: 'none', border: 'none', color: 'white',
                fontSize: '12px', textAlign: 'left', cursor: 'pointer',
                borderRadius: '4px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              {f}
            </button>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', margin: '4px 0', paddingTop: '4px' }}>
            <input
              placeholder="New folder..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleNewFolder(); }}
              style={{
                width: '100%', padding: '4px 8px', background: 'rgba(255,255,255,0.1)',
                border: 'none', borderRadius: '4px', color: 'white', fontSize: '11px',
                outline: 'none',
              }}
            />
          </div>
        </div>
      )}

      {/* Results display */}
      {(translation || definition || pronunciation) && (
        <div style={{
          position: 'absolute',
          top: showColors || showFolders ? '76px' : '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(30, 58, 95, 0.95)',
          borderRadius: '8px',
          padding: '8px 12px',
          color: 'white',
          fontSize: '12px',
          maxWidth: '250px',
          lineHeight: 1.4,
        }}>
          {pronunciation && <div style={{ opacity: 0.7, marginBottom: '2px' }}>🔊 {pronunciation}</div>}
          {translation && <div style={{ marginBottom: '2px' }}>🌐 {translation}</div>}
          {definition && <div style={{ opacity: 0.9 }}>📖 {definition}</div>}
        </div>
      )}
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  borderRadius: '6px',
  transition: 'background 150ms',
};
