import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { TopNav } from '@/components/Layout/TopNav';
import { DropZone } from '@/components/Upload/DropZone';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import { useDocumentStore, type UserDocument } from '@/store/documentStore';
import { saveSession } from '@/utils/persistence';
import { useSessionStore } from '@/store/sessionStore';
import { syncParagraphsToNlp } from '@/utils/paragraphUtils';
import { SummaryPanel } from '@/components/Document/SummaryPanel';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const documents = useDocumentStore((s) => s.documents);
  const isLoading = useDocumentStore((s) => s.isLoading);
  const isUploading = useDocumentStore((s) => s.isUploading);
  const loadDocuments = useDocumentStore((s) => s.loadDocuments);
  const uploadDocument = useDocumentStore((s) => s.uploadDocument);
  const setCurrentDocument = useDocumentStore((s) => s.setCurrentDocument);
  const deleteDocument = useDocumentStore((s) => s.deleteDocument);
  const generateSummary = useDocumentStore((s) => s.generateSummary);

  const [title, setTitle] = useState('');
  const [paste, setPaste] = useState('');
  const [showPaste, setShowPaste] = useState(false);

  useEffect(() => {
    if (user?.id) void loadDocuments(user.id);
  }, [user?.id, loadDocuments]);

  const handleSaveToLibrary = async (file: File) => {
    if (!user) {
      toast.error('Sign in to save to your library');
      navigate(ROUTES.auth);
      return;
    }
    const doc = await uploadDocument(file, title || undefined, user.id);
    if (doc) {
      if (doc.id.startsWith('local-')) {
        // Supabase failed — saved locally only
        toast.success('Saved locally (cloud sync unavailable — run schema.sql to fix)', { duration: 5000 });
      } else {
        toast.success('Saved to library');
      }
      void generateSummary(doc.id, user.id);
    } else {
      toast.error('Could not parse or save document');
    }
  };

  const continueReading = (doc: UserDocument) => {
    setCurrentDocument(doc);
    const sessionStartTime = Date.now();
    useSessionStore.getState().setSessionStartTime(sessionStartTime);
    void saveSession({
      lastParagraphId: doc.lastReadParagraphId || doc.paragraphs[0]?.id || '',
      scrollY: doc.lastScrollY ?? 0,
      appliedAdaptations: [],
      sessionStartTime,
      paragraphs: doc.paragraphs,
    });
    navigate(ROUTES.read);
  };

  return (
    <div
      className="min-h-screen relative flex flex-col overflow-x-hidden"
      style={{ backgroundColor: 'var(--bg-color)' }}
    >
      <TopNav />

      <main className="w-full flex-1 flex flex-col items-center pt-24 pb-8 px-4 max-w-6xl mx-auto w-full">
        <h1
          className="text-4xl md:text-[54px] mb-4 text-center max-w-full px-4"
          style={{ fontFamily: '"Atkinson Hyperlegible", serif', fontWeight: 700, color: 'var(--text-color)' }}
        >
          Library
        </h1>
        <p
          className="text-center text-[17px] mb-10 max-w-[600px] px-6 sm:px-4"
          style={{ color: 'var(--nav-text)', lineHeight: 1.6 }}
        >
          Upload text, markdown, or PDF. Save to your account to sync across devices.
        </p>

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="w-full space-y-4">
            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full max-w-[680px] rounded-lg px-3 py-2 border text-sm mx-auto block"
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <DropZone onSaveToLibrary={user ? handleSaveToLibrary : undefined} />
            <button
              type="button"
              className="text-sm underline mx-auto block"
              style={{ color: 'var(--accent-blue)' }}
              onClick={() => setShowPaste(!showPaste)}
            >
              Or paste text
            </button>
            {showPaste && (
              <textarea
                className="w-full max-w-[680px] min-h-[120px] rounded-lg p-3 border text-sm mx-auto block"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                placeholder="Paste article text…"
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
              />
            )}
          </div>

          <div className="w-full rounded-xl border p-4" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                My library
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-blue-bg)', color: 'var(--accent-blue)' }}>
                {documents.length}
              </span>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-16 rounded-lg animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
                <div className="h-16 rounded-lg animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
              </div>
            ) : documents.length === 0 ? (
              <p className="text-sm min-h-[120px] flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                Your library is empty. Upload a document to get started.
              </p>
            ) : (
              <ul className="space-y-3">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="rounded-lg border p-3"
                    style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
                  >
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {doc.title}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {doc.wordCount} words · {doc.paragraphCount} paragraphs
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        className="text-xs px-2 py-1 rounded-md border"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--accent-blue)' }}
                        onClick={() => continueReading(doc)}
                      >
                        Continue reading
                      </button>
                      <button
                        type="button"
                        className="text-xs px-2 py-1 rounded-md border"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                        onClick={() => user && void generateSummary(doc.id, user.id)}
                      >
                        Summarize
                      </button>
                      {user && (
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded-md"
                          style={{ color: 'var(--text-tertiary)' }}
                          onClick={() => void deleteDocument(doc.id, user.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
                      <SummaryPanel doc={doc} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {isUploading && (
              <div className="flex items-center gap-2 mt-3">
                <span
                  className="inline-block w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--accent-blue)', borderTopColor: 'transparent' }}
                />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Saving to library…
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-auto pt-16 text-[11px] tracking-widest font-bold" style={{ color: 'var(--nav-text)' }}>
        END OF STREAM • THE LIVING MANUSCRIPT
      </footer>
    </div>
  );
};
