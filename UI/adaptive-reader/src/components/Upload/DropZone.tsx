import React, { useState, useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useSessionStore } from '@/store/sessionStore';
import { parseFile } from '@/utils/paragraphUtils';
import { Paragraph } from '@/types';

export const DropZone: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'parsing' | 'error' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      setStatus("error");
      setErrorMsg("Invalid file type. Please upload a .txt or .md file.");
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    setStatus("parsing");
    try {
      let paragraphs: Paragraph[] = [];
      if (typeof parseFile === 'function') {
        paragraphs = await parseFile(file);
      } else {
        // inline stub fallback
        const text = await file.text();
        paragraphs = text.split("\n\n").filter(Boolean).map((t, i) => ({
          id: `p-${String(i + 1).padStart(3, "0")}`,
          text: t.trim(),
          wordCount: t.split(" ").length,
          daleChallScore: 5,
        }));
      }
      useSessionStore.getState().setParagraphs(paragraphs);
      setStatus("success");
      
      // Navigate on next tick so UI can flash success if it wants
      setTimeout(() => {
        navigate(ROUTES.read);
      }, 300);
    } catch (e) {
      setStatus("error");
      setErrorMsg("Could not parse file. Try a plain .txt or .md file.");
    }
  }, [navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    maxSize: 12 * 1024 * 1024,
    multiple: false
  });

  return (
    <div className="w-full flex justify-center mb-16 px-4">
      <div 
        {...getRootProps()} 
        className={`w-full max-w-[680px] h-[240px] flex flex-col items-center justify-center rounded-2xl border-2 transition-colors cursor-pointer 
          ${status === 'error' ? 'border-red-500 bg-red-50/10' : 
            status === 'parsing' ? 'border-[var(--accent-blue)] border-solid bg-[var(--accent-blue-light)]' :
            status === 'success' ? 'border-green-500 border-solid bg-green-50/10' :
            isDragActive ? 'border-[var(--accent-blue)] border-dashed bg-[var(--accent-blue-light)]' : 
            'border-[var(--card-border)] border-dashed bg-transparent hover:border-[var(--accent-blue)]'}`}
        style={{
          backgroundColor: status === 'error' ? 'rgba(239, 68, 68, 0.05)' : status === 'success' ? 'rgba(34, 197, 94, 0.05)' : undefined
        }}
      >
        <input {...getInputProps()} />
        
        {status === 'parsing' ? (
          <div className="animate-spin w-10 h-10 mb-4 rounded-full border-4 border-solid border-[var(--accent-blue)] border-t-transparent"></div>
        ) : status === 'success' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 mb-4 text-green-500">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 mb-4" style={{ color: 'var(--nav-text)' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        )}
        
        <div className="text-lg font-medium mb-2" style={{ color: "var(--text-color)" }}>
          {status === 'parsing' ? 'Parsing...' : 
           status === 'success' ? 'Ready!' : 
           'Drop .txt or .md file here'}
        </div>
        
        <div className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "var(--nav-text)" }}>
          MAXIMUM SIZE 12MB
        </div>
        
        {status === 'error' && errorMsg && (
          <div className="mt-4 text-red-500 text-sm font-medium px-4 text-center">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};
