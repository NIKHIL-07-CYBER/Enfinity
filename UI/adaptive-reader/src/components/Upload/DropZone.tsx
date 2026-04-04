import React, { useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';

export const DropZone: React.FC<{ onFileDrop: (file: File) => void }> = ({ onFileDrop }) => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setError(null);
    if (fileRejections.length > 0) {
      setError('Invalid file type. Please upload a .txt or .md file.');
      return;
    }
    
    if (acceptedFiles.length > 0) {
      setIsProcessing(true);
      // Simulate processing
      setTimeout(() => {
        setIsProcessing(false);
        onFileDrop(acceptedFiles[0]);
      }, 1000);
    }
  };

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
        className={`w-full max-w-[680px] h-[240px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${isDragActive ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-light)]' : 'border-[var(--card-border)] bg-transparent hover:border-[var(--accent-blue)]'}`}
      >
        <input {...getInputProps()} />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 mb-4" style={{ color: 'var(--nav-text)' }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <div className="text-lg font-medium mb-2" style={{ color: 'var(--text-color)' }}>
          {isProcessing ? 'Parsing...' : 'Drop .txt or .md file here'}
        </div>
        <div className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'var(--nav-text)' }}>
          MAXIMUM SIZE 12MB
        </div>
        {error && <div className="mt-4 text-red-500 text-sm font-medium px-4 text-center">{error}</div>}
      </div>
    </div>
  );
};
