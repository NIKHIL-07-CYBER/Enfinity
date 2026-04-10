import React from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useTelemetryStore } from '@/store/telemetryStore';

const AVG_WPM = 200;

export const TimeRemaining: React.FC = () => {
  const paragraphs = useSessionStore(s => s.paragraphs);
  const activeParagraphId = useTelemetryStore(s => s.activeParagraphId);

  if (!paragraphs.length) return null;

  const currentIndex = paragraphs.findIndex(p => p.id === activeParagraphId);
  const remainingParagraphs = currentIndex >= 0
    ? paragraphs.slice(currentIndex + 1)
    : paragraphs;

  const remainingWords = remainingParagraphs.reduce((sum, p) => sum + p.wordCount, 0);
  const remainingMinutes = Math.ceil(remainingWords / AVG_WPM);

  if (remainingMinutes <= 0) return null;

  return (
    <span className="time-remaining-badge" title={`~${remainingWords} words left at ${AVG_WPM} WPM`}>
      ⏱ {remainingMinutes} min left
    </span>
  );
};
