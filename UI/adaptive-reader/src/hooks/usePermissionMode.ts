import { useEffect } from 'react';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useReadingModeStore } from '@/store/readingModeStore';

const DWELL_MS = 45_000;

/**
 * After 45s on the same paragraph in permission mode, opens the permission panel.
 */
export function usePermissionMode(): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let watchedId: string | null = null;

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
    };

    const schedule = (id: string | null) => {
      clearTimer();
      watchedId = id;
      if (!id) return;

      timer = setTimeout(() => {
        const current = useTelemetryStore.getState().activeParagraphId;
        const mode = useReadingModeStore.getState().mode;
        if (current === watchedId && mode === 'permission') {
          useReadingModeStore.getState().setPermissionPanel(watchedId, true);
        }
      }, DWELL_MS);
    };

    let lastId = useTelemetryStore.getState().activeParagraphId;
    schedule(lastId ?? null);

    const unsub = useTelemetryStore.subscribe((state) => {
      const id = state.activeParagraphId;
      if (id === lastId) return;
      lastId = id;
      useReadingModeStore.getState().setPermissionPanel(null, false);
      schedule(id ?? null);
    });

    return () => {
      unsub();
      clearTimer();
    };
  }, []);
}
