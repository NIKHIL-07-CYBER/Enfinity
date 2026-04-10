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
// Ensure this utility is correctly imported and returns Promise<Paragraph[]>
import { parseFile } from '@/utils/paragraphUtils'; 
import { SummaryPanel } from '@/components/Document/SummaryPanel';
import { Paragraph } from '@/types'; // Import the shared interface

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
    
    // uploadDocument must return UserDocument or null, not void [cite: 13, 14]
    const doc = await uploadDocument(file, title || undefined, user.id);
    
    if (doc) {
      if (doc.id.startsWith('local-')) {
        toast.success('Saved locally (cloud sync unavailable)', { duration: 5000 });
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
    
    // Verification: Ensure paragraphs exist before accessing ID 
    const firstParaId = doc.paragraphs && doc.paragraphs.length > 0 
      ? doc.paragraphs.id 
      : '';

    void saveSession({
      lastParagraphId: doc.lastReadParagraphId || firstParaId,
      scrollY: doc.lastScrollY ?? 0,
      appliedAdaptations: [],
      sessionStartTime,
      paragraphs: doc.paragraphs || [],
    });
    navigate(ROUTES.read);
  };

  // Helper to handle text parsing for the "Paste" feature
  const handleStartReading = async () => {
    const text = paste.trim();
    if (!text) return;

    try {
      // Create a mock File object to reuse your existing parseFile logic 
      const mockFile = new File([text], "pasted-text.txt", { type: "text/plain" });
      const paragraphs: Paragraph[] = await parseFile(mockFile);

      if (!paragraphs || paragraphs.length === 0) {
        toast.error("Could not parse text into paragraphs");
        return;
      }

      const tempDoc: UserDocument = {
        id: `temp-${Date.now()}`,
        title: title || text.slice(0, 30) + "...",
        content: text,
        userId: user?.id || 'anonymous',
        createdAt: new Date().toISOString(),
        wordCount: text.split(/\s+/).length,
        paragraphCount: paragraphs.length,
        paragraphs: paragraphs
      };

      setCurrentDocument(tempDoc);
      const sessionStartTime = Date.now();
      useSessionStore.getState().setSessionStartTime(sessionStartTime);
      
      void saveSession({
        lastParagraphId: paragraphs.id,
        scrollY: 0,
        appliedAdaptations: [],
        sessionStartTime,
        paragraphs: paragraphs,
      });
      
      navigate(ROUTES.read);
    } catch (error) {
      toast.error("Error processing text");
      console.error(error);
    }
  };

  return (
    <div
      className="min-h-screen relative flex flex-col overflow-x-hidden"
      style={{ backgroundColor: 'var(--bg-color)' }}
    >
      <TopNav />

      <main className="w-full flex-1 flex flex-col items-center pt-24 pb-8 px-4 max-w-6xl mx-auto">
        <h1
          className="text-4xl md:text-[54px] mb-4 text-center max-w-full px-4"
          style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}
        >
          Library
        </h1>
        <p
          className="text-center text-[17px] mb-10 max-w-[600px] px-6 sm:px-4"
          style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', lineHeight: 1.6 }}
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
              <div className="w-full max-w-[680px] space-y-3 mx-auto">
                <textarea
                  className="w-full min-h-[160px] rounded-lg p-3 border text-sm block"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="Paste article text here..."
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                />
                <button
                  type="button"
                  disabled={!paste.trim()}
                  className="w-full py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all"
                  style={{
                    backgroundColor: paste.trim() ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                    color: paste.trim() ? 'white' : 'var(--text-tertiary)',
                    cursor: paste.trim() ? 'pointer' : 'not-allowed',
                    opacity: paste.trim() ? 1 : 0.6
                  }}
                  onClick={handleStartReading}
                >
                  Start Reading
                </button>
              </div>
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
              <div className="text-sm min-h-[160px] flex flex-col items-center justify-center gap-4 text-center p-6 border-2 border-dashed rounded-xl" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
                <p>Your library is empty. Upload a document or try our sample article.</p>
              </div>
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
                    </div>
                    <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
                      <SummaryPanel doc={doc} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-auto pt-16 text-[11px] tracking-widest font-bold text-center" style={{ color: 'var(--nav-text)' }}>
        END OF STREAM • THE LIVING MANUSCRIPT
      </footer>
    </div>
  );
};