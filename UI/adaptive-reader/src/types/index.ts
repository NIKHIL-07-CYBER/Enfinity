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
}

export interface AdaptationEvent {
  paragraphId: string;
  wordIndex: number;
  originalWord: string;
  replacement: string;
  type: 'definition' | 'synonym' | 'cognate' | 'acronym';
}