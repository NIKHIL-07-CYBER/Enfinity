// DONE: Task 3e — Selection panel (saved entries)
import React, { useState } from 'react';
import { TopNav } from '@/components/Layout/TopNav';
import { useSelectionStore, type SelectionEntry } from '@/store/selectionStore';
import { speakText } from '@/utils/pronunciationUtils';

function groupByFolder(entries: SelectionEntry[]): Record<string, SelectionEntry[]> {
  const groups: Record<string, SelectionEntry[]> = {};
  for (const entry of entries) {
    const folder = entry.folder || 'Unsorted';
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push(entry);
  }
  return groups;
}

function exportFolder(folderName: string, entries: SelectionEntry[]) {
  const content = `--- ${folderName} ---\n` +
    entries.map(e =>
      `${e.text}\n  [${e.type}] ${e.definition || ''}\n  Translation: ${e.translation || ''}\n  Pronunciation: ${e.pronunciation || ''}\n`
    ).join('\n');

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folderName.replace(/\s+/g, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export const SelectionPanel: React.FC = () => {
  const savedEntries = useSelectionStore(s => s.savedEntries);
  const deleteEntry = useSelectionStore(s => s.deleteEntry);
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);

  const grouped = groupByFolder(savedEntries);
  const folderNames = Object.keys(grouped);

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--bg-color)' }}>
      <TopNav />
      <main className="w-full max-w-[680px] mx-auto px-6 pt-32 pb-16">
        <div className="text-[11px] tracking-widest font-bold uppercase mb-4" style={{ color: 'var(--nav-text)' }}>
          SAVED SELECTIONS
        </div>
        <h1 className="text-[42px] font-bold mb-10" style={{ color: 'var(--text-color)' }}>
          Word Bank
        </h1>

        {savedEntries.length === 0 ? (
          <div className="text-center py-20">
            <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>🔖</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-color)' }}>No saved selections yet</h2>
            <p className="text-sm" style={{ color: 'var(--nav-text)' }}>
              Select text while reading and click the save button to add entries here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {folderNames.map(folder => (
              <div key={folder}>
                <div
                  className="flex items-center justify-between mb-3 cursor-pointer"
                  onClick={() => setExpandedFolder(expandedFolder === folder ? null : folder)}
                >
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>
                    📁 {folder} <span className="text-sm font-normal" style={{ color: 'var(--nav-text)' }}>({grouped[folder].length})</span>
                  </h2>
                  <button
                    onClick={(e) => { e.stopPropagation(); exportFolder(folder, grouped[folder]); }}
                    className="text-[10px] tracking-widest font-bold uppercase px-3 py-1 rounded border"
                    style={{ color: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }}
                  >
                    Export .txt
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {grouped[folder].map(entry => (
                    <div
                      key={entry.id}
                      className="p-4 rounded-xl border"
                      style={{ borderColor: 'var(--card-border)' }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-lg font-bold" style={{
                          color: 'var(--text-color)',
                          backgroundColor: entry.highlight || 'transparent',
                          borderRadius: entry.highlight ? '3px' : undefined,
                          padding: entry.highlight ? '0 4px' : undefined,
                        }}>
                          {entry.text}
                        </span>
                        <span className="text-[9px] tracking-widest font-bold uppercase px-2 py-0.5 rounded"
                          style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
                          {entry.type}
                        </span>
                      </div>

                      {entry.pronunciation && (
                        <div className="text-xs mb-1" style={{ color: 'var(--nav-text)' }}>🔊 {entry.pronunciation}</div>
                      )}
                      {entry.translation && (
                        <div className="text-sm mb-1" style={{ color: 'var(--text-color)', opacity: 0.8 }}>🌐 {entry.translation}</div>
                      )}
                      {entry.definition && (
                        <div className="text-sm mb-2" style={{ color: 'var(--text-color)', opacity: 0.8 }}>📖 {entry.definition}</div>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => speakText(entry.text)}
                          className="text-xs px-2 py-1 rounded"
                          style={{ color: 'var(--accent-blue)', background: 'var(--accent-blue-light)' }}
                        >
                          ▶ Play
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="text-xs px-2 py-1 rounded text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </button>
                        <span className="ml-auto text-[10px]" style={{ color: 'var(--nav-text)' }}>
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
