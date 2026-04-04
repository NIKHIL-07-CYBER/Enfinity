import { useState, useEffect } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import { useConceptStore } from '../store/conceptStore';
import { adaptationBus } from '../../nlp/src/utils/adaptationBus';
import { saveTelemetryEvent, saveConceptTerms } from '../../backend/src/utils/persistence';

export function TelemetryOverlay() {
  const [visible, setVisible] = useState(false);

  const { latestCFS, activeParagraphId } = useTelemetryStore();
  const concepts = useConceptStore();

  // --- Toggle with Ctrl+Shift+D ---
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setVisible((v: boolean) => !v);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!visible) return null;

  /** Injects CFS 2.0 on the current (or first visible) paragraph — persists like a real exit event. */
  function simulateStruggle() {
    const paragraphId =
      useTelemetryStore.getState().activeParagraphId ||
      document.querySelector('[data-paragraph-id]')?.getAttribute('data-paragraph-id');

    if (!paragraphId) {
      console.warn('[TELEMETRY] Simulate Struggle: no paragraph in view — load a document first.');
      return;
    }

    const daleChallScore =
      useTelemetryStore.getState().latestCFS?.daleChallScore ?? 8;

    const event = {
      paragraphId,
      cfs: 2.0,
      observedWPM: 55,
      regressionRate: 0.4,
      daleChallScore,
    };

    useTelemetryStore.getState().updateCFS(event);
    void saveTelemetryEvent(event);

    useConceptStore.getState().addStruggledParagraph(paragraphId);
    void saveConceptTerms(useConceptStore.getState().struggledTerms);

    adaptationBus.emit('triggerAdaptation', { paragraphId, cfs: 2.0 });
  }

  // --- Derived display values ---
  const cfsValue = latestCFS?.cfs.toFixed(2) ?? '—';
  const cfsColor =
    latestCFS && latestCFS.cfs > 1.5 ? '#f87171' : '#4ade80';
  const wpmValue = latestCFS?.observedWPM.toFixed(0) ?? '—';
  const regressionValue = latestCFS?.regressionRate.toFixed(2) ?? '—';
  const daleChallValue = latestCFS?.daleChallScore.toFixed(1) ?? '—';
  const struggledParas =
    concepts.struggledParagraphs.join(', ') || 'none';
  const struggledTerms =
    concepts.struggledTerms.slice(0, 5).join(', ') || 'none';

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#f1f5f9',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 12,
        lineHeight: 1.7,
        padding: '14px 16px',
        borderRadius: 10,
        width: 270,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Header */}
      <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>
        📡 TELEMETRY
      </div>

      {/* Metrics */}
      <div>
        <span style={{ opacity: 0.6 }}>Active para: </span>
        {activeParagraphId ?? '—'}
      </div>
      <div>
        <span style={{ opacity: 0.6 }}>CFS: </span>
        <span style={{ color: latestCFS ? cfsColor : undefined }}>
          {cfsValue}
        </span>
      </div>
      <div>
        <span style={{ opacity: 0.6 }}>WPM: </span>
        {wpmValue}
      </div>
      <div>
        <span style={{ opacity: 0.6 }}>Regression: </span>
        {regressionValue}
      </div>
      <div>
        <span style={{ opacity: 0.6 }}>Dale-Chall: </span>
        {daleChallValue}
      </div>
      <div>
        <span style={{ opacity: 0.6 }}>Struggled paras: </span>
        {struggledParas}
      </div>
      <div>
        <span style={{ opacity: 0.6 }}>Struggled terms: </span>
        {struggledTerms}
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.15)',
          margin: '10px 0',
        }}
      />

      {/* Simulate button */}
      <button
        onClick={simulateStruggle}
        style={{
          background: '#f97316',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          padding: '5px 10px',
          width: '100%',
          cursor: 'pointer',
          fontSize: 11,
        }}
      >
        Simulate Struggle (CFS 2.0)
      </button>
    </div>
  );
}
