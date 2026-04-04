export interface Paragraph {
  id: string;
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
  type: "definition" | "synonym" | "cognate" | "acronym";
  confidence: number;
}

export interface SessionState {
  lastParagraphId: string;
  scrollY: number;
  appliedAdaptations: AdaptationEvent[];
  sessionStartTime: number;
}
