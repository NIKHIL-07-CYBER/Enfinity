// Concept Graph Page — editorial minimal design with animations
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '@/components/Layout/TopNav';
import { SidebarNav } from '@/components/Layout/SidebarNav';
import { ROUTES } from '@/constants/routes';
import { useConceptGraphStore } from '@/store/conceptGraphStore';
import type { ConceptNode, ParagraphSummary } from '@/store/conceptGraphStore';
import { useMemo } from 'react';

/* ═══════════════════════════════════════════════════════
   Motion Variants
   ═══════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

/* ═══════════════════════════════════════════════════════
   SVG Concept Map — animated, larger
   ═══════════════════════════════════════════════════════ */

const ConceptMapFull: React.FC<{ nodes: ConceptNode[]; paragraphCount: number }> = ({
  nodes,
  paragraphCount,
}) => {
  const displayNodes = nodes.slice(0, 12);
  const cx = 300;
  const cy = 220;
  const radius = 160;

  const positions = displayNodes.map((_, i) => {
    const angle = (i / displayNodes.length) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  return (
    <svg viewBox="0 0 600 440" className="w-full" style={{ maxHeight: '440px' }}>
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={radius + 10} fill="none" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 8" opacity={0.5} />

      {/* Center node — pulsing */}
      <circle cx={cx} cy={cy} r={32} fill="var(--accent-blue)" opacity={0.06}>
        <animate attributeName="r" values="30;34;30" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={20} fill="var(--accent-blue)" opacity={0.2} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="var(--accent-blue)" fontSize="11" fontWeight="700" fontFamily="var(--font-ui)">
        {paragraphCount}P
      </text>

      {/* Edges */}
      {positions.map((pos, i) => (
        <line
          key={`edge-${i}`}
          x1={cx} y1={cy}
          x2={pos.x} y2={pos.y}
          stroke="var(--accent-blue)"
          strokeWidth={Math.max(0.5, displayNodes[i].cfsPeak * 0.4)}
          opacity={0.12}
          strokeDasharray={displayNodes[i].cfsPeak > 2 ? 'none' : '3 5'}
        >
          <animate attributeName="opacity" values="0.08;0.18;0.08" dur={`${3 + i * 0.3}s`} repeatCount="indefinite" />
        </line>
      ))}

      {/* Term nodes */}
      {positions.map((pos, i) => {
        const node = displayNodes[i];
        const nodeRadius = 7 + Math.min(node.cfsPeak * 2.5, 12);
        const severity =
          node.cfsPeak > 2.5 ? '#ef4444' : node.cfsPeak > 1.8 ? '#f59e0b' : 'var(--accent-blue)';
        return (
          <g key={`node-${i}`}>
            <circle cx={pos.x} cy={pos.y} r={nodeRadius + 4} fill={severity} opacity={0.04}>
              <animate attributeName="r" values={`${nodeRadius + 2};${nodeRadius + 6};${nodeRadius + 2}`} dur={`${2.5 + i * 0.2}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={pos.x} cy={pos.y} r={nodeRadius} fill={severity} opacity={0.15} />
            <circle cx={pos.x} cy={pos.y} r={nodeRadius * 0.45} fill={severity} opacity={0.5} />
            <text x={pos.x} y={pos.y + nodeRadius + 14} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="600" fontFamily="var(--font-ui)" opacity={0.8}>
              {node.term.length > 14 ? node.term.slice(0, 12) + '…' : node.term}
            </text>
            <text x={pos.x} y={pos.y + nodeRadius + 26} textAnchor="middle" fill="var(--text-secondary)" fontSize="8" fontFamily="var(--font-ui)">
              CFS {node.cfsPeak.toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════
   Term Card — glassmorphic with severity indicator
   ═══════════════════════════════════════════════════════ */

const GraphTermCard: React.FC<{ node: ConceptNode; index: number; onMark: () => void }> = ({ node, index, onMark }) => {
  const severity =
    node.cfsPeak > 2.5
      ? { color: '#ef4444', label: 'HIGH', bg: 'rgba(239, 68, 68, 0.04)' }
      : node.cfsPeak > 1.8
        ? { color: '#f59e0b', label: 'MED', bg: 'rgba(245, 158, 11, 0.04)' }
        : { color: 'var(--accent-blue)', label: 'LOW', bg: 'var(--accent-blue-bg)' };

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      onClick={onMark}
      className="hover-lift"
      style={{
        padding: '16px 18px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-primary)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Severity dot */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: severity.color,
        }}
      />

      <span
        style={{
          fontSize: '8px',
          letterSpacing: '0.15em',
          fontWeight: 700,
          color: severity.color,
          textTransform: 'uppercase',
          fontFamily: 'var(--font-ui)',
        }}
      >
        {severity.label}
      </span>

      <div
        style={{
          fontSize: '17px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginTop: '6px',
          marginBottom: '4px',
          fontFamily: 'var(--font-reading)',
        }}
      >
        {node.term}
      </div>

      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        {node.occurrenceCount} paragraph{node.occurrenceCount !== 1 ? 's' : ''} · CFS {node.cfsPeak.toFixed(1)}
      </div>

      {node.reviewed && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '16px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#22c55e',
            color: '#fff',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✓
        </div>
      )}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════
   Hotspot Card — highlighted excerpt
   ═══════════════════════════════════════════════════════ */

const HotspotCard: React.FC<{ summary: ParagraphSummary; index: number }> = ({ summary, index }) => {
  const highlighted = useMemo(() => {
    let text = summary.excerpt;
    summary.difficultTerms.forEach((term) => {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      text = text.replace(regex, `<mark style="background: rgba(245,158,11,0.15); border-radius:3px; padding:1px 4px; font-weight:500;">$1</mark>`);
    });
    return text;
  }, [summary]);

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      style={{
        padding: '18px 20px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-primary)',
        marginBottom: '10px',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: summary.cfs > 2 ? '#ef4444' : '#f59e0b',
          }}
        />
        <span
          style={{
            fontSize: '9px',
            letterSpacing: '0.15em',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-ui)',
          }}
        >
          CFS {summary.cfs.toFixed(1)}
        </span>
      </div>
      <p
        style={{
          fontSize: '15px',
          lineHeight: 1.7,
          color: 'var(--text-primary)',
          opacity: 0.85,
          margin: 0,
          fontFamily: 'var(--font-reading)',
        }}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════
   Terms Section — 5 initially, expandable
   ═══════════════════════════════════════════════════════ */

const INITIAL_TERMS = 5;

const TermsSection: React.FC<{ nodes: ConceptNode[]; markReviewed: (id: string) => void }> = ({
  nodes,
  markReviewed,
}) => {
  const [expanded, setExpanded] = useState(false);
  const displayNodes = expanded ? nodes : nodes.slice(0, INITIAL_TERMS);
  const hasMore = nodes.length > INITIAL_TERMS;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mb-12"
    >
      <SectionHeader label={`TERMS TO REVIEW (${nodes.length})`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayNodes.map((node, i) => (
          <GraphTermCard key={node.id} node={node} index={i} onMark={() => markReviewed(node.id)} />
        ))}
      </div>
      {hasMore && (
        <ExpandButton onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : `Show ${nodes.length - INITIAL_TERMS} more`}
        </ExpandButton>
      )}
    </motion.section>
  );
};

/* ═══════════════════════════════════════════════════════
   Hotspots Section — 3 initially, expandable
   ═══════════════════════════════════════════════════════ */

const INITIAL_HOTSPOTS = 3;

const HotspotsSection: React.FC<{ summaries: ParagraphSummary[] }> = ({ summaries }) => {
  const [expanded, setExpanded] = useState(false);
  const displayItems = expanded ? summaries : summaries.slice(0, INITIAL_HOTSPOTS);
  const hasMore = summaries.length > INITIAL_HOTSPOTS;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="mb-12"
    >
      <SectionHeader label={`STRUGGLE HOTSPOTS (${summaries.length})`} />
      {displayItems.map((s, i) => (
        <HotspotCard key={s.id} summary={s} index={i} />
      ))}
      {hasMore && (
        <ExpandButton onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : `Show ${summaries.length - INITIAL_HOTSPOTS} more`}
        </ExpandButton>
      )}
    </motion.section>
  );
};

/* ═══════════════════════════════════════════════════════
   Shared sub-components
   ═══════════════════════════════════════════════════════ */

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <h2
    style={{
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)',
      marginBottom: '16px',
      fontFamily: 'var(--font-ui)',
    }}
  >
    {label}
  </h2>
);

const ExpandButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    type="button"
    onClick={onClick}
    style={{
      display: 'block',
      margin: '16px auto 0',
      padding: '10px 28px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-color)',
      background: 'transparent',
      color: 'var(--accent-blue)',
      fontSize: '12px',
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'var(--font-ui)',
      letterSpacing: '0.02em',
      transition: 'background 200ms ease, border-color 200ms ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'var(--accent-blue-bg)';
      e.currentTarget.style.borderColor = 'var(--accent-blue)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.borderColor = 'var(--border-color)';
    }}
  >
    {children}
  </motion.button>
);

/* ═══════════════════════════════════════════════════════
   Concept Graph Page
   ═══════════════════════════════════════════════════════ */

export const ConceptGraphPage: React.FC = () => {
  const navigate = useNavigate();
  const nodes = useConceptGraphStore((s) => s.nodes);
  const paragraphSummaries = useConceptGraphStore((s) => s.paragraphSummaries);
  const sessionStats = useConceptGraphStore((s) => s.sessionStats);
  const markReviewed = useConceptGraphStore((s) => s.markReviewed);
  const buildGraph = useConceptGraphStore((s) => s.buildGraph);

  useEffect(() => {
    if (nodes.length === 0) {
      buildGraph();
    }
  }, [nodes.length, buildGraph]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-color)' }}
    >
      <TopNav />
      <SidebarNav activePage="reader" />

      <main className="w-full max-w-[860px] mx-auto pb-24 pt-28 px-6 sm:pr-8 sm:pl-[180px] max-sm:pl-6">
        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '0.2em',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--accent-blue)',
              marginBottom: '10px',
              fontFamily: 'var(--font-ui)',
            }}
          >
            SESSION INSIGHTS
          </div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              fontFamily: 'var(--font-ui)',
            }}
          >
            Concept Graph
          </h1>
        </motion.div>

        {/* ── Stats Row ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="grid grid-cols-4 gap-3 mb-10"
        >
          {[
            { label: 'Duration', value: `${sessionStats.duration}m`, icon: '⏱' },
            { label: 'Words', value: sessionStats.wordsRead.toLocaleString(), icon: '📝' },
            { label: 'Avg CFS', value: sessionStats.avgCFS.toFixed(1), icon: '📊' },
            { label: 'Paragraphs', value: String(sessionStats.paragraphsRead), icon: '¶' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              style={{
                padding: '20px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                textAlign: 'center',
              }}
              className="hover-lift"
            >
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'var(--accent-blue)',
                  fontFamily: 'var(--font-ui)',
                  letterSpacing: '-0.02em',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.15em',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  marginTop: '6px',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Concept Map ────────────────────────────────────── */}
        {nodes.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-12"
          >
            <SectionHeader label="CONCEPT MAP" />
            <div
              style={{
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                padding: '20px',
                overflow: 'hidden',
              }}
            >
              <ConceptMapFull nodes={nodes} paragraphCount={sessionStats.paragraphsRead} />
            </div>
          </motion.section>
        )}

        {/* ── Terms ──────────────────────────────────────────── */}
        {nodes.length > 0 && (
          <TermsSection nodes={nodes} markReviewed={markReviewed} />
        )}

        {/* ── Hotspots ───────────────────────────────────────── */}
        {paragraphSummaries.length > 0 && (
          <HotspotsSection summaries={paragraphSummaries} />
        )}

        {/* ── Empty state ────────────────────────────────────── */}
        {nodes.length === 0 && paragraphSummaries.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center py-24"
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                fontSize: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 4px 16px rgba(34, 197, 94, 0.25)',
              }}
            >
              ✓
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', fontFamily: 'var(--font-ui)' }}>
              Smooth reading session
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)' }}>
              No struggle points detected — great job!
            </div>
          </motion.div>
        )}

        {/* ── Action buttons ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex gap-4 mt-10"
        >
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={() => navigate(ROUTES.read)}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
              transition: 'border-color 200ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            ← Back to Reading
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={() => navigate(ROUTES.review)}
            style={{
              flex: 2,
              padding: '14px',
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
            Continue to Full Review →
          </motion.button>
        </motion.div>
      </main>
    </motion.div>
  );
};
