// Feature 1: Contextual Concept Graph — Review Sheet overlay
import React, { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConceptGraphStore } from '@/store/conceptGraphStore';
import type { ConceptNode, ParagraphSummary } from '@/store/conceptGraphStore';

/* ════════════════════════════════════════════════════════════════════
   Mini SVG Concept Map — pure SVG force-simulation-free layout
   ════════════════════════════════════════════════════════════════════ */

const ConceptMap: React.FC<{ nodes: ConceptNode[]; paragraphCount: number }> = ({
  nodes,
  paragraphCount,
}) => {
  const displayNodes = nodes.slice(0, 8); // Limit for visual clarity
  const cx = 200;
  const cy = 140;
  const radius = 100;

  const positions = displayNodes.map((_, i) => {
    const angle = (i / displayNodes.length) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  return (
    <svg
      viewBox="0 0 400 280"
      className="w-full"
      style={{ maxHeight: '220px', opacity: 0.9 }}
    >
      {/* Center node */}
      <circle cx={cx} cy={cy} r={18} fill="var(--accent-blue)" opacity={0.2} />
      <circle cx={cx} cy={cy} r={12} fill="var(--accent-blue)" opacity={0.5} />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fill="var(--accent-blue)"
        fontSize="8"
        fontWeight="700"
      >
        {paragraphCount}P
      </text>

      {/* Edges */}
      {positions.map((pos, i) => (
        <line
          key={`edge-${i}`}
          x1={cx}
          y1={cy}
          x2={pos.x}
          y2={pos.y}
          stroke="var(--accent-blue)"
          strokeWidth={Math.max(0.5, displayNodes[i].cfsPeak * 0.4)}
          opacity={0.25}
          strokeDasharray={displayNodes[i].cfsPeak > 2 ? 'none' : '3 3'}
        />
      ))}

      {/* Term nodes */}
      {positions.map((pos, i) => {
        const node = displayNodes[i];
        const nodeRadius = 6 + Math.min(node.cfsPeak * 2, 10);
        const severity =
          node.cfsPeak > 2.5 ? '#ef4444' : node.cfsPeak > 1.8 ? '#f59e0b' : 'var(--accent-blue)';
        return (
          <g key={`node-${i}`}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={nodeRadius}
              fill={severity}
              opacity={0.15}
            />
            <circle
              cx={pos.x}
              cy={pos.y}
              r={nodeRadius * 0.6}
              fill={severity}
              opacity={0.4}
            />
            <text
              x={pos.x}
              y={pos.y + nodeRadius + 12}
              textAnchor="middle"
              fill="var(--text-primary)"
              fontSize="9"
              fontWeight="600"
              opacity={0.8}
            >
              {node.term.length > 12 ? node.term.slice(0, 10) + '…' : node.term}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ════════════════════════════════════════════════════════════════════
   Term Card (mini version for the review sheet)
   ════════════════════════════════════════════════════════════════════ */

const ReviewTermCard: React.FC<{
  node: ConceptNode;
  onMark: () => void;
}> = ({ node, onMark }) => {
  const severityColor =
    node.cfsPeak > 2.5
      ? { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.25)', label: 'HIGH' }
      : node.cfsPeak > 1.8
        ? { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', label: 'MEDIUM' }
        : { bg: 'rgba(24, 95, 165, 0.08)', border: 'rgba(24, 95, 165, 0.25)', label: 'LOW' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        padding: '14px 16px',
        borderRadius: '12px',
        border: `1px solid ${severityColor.border}`,
        background: severityColor.bg,
        cursor: 'pointer',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      }}
      onClick={onMark}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          style={{
            fontSize: '9px',
            letterSpacing: '1.5px',
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            color: 'var(--text-secondary)',
          }}
        >
          {severityColor.label} FRICTION
        </span>
        {node.reviewed && (
          <span style={{ fontSize: '12px', color: '#22c55e' }}>✓</span>
        )}
      </div>
      <div
        style={{
          fontSize: '17px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '4px',
        }}
      >
        {node.term}
      </div>
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-secondary)',
        }}
      >
        Appeared in {node.occurrenceCount} paragraph{node.occurrenceCount !== 1 ? 's' : ''} •
        CFS peak: {node.cfsPeak.toFixed(1)}
      </div>
    </motion.div>
  );
};

/* ════════════════════════════════════════════════════════════════════
   Struggle Hotspot
   ════════════════════════════════════════════════════════════════════ */

const HotspotCard: React.FC<{ summary: ParagraphSummary }> = ({ summary }) => {
  const highlighted = useMemo(() => {
    let text = summary.excerpt;
    summary.difficultTerms.forEach((term) => {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      text = text.replace(regex, `<mark style="background: rgba(245,158,11,0.25); border-radius:2px; padding:0 2px;">$1</mark>`);
    });
    return text;
  }, [summary]);

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        background: 'var(--accent-blue-bg)',
        marginBottom: '10px',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: summary.cfs > 2 ? '#ef4444' : '#f59e0b',
          }}
        />
        <span
          style={{
            fontSize: '9px',
            letterSpacing: '1.5px',
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            color: 'var(--text-secondary)',
          }}
        >
          CFS {summary.cfs.toFixed(1)}
        </span>
      </div>
      <p
        style={{
          fontSize: '14px',
          lineHeight: 1.6,
          color: 'var(--text-primary)',
          opacity: 0.85,
          margin: 0,
        }}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════
   Main ReviewSheet component
   ════════════════════════════════════════════════════════════════════ */

export const ReviewSheet: React.FC<{
  onContinueToReview: () => void;
  onDismiss: () => void;
}> = ({ onContinueToReview, onDismiss }) => {
  const visible = useConceptGraphStore((s) => s.reviewSheetVisible);
  const nodes = useConceptGraphStore((s) => s.nodes);
  const paragraphSummaries = useConceptGraphStore((s) => s.paragraphSummaries);
  const sessionStats = useConceptGraphStore((s) => s.sessionStats);
  const markReviewed = useConceptGraphStore((s) => s.markReviewed);
  const containerRef = useRef<HTMLDivElement>(null);

  // Trap Escape key
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9500,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onClick={onDismiss}
          />

          {/* Sheet */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9600,
              width: '90%',
              maxWidth: '640px',
              maxHeight: '85vh',
              overflowY: 'auto',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.25), 0 0 1px rgba(0,0,0,0.1)',
              padding: '32px',
            }}
          >
            {/* Header */}
            <div className="mb-6">
              <div
                style={{
                  fontSize: '10px',
                  letterSpacing: '2px',
                  fontWeight: 700,
                  textTransform: 'uppercase' as const,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                }}
              >
                CHAPTER REVIEW
              </div>
              <h2
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Session Insights
              </h2>
            </div>

            {/* Stats Row */}
            <div
              className="grid grid-cols-4 gap-3 mb-8"
              style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'var(--accent-blue-bg)',
                border: '1px solid var(--border-color)',
              }}
            >
              {[
                { label: 'Duration', value: `${sessionStats.duration}m` },
                { label: 'Words', value: sessionStats.wordsRead.toLocaleString() },
                { label: 'Avg CFS', value: sessionStats.avgCFS.toFixed(1) },
                { label: 'Paragraphs', value: String(sessionStats.paragraphsRead) },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: 'var(--accent-blue)',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: '9px',
                      letterSpacing: '1px',
                      fontWeight: 600,
                      textTransform: 'uppercase' as const,
                      color: 'var(--text-secondary)',
                      marginTop: '2px',
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Concept Map */}
            {nodes.length > 0 && (
              <div className="mb-8">
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase' as const,
                    color: 'var(--text-secondary)',
                    marginBottom: '12px',
                  }}
                >
                  CONCEPT MAP
                </h3>
                <div
                  style={{
                    borderRadius: '14px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    padding: '16px',
                    overflow: 'hidden',
                  }}
                >
                  <ConceptMap
                    nodes={nodes}
                    paragraphCount={sessionStats.paragraphsRead}
                  />
                </div>
              </div>
            )}

            {/* Struggled Terms Grid */}
            {nodes.length > 0 && (
              <div className="mb-8">
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase' as const,
                    color: 'var(--text-secondary)',
                    marginBottom: '12px',
                  }}
                >
                  TERMS TO REVIEW ({nodes.length})
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {nodes.slice(0, 8).map((node) => (
                    <ReviewTermCard
                      key={node.id}
                      node={node}
                      onMark={() => markReviewed(node.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Struggle Hotspots */}
            {paragraphSummaries.length > 0 && (
              <div className="mb-8">
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase' as const,
                    color: 'var(--text-secondary)',
                    marginBottom: '12px',
                  }}
                >
                  STRUGGLE HOTSPOTS ({paragraphSummaries.length})
                </h3>
                {paragraphSummaries.slice(0, 4).map((s) => (
                  <HotspotCard key={s.id} summary={s} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {nodes.length === 0 && paragraphSummaries.length === 0 && (
              <div
                className="text-center py-10"
                style={{ color: 'var(--text-secondary)' }}
              >
                <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.4 }}>
                  ✓
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                  Smooth reading session
                </div>
                <div style={{ fontSize: '13px', opacity: 0.7 }}>
                  No struggle points detected — great job!
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onDismiss}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-blue-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={onContinueToReview}
                style={{
                  flex: 2,
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'var(--accent-blue)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  transition: 'opacity 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.85';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Continue to Full Review →
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
