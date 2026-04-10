import React, { useRef, useEffect, useState } from 'react';
import { ParagraphBlock } from './ParagraphBlock';
import { useSessionStore } from '@/store/sessionStore';
import { useTelemetryStore } from '@/store/telemetryStore';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useConceptGraphStore } from '@/store/conceptGraphStore';
import { motion, AnimatePresence } from 'framer-motion';

export const ReadingContainer: React.FC = () => {
  const paragraphs = useSessionStore(s => s.paragraphs);
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  const buildGraph = useConceptGraphStore(s => s.buildGraph);
  const [chapterEnded, setChapterEnded] = useState(false);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    const sentinel = document.getElementById("chapter-end-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        buildGraph();
        setChapterEnded(true);
      }
    }, { threshold: 0.95 });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [buildGraph]);

  if (!paragraphs || paragraphs.length === 0) {
    return (
      <div className="w-full max-w-[800px] mx-auto px-4 sm:px-8 py-32 text-center">
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.15 }}>📖</div>
        <h2
          className="text-2xl font-bold mb-3"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}
        >
          No document loaded
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Upload a document from the library to start reading.
        </p>
        <Link
          to={ROUTES.upload}
          className="inline-block px-5 py-2.5 rounded-xl font-semibold text-sm no-underline transition-opacity"
          style={{
            background: 'var(--accent-blue)',
            color: '#fff',
            fontFamily: 'var(--font-ui)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          Go to Library
        </Link>
      </div>
    );
  }

  const totalWords = paragraphs.reduce((sum, p) => sum + p.wordCount, 0);
  const readMins = Math.ceil(totalWords / 200);
  const title = paragraphs[0]?.text.split('\n')[0] || "Untitled";

  const activeParagraphId = useTelemetryStore(s => s.activeParagraphId);
  const headingId = 'doc-heading-0';
  const isHeadingActive = activeParagraphId === headingId;

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 sm:px-8 reading-container" style={{ transition: 'filter 3s ease-in-out' }}>
      {/* ── Chapter heading ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        data-paragraph-id={headingId}
        style={{
          transition: 'opacity 300ms ease-out, background-color 300ms ease-out',
          opacity: isHeadingActive ? 1 : 0.6,
          backgroundColor: isHeadingActive ? 'var(--accent-blue-bg)' : 'transparent',
          borderLeft: isHeadingActive ? '3px solid var(--accent-border-subtle)' : '3px solid transparent',
          paddingLeft: '16px',
          marginBottom: '56px',
          marginTop: '56px',
          paddingTop: '12px',
          paddingBottom: '12px',
          borderRadius: '6px',
        }}
      >
        {/* Chapter meta bar */}
        <div className="flex items-center gap-3 mb-5" style={{ fontFamily: 'var(--font-ui)' }}>
          <span
            className="text-[10px] tracking-[0.15em] font-bold uppercase"
            style={{ color: 'var(--accent-blue)' }}
          >
            Chapter 01
          </span>
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-secondary)', opacity: 0.4 }} />
          <span className="text-[10px] tracking-[0.1em] font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
            {readMins} min read
          </span>
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-secondary)', opacity: 0.4 }} />
          <span className="text-[10px] tracking-[0.1em] font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
            {totalWords.toLocaleString()} words
          </span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-reading)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
          className="text-[2.5rem]"
        >
          {title}
        </h1>
      </motion.div>
      
      {/* ── Paragraphs ──────────────────────────────────────────────── */}
      <div className="flex flex-col">
        {paragraphs.map((p) => (
          <ParagraphBlock key={p.id} paragraph={p} /> 
        ))}
      </div>
      
      <div id="chapter-end-sentinel" style={{ height: "1px" }} />

      {/* ── Chapter Complete CTA ────────────────────────────────────── */}
      <AnimatePresence>
        {chapterEnded && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              marginTop: '64px',
              marginBottom: '48px',
              padding: '48px 40px',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              textAlign: 'center',
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-blue), #7c3aed)',
                color: '#fff',
                fontSize: '20px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.25)',
              }}
            >
              ✓
            </motion.div>

            <div
              style={{
                fontSize: '10px',
                letterSpacing: '0.18em',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--accent-blue)',
                marginBottom: '8px',
                fontFamily: 'var(--font-ui)',
              }}
            >
              CHAPTER COMPLETE
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '6px',
                fontFamily: 'var(--font-ui)',
                letterSpacing: '-0.02em',
              }}
            >
              Session Insights Ready
            </div>
            <div
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginBottom: '28px',
                lineHeight: 1.6,
                fontFamily: 'var(--font-ui)',
              }}
            >
              View your concept graph, struggled terms, and reading analytics.
            </div>

            <div className="flex gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => navigateRef.current(ROUTES.graph)}
                style={{
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--accent-blue), #4f46e5)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                  boxShadow: '0 2px 12px rgba(37, 99, 235, 0.3)',
                }}
              >
                View Concept Graph →
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => navigateRef.current(ROUTES.review)}
                style={{
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                Full Review
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
