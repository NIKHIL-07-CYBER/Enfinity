// Telemetry hooks and components stubs for frontend build
import React from 'react';

/**
 * Stub: Track paragraph dwell time (how long user reads each paragraph)
 */
export function useParagraphDwell(paragraphs: unknown[]): void {
  // No-op stub
}

/**
 * Stub: Track regressions (backward eye movements)
 */
export function useRegressionTracker(): void {
  // No-op stub
}

/**
 * Stub: Highlight hesitation (pauses on difficult words)
 */
export function useHighlightHesitation(): void {
  // No-op stub
}

/**
 * Stub: Resume telemetry session
 */
export function useTelemetryResume(): void {
  // No-op stub
}

/**
 * Stub: Telemetry overlay component for debugging
 */
export const TelemetryOverlay: React.FC = () => {
  return null;
};
