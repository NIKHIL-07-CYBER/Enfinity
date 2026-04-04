import { AdaptationEvent } from '../types';

export function announceAdaptation(event: AdaptationEvent): void {
  let announcer = document.getElementById('adaptation-announcer') as HTMLDivElement | null;
  
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'adaptation-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.padding = '0';
    announcer.style.margin = '-1px';
    announcer.style.overflow = 'hidden';
    announcer.style.clip = 'rect(0, 0, 0, 0)';
    announcer.style.whiteSpace = 'nowrap';
    announcer.style.border = '0';
    document.body.appendChild(announcer);
  }

  // Ensure JSON error shapes or standard string shapes. In this case text.
  // Rule constraint output shape exactly like: "Word 'ubiquitous' simplified to 'everywhere'"
  const actionType = event.type === 'simplified' ? 'simplified' : 'adapted';
  announcer.textContent = `Word '${event.originalWord}' ${actionType} to '${event.replacement}'`;
}
