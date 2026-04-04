import React from 'react';
import { TopNav } from '@/components/Layout/TopNav';
import { SidebarNav } from '@/components/Layout/SidebarNav';
import { ReadingContainer } from '@/components/Reader/ReadingContainer';
import { Paragraph } from '@/types';
import { ChromeShell } from '@/components/Reader/ChromeShell';

export const ReadPage: React.FC = () => {
  const dummyParagraphs: Paragraph[] = [
    { id: 'p1', text: 'Silence is not merely the absence of sound, but an active, architectural force in human cognition. We build monuments of thought within these quiet spaces, where the mind stretches outward into the void, finding form in the formless.', wordCount: 42, daleChallScore: 4.2 },
    { id: 'p2', text: 'When the auditory cortex is deprived of its usual chaotic input, the brain does not power down. Instead, it reallocates resources. The default mode network—the structural basis for daydreams, reflection, and self-identity—lights up with unparalleled intensity.', wordCount: 38, daleChallScore: 6.1 },
    { id: 'p3', text: '"If we treat silence as an empty canvas, we drastically misunderstand the neurobiology of rest. The canvas itself is breathing, waiting for our engagement. We must recognize quietude as an active metabolic state." This radical perspective shifts how we design both our environments and our schedules.', wordCount: 46, daleChallScore: 5.8 },
    { id: 'p4', text: 'Consider the modern technological landscape, which continually encroaches upon these mental sanctuaries. Every notification and algorithmic nudge functions as an architectural perturbation, dismantling the delicate scaffolds of deep thought.', wordCount: 32, daleChallScore: 7.4 },
    { id: 'p5', text: 'Therefore, the cultivation of silence becomes a radical act of preservation. By deliberately constructing acoustic barriers, we protect the very mechanisms that allow for complex reasoning and sustained creativity.', wordCount: 30, daleChallScore: 6.9 }
  ];

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--bg-color)' }}>
      <ChromeShell>
        <TopNav />
      </ChromeShell>
      <SidebarNav activePage="reader" />
      
      <main className="pl-[160px] pb-32 pt-24">
        <ReadingContainer paragraphs={dummyParagraphs} />
      </main>

      <div className="fixed bottom-6 right-6 p-4 rounded shadow-xl flex flex-col w-[320px] pointer-events-auto z-50 transition-transform" style={{ backgroundColor: 'var(--toast-bg)', color: '#fff' }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] tracking-widest font-bold opacity-80" style={{ color: '#A3B8CC' }}>DEEP READ SUGGESTION</span>
          <button className="opacity-60 hover:opacity-100 transition-opacity">✕</button>
        </div>
        <p className="text-sm font-medium leading-relaxed">It seems you slowed down on the previous paragraph. Ready to review key concepts?</p>
      </div>

      <div className="fixed top-24 right-0 w-1 h-full pointer-events-none origin-top" style={{ backgroundColor: 'transparent' }}>
        <div className="w-1 h-[20%] absolute top-[30%]" style={{ backgroundColor: 'var(--accent-blue)' }} />
      </div>
    </div>
  );
};
