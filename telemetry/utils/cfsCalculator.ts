export interface CFSInputs {
  daleChallScore: number;
  targetWPM: number;
  observedWPM: number;
  regressionRate: number;
}

export function calculateCFS(inputs: CFSInputs): number {
  const { daleChallScore, targetWPM, observedWPM, regressionRate } = inputs;

  if (observedWPM <= 0) {
    return 0;
  }

  return (daleChallScore / 10) * (targetWPM / observedWPM) * (1 + regressionRate);
}
