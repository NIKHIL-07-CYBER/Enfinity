// DONE: Task 3b — Text selection hook
import { useEffect } from 'react';
import { useSelectionStore } from '@/store/selectionStore';

export function useTextSelection(): void {
  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();

      if (!text || text.length < 2) {
        return;
      }

      const range = sel!.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Detect type
      let type: 'word' | 'phrase' | 'sentence' = 'phrase';
      if (!text.includes(' ')) {
        type = 'word';
      } else if (/[.?!]$/.test(text)) {
        type = 'sentence';
      }

      // Find paragraph
      let node: Node | null = range.startContainer;
      let paragraphId = '';
      while (node) {
        if (node instanceof HTMLElement) {
          const id = node.getAttribute('data-paragraph-id');
          if (id) {
            paragraphId = id;
            break;
          }
        }
        node = node.parentNode;
      }

      const store = useSelectionStore.getState();
      store.clearActionResults();
      store.setCurrentSelection(
        text,
        {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        paragraphId,
      );
      store.setToolbarVisible(true);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.selection-toolbar')) return;
      useSelectionStore.getState().setToolbarVisible(false);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
}
