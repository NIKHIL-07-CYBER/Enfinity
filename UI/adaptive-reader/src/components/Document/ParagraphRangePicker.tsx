import React from 'react';
import type { UserDocument } from '@/store/documentStore';
import { useDocumentStore } from '@/store/documentStore';
import { useAuthStore } from '@/store/authStore';

interface Props {
  doc: UserDocument;
}

export const ParagraphRangePicker: React.FC<Props> = ({ doc }) => {
  const user = useAuthStore((s) => s.user);
  const updateSummaryRange = useDocumentStore((s) => s.updateSummaryRange);
  const generateSummary = useDocumentStore((s) => s.generateSummary);
  const isSummarizing = useDocumentStore((s) => s.isSummarizing);

  const maxIdx = Math.max(0, doc.paragraphs.length - 1);
  const start = Math.min(doc.summaryStartParagraph, maxIdx);
  const end =
    doc.summaryEndParagraph < 0
      ? maxIdx
      : Math.min(Math.max(doc.summaryEndParagraph, start + 1), maxIdx);

  const preview = doc.paragraphs[start]?.text?.slice(0, 80) ?? '';
  const wordEstimate = doc.paragraphs
    .slice(start, end + 1)
    .map((p) => p.text)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div className="space-y-3 text-sm" style={{ color: 'var(--text-primary)' }}>
      <p style={{ color: 'var(--text-secondary)' }}>Summarize from paragraph:</p>
      <label className="block">
        <span style={{ color: 'var(--text-secondary)' }}>Start</span>
        <input
          type="range"
          min={0}
          max={maxIdx}
          value={start}
          onChange={(e) => {
            const v = Number(e.target.value);
            const nextEnd = Math.max(v + 1, end);
            void updateSummaryRange(doc.id, v, Math.min(nextEnd, maxIdx));
          }}
          className="w-full"
        />
        <span>Paragraph {start + 1}</span>
      </label>
      <label className="block">
        <span style={{ color: 'var(--text-secondary)' }}>End</span>
        <input
          type="range"
          min={start + 1}
          max={maxIdx}
          value={end}
          onChange={(e) => void updateSummaryRange(doc.id, start, Number(e.target.value))}
          className="w-full"
        />
        <span>Paragraph {end + 1}</span>
      </label>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
        ~{wordEstimate} words selected
      </p>
      <p
        style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
        }}
      >
        Preview: &quot;{preview}...&quot;
      </p>
      <button
        type="button"
        disabled={isSummarizing || !user}
        className="w-full py-2 rounded-lg font-medium text-sm"
        style={{ background: 'var(--accent-blue)', color: 'var(--toolbar-on-accent)' }}
        onClick={() => user && generateSummary(doc.id, user.id)}
      >
        {isSummarizing ? 'Generating…' : 'Generate summary'}
      </button>
    </div>
  );
};
