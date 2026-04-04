// DONE: Task 8 — Dynamic brightness adapter hook
import { useEffect, useRef } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useSessionStore } from '@/store/sessionStore';

function getTimeFactor(): number {
  const hour = new Date().getHours();
  if (hour < 6) return 0.55;
  if (hour < 8) return 0.70;
  if (hour < 18) return 1.0;
  if (hour < 20) return 0.88;
  if (hour < 22) return 0.72;
  return 0.58;
}

function getSessionFactor(): number {
  const sessionStartTime = useSessionStore.getState().sessionStartTime;
  if (!sessionStartTime) return 1.0;
  const elapsedMin = (Date.now() - sessionStartTime) / 60000;
  if (elapsedMin < 10) return 1.0;
  if (elapsedMin < 30) return 0.95;
  if (elapsedMin < 60) return 0.88;
  return 0.82;
}

export function useDynamicBrightness(): void {
  const luxFactorRef = useRef(1.0);
  const intervalRef = useRef<number | null>(null);
  const sensorRef = useRef<any>(null);

  useEffect(() => {
    const { brightnessAdapterEnabled } = useSettingsStore.getState();
    if (!brightnessAdapterEnabled) {
      const container = document.querySelector('.reading-container') as HTMLElement;
      if (container) container.style.filter = 'brightness(1.0)';
      return;
    }

    // Try ambient light sensor
    if ('AmbientLightSensor' in window) {
      try {
        const sensor = new (window as any).AmbientLightSensor();
        sensor.addEventListener('reading', () => {
          const lux = sensor.illuminance;
          if (lux < 10) luxFactorRef.current = 0.6;
          else if (lux < 50) luxFactorRef.current = 0.75;
          else if (lux < 200) luxFactorRef.current = 0.88;
          else if (lux < 500) luxFactorRef.current = 1.0;
          else luxFactorRef.current = 1.1;
          applyBrightness();
        });
        sensor.start();
        sensorRef.current = sensor;
      } catch {
        // Sensor not available, use fallback
        useFallback();
      }
    } else {
      useFallback();
    }

    function useFallback() {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        luxFactorRef.current = 0.75;
      } else {
        luxFactorRef.current = 1.0;
      }
    }

    function applyBrightness() {
      if (!useSettingsStore.getState().brightnessAdapterEnabled) return;

      const timeFactor = getTimeFactor();
      const sessionFactor = getSessionFactor();
      const luxFactor = luxFactorRef.current;

      let brightness = (timeFactor * 0.4) + (sessionFactor * 0.3) + (luxFactor * 0.3);
      brightness = Math.max(0.5, Math.min(1.1, brightness));

      const container = document.querySelector('.reading-container') as HTMLElement;
      if (container) {
        container.style.filter = `brightness(${brightness.toFixed(3)})`;
      }

      // Update background color
      if (brightness < 0.65) {
        document.documentElement.style.setProperty('--bg-color', '#F5F0E4');
      } else if (brightness < 0.75) {
        document.documentElement.style.setProperty('--bg-color', '#FAF7F0');
      } else {
        document.documentElement.style.setProperty('--bg-color', '#FDFCF9');
      }

      // Update debug overlay data attribute
      document.documentElement.setAttribute('data-brightness',
        `${brightness.toFixed(2)} (time:${timeFactor.toFixed(2)} session:${sessionFactor.toFixed(2)} lux:${luxFactor.toFixed(2)})`
      );
    }

    // Initial apply
    applyBrightness();

    // Update every 60 seconds
    intervalRef.current = window.setInterval(applyBrightness, 60000);

    // Subscribe to store changes
    const unsub = useSettingsStore.subscribe((state) => {
      if (!state.brightnessAdapterEnabled) {
        const container = document.querySelector('.reading-container') as HTMLElement;
        if (container) container.style.filter = 'brightness(1.0)';
        document.documentElement.style.setProperty('--bg-color', '#FDFCF9');
      } else {
        applyBrightness();
      }
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (sensorRef.current) {
        try { sensorRef.current.stop(); } catch { /* empty */ }
      }
      unsub();
    };
  }, []);
}
