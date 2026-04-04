import { saveSession, resetAllData } from './persistence';

export async function preDemoPrep(): Promise<void> {
  // 1. Trigger the WOW Moment state wipe
  await resetAllData();

  // 2. Programmatically setup environment logic mock loading /demo/demo-passage.md
  // In a fully integrated environment, this is where the passage text is parsed.
  
  // 3. Anchor session locally triggering useSessionRestore natively
  await saveSession({
    lastParagraphId: 'p-003',
    scrollY: 850
  });

  console.log('Distraction-Free Adaptive Reader: DEMO READY.');
  console.log('Safety Net Active. Paragraph set to p-003.');
}
