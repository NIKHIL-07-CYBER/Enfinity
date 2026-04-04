import React, { useState } from 'react';
import { TopNav } from '@/components/Layout/TopNav';
import { DropZone } from '@/components/Upload/DropZone';
import { RecentDocuments } from '@/components/Upload/RecentDocuments';

export const UploadPage: React.FC = () => {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="min-h-screen relative flex flex-col items-center pt-32 pb-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <TopNav />
      
      <main className="w-full flex-1 flex flex-col items-center">
        <h1 className="text-[54px] mb-4 text-center" style={{ fontFamily: '"Atkinson Hyperlegible", serif', fontWeight: 700, color: 'var(--text-color)' }}>
          Ingest
        </h1>
        <p className="text-center text-[17px] mb-12 max-w-[600px] px-4" style={{ color: 'var(--nav-text)', lineHeight: 1.6 }}>
          Provide the vessel for your next exploration. The system will adapt to your rhythm as you commit your words to the breathing canvas.
        </p>

        {fileName && (
          <div className="w-full text-center mb-6 text-sm font-bold text-green-600">
            Loaded: {fileName}
          </div>
        )}

        <DropZone onFileDrop={(file) => setFileName(file.name)} />
        
        <RecentDocuments />
      </main>

      <footer className="mt-auto pt-16 text-[11px] tracking-widest font-bold" style={{ color: 'var(--nav-text)' }}>
        END OF STREAM • THE LIVING MANUSCRIPT
      </footer>

      <div className="fixed bottom-6 right-8 flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        <span className="text-[11px] tracking-widest font-bold uppercase" style={{ color: 'var(--nav-text)' }}>SYNCHRONIZING...</span>
      </div>
    </div>
  );
};
