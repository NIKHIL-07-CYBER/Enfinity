import { describe, it, expect } from 'vitest';
import { parseFile as parseMarkdownToParagraphs } from '@backend/utils/paragraphUtils';
import { adaptationBus } from '@nlp/utils/adaptationBus';
import { adaptationBus as uiBus } from '@/utils/adaptationBus';

describe('integration smoke (Hour 14)', () => {
  it('uses real Dale–Chall scoring on dense text (not a flat stub)', async () => {
    const dense =
      'The heterogeneous amalgamation of jurisprudential precedents substantiates the epistemological framework.';
    const paras = await parseMarkdownToParagraphs(dense);
    expect(paras.length).toBeGreaterThan(0);
    expect(paras[0].daleChallScore).toBeGreaterThan(5);
    expect(paras[0].wordCount).toBeGreaterThan(3);
  });

  it('exposes a single adaptationBus instance across UI and NLP entrypoints', () => {
    expect(uiBus).toBe(adaptationBus);
  });
});
