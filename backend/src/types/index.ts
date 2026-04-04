export interface Paragraph {
  id: string; // format p-001
  text: string;
  wordCount: number;
  daleChallScore: number;
}

export interface CFSEvent {
  paragraphId: string;
  cfs: number;
  observedWPM: number;
  regressionRate: number;
  daleChallScore: number;
}

export interface AdaptationEvent {
  paragraphId: string;
  wordIndex: number;
  originalWord: string;
  replacement: string;
  type: string;
}
