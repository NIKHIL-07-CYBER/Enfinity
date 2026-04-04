import React from 'react';

export const RecentDocuments: React.FC = () => {
  const docs = [
    { id: 1, title: 'The Architecture of Silence', updated: '2 HOURS AGO' },
    { id: 2, title: 'Phenomenology of Perception', updated: '1 DAY AGO' },
    { id: 3, title: 'Cognitive Load Draft 03', updated: '3 DAYS AGO' },
  ];

  return (
    <div className="w-full max-w-[680px] mx-auto px-4">
      <div className="text-[11px] tracking-widest font-bold uppercase mb-6" style={{ color: 'var(--nav-text)' }}>
        RECENT DOCUMENTS
      </div>
      <div className="flex flex-col space-y-2">
        {docs.map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors hover:bg-black/5">
            <div className="flex items-center space-x-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 opacity-60">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
              </svg>
              <span className="font-bold">{doc.title}</span>
            </div>
            <span className="text-[10px] tracking-widest font-bold" style={{ color: 'var(--nav-text)' }}>UPDATED {doc.updated}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
