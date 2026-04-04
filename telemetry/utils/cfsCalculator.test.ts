import { test, expect } from 'vitest';
import { calculateCFS } from './cfsCalculator';

test('normal reading speed, easy text → CFS = 0.5', () => {
  const result = calculateCFS({
    daleChallScore: 5,
    targetWPM: 150,
    observedWPM: 150,
    regressionRate: 0,
  });
  expect(result).toBeCloseTo(0.5);
});

test('slow reading, high regression → CFS ≈ 2.08', () => {
  const result = calculateCFS({
    daleChallScore: 8,
    targetWPM: 150,
    observedWPM: 75,
    regressionRate: 0.3,
  });
  expect(result).toBeCloseTo(2.08);
});

test('maximum struggle scenario → CFS = 4.5', () => {
  const result = calculateCFS({
    daleChallScore: 10,
    targetWPM: 150,
    observedWPM: 50,
    regressionRate: 0.5,
  });
  expect(result).toBeCloseTo(4.5);
});
