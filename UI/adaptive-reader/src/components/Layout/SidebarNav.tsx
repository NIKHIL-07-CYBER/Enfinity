// Sidebar — refined editorial with hover states and subtle transitions
import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useSettingsStore } from '@/store/settingsStore';

export const SidebarNav: React.FC<{ activePage: 'reader' | 'outline' | 'annotate' | 'settings' }> = ({ activePage }) => {
  const adaptationEnabled = useSettingsStore(s => s.adaptationEnabled);
  const toggleAdaptation = useSettingsStore(s => s.toggleAdaptation);

  const navItems = [
    { id: 'reader', label: 'READER', route: ROUTES.read, icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></> },
    { id: 'outline', label: 'SAVED', route: ROUTES.saved, icon: <><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></> },
    { id: 'annotate', label: 'REVIEW', route: ROUTES.review, icon: <><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></> },
    { id: 'settings', label: 'SETTINGS', route: ROUTES.settings, icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></> },
  ];

  return (
    <div 
      className="chrome-shell fixed left-0 top-0 h-full flex flex-col px-3 py-6 pt-20 max-sm:hidden"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        width: '160px',
        zIndex: 40,
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* Chapter info */}
      <div className="mb-8 px-2">
        <div
          className="text-[9px] tracking-[0.15em] font-semibold mb-2 uppercase"
          style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)' }}
        >
          CURRENT CHAPTER
        </div>
        <div
          className="font-bold text-base leading-tight"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}
        >
          Biological<br/>Editorial
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 mt-2">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <Link 
              key={item.id} 
              to={item.route}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all"
              style={{
                color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-blue-bg)' : 'transparent',
                fontFamily: 'var(--font-ui)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--accent-blue-bg)';
                  e.currentTarget.style.color = 'var(--accent-blue)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                {item.icon}
              </svg>
              <span className={`text-[10px] tracking-[0.12em] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Adaptation toggle */}
      <div className="mb-2 px-1">
        <button
          onClick={toggleAdaptation}
          title={adaptationEnabled ? 'Auto-adapt: ON' : 'Auto-adapt: OFF'}
          className="flex items-center gap-3 py-2.5 px-3 transition-all w-full rounded-xl"
          style={{
            color: adaptationEnabled ? 'var(--accent-blue)' : 'var(--text-secondary)',
            background: adaptationEnabled ? 'var(--accent-blue-bg)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
          }}
        >
          <span style={{
            fontSize: '13px',
            textDecoration: adaptationEnabled ? 'none' : 'line-through',
            fontWeight: 600,
          }}>Aa→</span>
          <span className="text-[10px] tracking-[0.12em] font-medium">
            {adaptationEnabled ? 'ADAPT' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Archive link */}
      <div className="mt-auto px-1">
        <Link 
          to={ROUTES.archive}
          className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all"
          style={{ color: 'var(--nav-text)', fontFamily: 'var(--font-ui)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent-blue)';
            e.currentTarget.style.background = 'var(--accent-blue-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--nav-text)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <path d="M21 8v13H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" />
          </svg>
          <span className="text-[10px] tracking-[0.12em] font-medium uppercase">ARCHIVE</span>
        </Link>
      </div>
    </div>
  );
};
