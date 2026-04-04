import React from 'react';
import { TopNav } from '@/components/Layout/TopNav';
import { SidebarNav } from '@/components/Layout/SidebarNav';
import { TermCard } from '@/components/Review/TermCard';
import { StrugglePoint } from '@/components/Review/StrugglePoint';

export const ReviewPage: React.FC = () => {
  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--bg-color)' }}>
      <TopNav />
      <SidebarNav activePage="reader" />
      
      <main className="pl-[160px] pb-16 pt-32 w-full max-w-[800px] mx-auto pr-8">
        <div className="text-[11px] tracking-widest font-bold uppercase mb-4" style={{ color: 'var(--nav-text)' }}>
          READING REVIEW
        </div>
        <h1 className="text-[42px] font-bold mb-6 text-gray-900">
          Deep Session Analysis
        </h1>
        
        <p className="text-[17px] mb-16" style={{ color: 'var(--text-color)', opacity: 0.8, lineHeight: 1.6 }}>
          Based on your reading velocity and regression patterns, we've identified several domains requiring further synthesis. The system has automatically isolated terms where your cognitive load temporarily spiked.
        </p>

        <section className="mb-16">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Terms to Review</h2>
          <div className="grid grid-cols-2 gap-4">
            <TermCard category="DEFINITION" term="Homeostasis" definition="The tendency toward a relatively stable equilibrium between interdependent elements, especially as maintained by physiological processes." />
            <TermCard category="NEUROBIOLOGY" term="Neuroplasticity" definition="The ability of the brain to form and reorganize synaptic connections, especially in response to learning or experience." />
            <TermCard category="PHILOSOPHY" term="Phenomenology" definition="The science of phenomena as distinct from that of the nature of being." />
            <TermCard category="LINGUISTICS" term="Semantics" definition="The branch of linguistics and logic concerned with meaning." />
          </div>
        </section>

        <section className="mb-16">
          <div className="flex justify-between items-center mb-8 border-b pb-4" style={{ borderColor: 'var(--card-border)' }}>
            <h2 className="text-xl font-bold text-gray-900">Struggle Points</h2>
            <div className="flex items-center space-x-2 bg-orange-100/50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-[10px] tracking-widest font-bold uppercase text-orange-700">RE-READ INTENSITY: HIGH</span>
            </div>
          </div>
          
          <StrugglePoint 
            quote="If we treat silence as an empty canvas, we drastically misunderstand the neurobiology of rest." 
            highlightedWord="misunderstand" 
            chapter="04" 
            page={12} 
          />
          <StrugglePoint 
            quote="Every notification and algorithmic nudge functions as an architectural perturbation, dismantling the delicate scaffolds of deep thought." 
            highlightedWord="perturbation" 
            chapter="04" 
            page={15} 
          />
          <StrugglePoint 
            quote="By deliberately constructing acoustic barriers, we protect the very mechanisms that allow for complex reasoning." 
            highlightedWord="mechanisms" 
            chapter="04" 
            page={18} 
          />
        </section>

        <div className="flex justify-center mb-16 px-4">
          <button className="w-full max-w-[320px] py-4 rounded-lg font-bold text-[13px] tracking-widest uppercase text-white transition-opacity hover:opacity-90 shadow-lg" style={{ backgroundColor: 'var(--toast-bg)' }}>
            ARCHIVE SESSION INSIGHTS
          </button>
        </div>

        <footer className="text-center text-[11px] tracking-widest font-bold uppercase" style={{ color: 'var(--nav-text)' }}>
          Session Duration: 42 Minutes • 3,429 Words Processed
        </footer>
      </main>
    </div>
  );
};
