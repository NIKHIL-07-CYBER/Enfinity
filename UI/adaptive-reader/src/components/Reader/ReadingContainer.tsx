import React, { useRef, useEffect } from 'react';
import { ParagraphBlock } from './ParagraphBlock';
import { useSessionStore } from '@/store/sessionStore';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export const ReadingContainer: React.FC = () => {
  const paragraphs = useSessionStore(s => s.paragraphs);
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    const sentinel = document.getElementById("chapter-end-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        timerRef.current = window.setTimeout(() => {
          navigateRef.current(ROUTES.review);
        }, 2000);
      } else {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
    }, { threshold: 0.95 });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!paragraphs || paragraphs.length === 0) {
    return (
      <div className="w-full max-w-[680px] mx-auto px-12 py-32 text-center">
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-color)' }}>No document loaded</h2>
        <Link to={ROUTES.upload} className="underline" style={{ color: 'var(--accent-blue)' }}>Go to Ingest</Link>
      </div>
    );
  }

  const totalWords = paragraphs.reduce((sum, p) => sum + p.wordCount, 0);
  const readMins = Math.ceil(totalWords / 200);
  const title = paragraphs[0]?.text.split('\n')[0] || "Untitled";

  return (
    <div style={{ padding: '0 48px', maxWidth: '680px', margin: '0 auto' }}>
      <div className="mb-12 mt-12">
        <div style={{ color: 'var(--nav-text)' }} className="text-xs uppercase tracking-widest font-bold mb-4">
          CHAPTER 01 • {readMins} MIN READ • WORD COUNT: {totalWords.toLocaleString()}
        </div>
        <h1 style={{ fontWeight: 700, color: 'var(--text-color)' }} className="text-4xl leading-tight mb-16">
          {title}
        </h1>
      </div>
      
      <div className="flex flex-col">
        {paragraphs.map((p) => (
          <ParagraphBlock key={p.id} paragraph={p} /> 
        ))}
      </div>
      
      <div id="chapter-end-sentinel" style={{ height: "1px" }} />
    </div>
  );
};
