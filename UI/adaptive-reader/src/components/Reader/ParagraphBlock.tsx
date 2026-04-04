// DONE: Task 2b — Replace motion.div with plain div + CSS transitions for paragraph blocks
import React, { useMemo, useReducer, useEffect } from 'react';
import type { Paragraph, AdaptationEvent } from '@/types';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useShallow } from 'zustand/react/shallow';
import { adaptationBus } from '@/utils/adaptationBus';

export const ParagraphBlock = React.memo(({ paragraph }: { paragraph: Paragraph }) => {
  const { activeParagraphId } = useTelemetryStore(
    useShallow(s => ({
      activeParagraphId: s.activeParagraphId,
      latestCFS: s.latestCFS,
    }))
  );

  const isActive = activeParagraphId === paragraph.id;

  const isStruggling = useTelemetryStore((s) => {
    const peak = s.struggleLog[paragraph.id] ?? 0;
    const live =
      s.latestCFS?.paragraphId === paragraph.id && (s.latestCFS?.cfs ?? 0) > 1.5;
    return peak > 1.5 || live;
  });

  const isQuote = paragraph.text.startsWith('"');
  const minHeight = paragraph.wordCount * 2.91;

  const [adaptations, dispatch] = useReducer(
    (state: AdaptationEvent[], action: AdaptationEvent) => [...state, action],
    []
  );

  useEffect(() => {
    const handler = (event: AdaptationEvent) => {
      if (event.paragraphId === paragraph.id) {
        dispatch(event);
      }
    };
    adaptationBus.on("adaptation", handler);
    return () => {
      adaptationBus.off("adaptation", handler);
    };
  }, [paragraph.id]);

  const renderedWords = useMemo(() => {
    const tokens = paragraph.text.split(/(\s+)/);
    let wordCounter = 0;

    return tokens.map((chunk, index) => {
      if (chunk.trim() === "") return <span key={index}>{chunk}</span>;

      const currentIndex = wordCounter++;
      const match = chunk.match(/^([a-zA-Z0-9]+)([^a-zA-Z0-9]*)$/);
      const punctuation = match ? match[2] : "";

      const adaptation = adaptations.find(a => a.wordIndex === currentIndex);

      if (adaptation) {
        return (
          <React.Fragment key={`${currentIndex}-${adaptation.type}`}>
            <span
              style={{ borderBottom: "2px solid var(--accent-blue)", cursor: "pointer" }}
              title={`Original: ${adaptation.originalWord}`}
            >
              {adaptation.replacement}
              {adaptation.type === "cognate" && (
                <span style={{ fontSize: "10px", marginLeft: "1px" }}>🌐</span>
              )}
              {(adaptation.type === "definition" || adaptation.type === "synonym" || adaptation.type === "acronym") && (
                <span style={{ fontSize: "10px", marginLeft: "1px" }}>•</span>
              )}
            </span>
            {punctuation}
          </React.Fragment>
        );
      }

      return <span key={index}>{chunk}</span>;
    });
  }, [paragraph.text, adaptations]);

  return (
    <div
      data-paragraph-id={paragraph.id}
      style={{
        transition: 'opacity 250ms ease-out, background-color 250ms ease-out',
        opacity: isActive ? 1 : 0.42,
        backgroundColor: isActive ? 'var(--accent-blue-bg)' : (isQuote ? 'var(--accent-blue-light)' : 'transparent'),
        borderLeft: isStruggling
          ? `3px solid var(--accent-border-strong)`
          : (isActive ? `3px solid var(--accent-border-subtle)` : '3px solid transparent'),
        paddingLeft: '12px',
        willChange: 'opacity',
        minHeight: `${minHeight}px`,
      }}
      className={`mb-8 p-4 rounded paragraph-block ${isStruggling ? "paragraph-struggling" : ""} ${isQuote ? 'pl-6' : ''}`}
    >
      <p style={{
        fontWeight: "var(--font-weight)",
        lineHeight: "var(--line-height)",
        fontSize: "var(--font-size)",
        color: "var(--text-color)"
      }}>
        {renderedWords}
      </p>
    </div>
  );
});

ParagraphBlock.displayName = "ParagraphBlock";
