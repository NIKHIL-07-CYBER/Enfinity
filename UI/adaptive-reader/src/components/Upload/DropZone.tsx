import React, { useState, useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useSessionStore } from '@/store/sessionStore';
import { parseFile, syncParagraphsToNlp } from '@/utils/paragraphUtils';
import { saveSession } from '@/utils/persistence';
import type { Paragraph } from '@/types';

interface DropZoneProps {
  onSaveToLibrary?: (file: File) => void | Promise<void>;
}

export const DropZone: React.FC<DropZoneProps> = ({ onSaveToLibrary }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'parsing' | 'error' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsed, setParsed] = useState<{ paragraphs: Paragraph[]; file: File } | null>(null);

  const runStartReading = useCallback(
    async (paragraphs: Paragraph[]) => {
      const sessionStartTime = Date.now();
      useSessionStore.getState().setSessionStartTime(sessionStartTime);
      useSessionStore.getState().setParagraphs(paragraphs);
      syncParagraphsToNlp(paragraphs);
      await saveSession({
        lastParagraphId: paragraphs[0]?.id ?? '',
        scrollY: 0,
        appliedAdaptations: [],
        sessionStartTime,
        paragraphs,
      });
      setTimeout(() => {
        navigate(ROUTES.read);
      }, 200);
    },
    [navigate],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        setStatus('error');
        setErrorMsg('Invalid file type. Use .txt, .md, or .pdf.');
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      setStatus('parsing');
      try {
        const paragraphs = await parseFile(file);
        setParsed({ paragraphs, file });
        setStatus('success');
        if (onSaveToLibrary) {
          return;
        }
        await runStartReading(paragraphs);
      } catch (err: unknown) {
        setStatus('error');
        const msg = err instanceof Error ? err.message : 'Could not parse file.';
        setErrorMsg(msg);
      }
    },
    [onSaveToLibrary, runStartReading],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 12 * 1024 * 1024,
    multiple: false,
  });

  const wordCount = parsed ? parsed.paragraphs.reduce((a, p) => a + p.wordCount, 0) : 0;

  return (
    <div className="w-full flex justify-center mb-8 px-4">
      <div className="w-full max-w-[680px] space-y-4">
        <div
          {...getRootProps()}
          className={`w-full h-[240px] flex flex-col items-center justify-center rounded-2xl border-2 transition-colors cursor-pointer 
          ${
            status === 'error'
              ? 'border-red-500 bg-red-50/10'
              : status === 'parsing'
                ? 'border-[var(--accent-blue)] border-solid bg-[var(--accent-blue-light)]'
                : status === 'success'
                  ? 'border-[var(--accent-blue)] border-solid bg-[var(--accent-blue-light)]'
                  : isDragActive
                    ? 'border-[var(--accent-blue)] border-dashed bg-[var(--accent-blue-light)]'
                    : 'border-[var(--card-border)] border-dashed bg-transparent hover:border-[var(--accent-blue)]'
          }`}
          style={{
            backgroundColor:
              status === 'error'
                ? 'color-mix(in srgb, red 6%, transparent)'
                : status === 'success'
                  ? 'color-mix(in srgb, var(--accent-blue) 6%, transparent)'
                  : undefined,
          }}
        >
          <input {...getInputProps()} />

          {status === 'parsing' ? (
            <div className="animate-spin w-10 h-10 mb-4 rounded-full border-4 border-solid border-[var(--accent-blue)] border-t-transparent" />
          ) : status === 'success' ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-10 h-10 mb-4"
              style={{ color: 'var(--accent-blue)' }}
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-10 h-10 mb-4"
              style={{ color: 'var(--nav-text)' }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          )}

          <div className="text-lg font-medium mb-2" style={{ color: 'var(--text-color)' }}>
            {status === 'parsing'
              ? 'Parsing…'
              : status === 'success'
                ? 'Document ready'
                : 'Drop .txt, .md, or .pdf'}
          </div>

          <div className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'var(--nav-text)' }}>
            MAXIMUM SIZE 12MB
          </div>

          {status === 'error' && errorMsg && (
            <div className="mt-4 text-red-500 text-sm font-medium px-4 text-center">{errorMsg}</div>
          )}
        </div>

        {status === 'success' && parsed && onSaveToLibrary && (
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {wordCount.toLocaleString()} words · {parsed.paragraphs.length} paragraphs
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--accent-blue)', color: 'var(--toolbar-on-accent)' }}
                onClick={() => void runStartReading(parsed.paragraphs)}
              >
                Start reading
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-sm border"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                onClick={async () => {
                  await onSaveToLibrary(parsed.file);
                  setStatus('idle');
                  setParsed(null);
                }}
              >
                Save to library
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
