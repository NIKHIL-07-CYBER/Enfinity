import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useDocumentStore } from '@/store/documentStore';

export function useDocumentPersistence(): void {
  const current = useDocumentStore((s) => s.currentDocument);
  const shown = useRef(false);

  useEffect(() => {
    if (!current?.lastReadParagraphId || shown.current) return;
    const t = window.setTimeout(() => {
      const el = document.querySelector(`[data-paragraph-id="${current.lastReadParagraphId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
      if (!shown.current) {
        shown.current = true;
        const idx =
          current.paragraphs.findIndex((p) => p.id === current.lastReadParagraphId) + 1;
        toast(
          (tid) => (
            <span>
              Resuming from paragraph {idx} of {current.paragraphs.length}
              {' '}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  toast.dismiss(tid.id);
                }}
              >
                Start from beginning
              </button>
            </span>
          ),
          { icon: '📖', duration: 5000 },
        );
      }
    }, 150);
    return () => clearTimeout(t);
  }, [current?.lastReadParagraphId, current?.paragraphs]);
}
