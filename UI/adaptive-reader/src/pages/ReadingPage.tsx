import { useState } from 'react'
import {
  useParagraphDwell,
  useRegressionTracker,
  useHighlightHesitation,
  useTelemetryResume,
  TelemetryOverlay,
} from '@telemetry'
import type { Paragraph } from '../types'

// ---------------------------------------------------------------------------
// Sample paragraphs for demo — replace with real content loader later
// ---------------------------------------------------------------------------
const SAMPLE_PARAGRAPHS: Paragraph[] = [
  {
    id: 'para-1',
    wordCount: 82,
    daleChallScore: 4.2,
    text: 'Reading is one of the most fundamental skills a person can develop. It opens doors to knowledge, imagination, and personal growth. Whether you are reading a novel, a textbook, or an article online, the act of processing written words strengthens your cognitive abilities and expands your vocabulary. Good readers tend to perform better academically and professionally.',
  },
  {
    id: 'para-2',
    wordCount: 95,
    daleChallScore: 7.1,
    text: "Neuroplasticity refers to the brain's remarkable ability to reorganize itself by forming new neural connections throughout life. This phenomenon enables neurons in the brain to compensate for injury and disease and to adjust their activities in response to new situations or changes in their environment. Research in cognitive neuroscience has demonstrated that sustained intellectual engagement, including reading complex material, significantly enhances synaptic plasticity and hippocampal neurogenesis.",
  },
  {
    id: 'para-3',
    wordCount: 110,
    daleChallScore: 8.5,
    text: 'The epistemological implications of computational hermeneutics challenge traditional paradigms of textual interpretation. By leveraging algorithmic analysis of morphosyntactic structures and distributional semantics, researchers can identify latent thematic patterns that elude conventional close reading methodologies. This interdisciplinary convergence of philology, corpus linguistics, and machine learning has precipitated a fundamental reconceptualization of how we approach exegetical praxis. The ramifications extend beyond mere academic discourse, influencing pedagogical strategies for developing metacognitive reading comprehension frameworks in educational institutions.',
  },
  {
    id: 'para-4',
    wordCount: 70,
    daleChallScore: 3.8,
    text: 'Dogs are wonderful pets. They are loyal, friendly, and always happy to see you. Many families choose to adopt dogs because they make great companions. Taking care of a dog teaches children about responsibility. You need to feed them, walk them, and give them love every day. In return, dogs give you unconditional affection.',
  },
  {
    id: 'para-5',
    wordCount: 88,
    daleChallScore: 6.5,
    text: 'Climate change represents one of the most pressing challenges confronting modern civilization. The accelerating concentration of greenhouse gases in the atmosphere, primarily carbon dioxide and methane, has precipitated measurable increases in global mean surface temperatures. Scientists have documented the consequential effects including glacial retreat, rising sea levels, and intensification of extreme weather phenomena. Addressing this crisis requires coordinated international policy interventions and transformative approaches to energy production.',
  },
]

// ---------------------------------------------------------------------------
// ReadingPage component
// ---------------------------------------------------------------------------
export function ReadingPage() {
  const [paragraphs] = useState<Paragraph[]>(SAMPLE_PARAGRAPHS)

  // --- Telemetry hooks (order matters) ---
  useTelemetryResume()                                  // 1. restore session state
  const { regressionRate } = useRegressionTracker()     // 2. track scroll-up behavior
  useParagraphDwell(paragraphs)                         // 3. dwell-time tracking
  useHighlightHesitation()                              // 4. word-level hesitation

  return (
    <>
      <TelemetryOverlay />

      <div
        style={{
          maxWidth: 680,
          margin: '0 auto',
          padding: '48px 24px 120px',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 18,
          lineHeight: 1.85,
          color: '#1e293b',
          minHeight: '100vh',
        }}
      >
        {/* Header */}
        <header style={{ marginBottom: 48, textAlign: 'center' }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
            }}
          >
            Enfinity — Adaptive Reader
          </h1>
          <p
            style={{
              fontSize: 13,
              color: '#94a3b8',
              fontFamily: 'ui-monospace, monospace',
              margin: 0,
            }}
          >
            Ctrl+Shift+D to open telemetry overlay &middot; regression rate:{' '}
            {regressionRate.toFixed(2)}
          </p>
        </header>

        {/* Paragraphs */}
        {paragraphs.map((p) => (
          <p
            key={p.id}
            data-paragraph-id={p.id}
            style={{
              marginBottom: 32,
              padding: '16px 20px',
              borderRadius: 8,
              background: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'box-shadow 0.2s',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: 10,
                fontFamily: 'ui-monospace, monospace',
                color: '#94a3b8',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {p.id} &middot; {p.wordCount} words &middot; Dale-Chall{' '}
              {p.daleChallScore}
            </span>
            {p.text}
          </p>
        ))}
      </div>
    </>
  )
}
