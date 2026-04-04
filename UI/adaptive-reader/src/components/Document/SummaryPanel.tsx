import React, { useState } from 'react';
import type { UserDocument } from '@/store/documentStore';
import { useDocumentStore } from '@/store/documentStore';
import { ParagraphRangePicker } from './ParagraphRangePicker';

interface Props {
  doc: UserDocument | null;
}

export const SummaryPanel: React.FC<Props> = ({ doc }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const isSummarizing = useDocumentStore((s) => s.isSummarizing);
  const patchLocalDocument = useDocumentStore((s) => s.patchLocalDocument);

  if (!doc) {
    return (
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Load a saved document to summarize.</p>
    );
  }

  const summary = doc.summary;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
          📋 Summary
        </span>
        {summary && (
          <div className="flex gap-2">
            <button
              type="button"
              className="text-xs"
              style={{ color: 'var(--accent-blue)' }}
              onClick={() => {
                patchLocalDocument(doc.id, { summary: undefined });
                setExpanded(true);
              }}
            >
              Regenerate
            </button>
            <button
              type="button"
              className="text-xs"
              style={{ color: 'var(--accent-blue)' }}
              onClick={() => {
                setEditing(true);
                setEditText(summary);
              }}
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {isSummarizing && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 rounded" style={{ background: 'var(--bg-tertiary)', width: '90%' }} />
          <div className="h-3 rounded" style={{ background: 'var(--bg-tertiary)', width: '70%' }} />
          <div className="h-3 rounded" style={{ background: 'var(--bg-tertiary)', width: '80%' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Generating summary…</p>
        </div>
      )}

      {!summary && !isSummarizing && (
        <>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            No summary generated yet. Select a range and generate one.
          </p>
          <button
            type="button"
            className="w-full py-2 rounded-lg text-sm border"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide range ▲' : 'Select range & summarize ▼'}
          </button>
          {expanded && <ParagraphRangePicker doc={doc} />}
        </>
      )}

      {summary && !isSummarizing && (
        <>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
            Paragraphs {doc.summaryStartParagraph + 1}–
            {(doc.summaryEndParagraph < 0 ? doc.paragraphs.length - 1 : doc.summaryEndParagraph) + 1}
          </p>
          {editing ? (
            <>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={8}
                className="w-full rounded-lg p-2 text-sm"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
              />
              <button
                type="button"
                className="py-1.5 px-3 rounded-lg text-sm"
                style={{ background: 'var(--accent-blue)', color: 'var(--toolbar-on-accent)' }}
                onClick={() => {
                  patchLocalDocument(doc.id, { summary: editText });
                  setEditing(false);
                }}
              >
                Save
              </button>
            </>
          ) : (
            <div className="whitespace-pre-wrap text-sm" style={{ color: 'var(--text-primary)' }}>
              {summary}
            </div>
          )}
        </>
      )}
    </div>
  );
};
