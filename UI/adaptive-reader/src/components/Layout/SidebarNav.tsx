import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export const SidebarNav: React.FC<{ activePage: 'reader' | 'outline' | 'annotate' | 'settings' }> = ({ activePage }) => {
  const navItems = [
    { id: 'reader', label: 'READER', icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></> },
    { id: 'outline', label: 'OUTLINE', icon: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></> },
    { id: 'annotate', label: 'ANNOTATE', icon: <><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></> },
    { id: 'settings', label: 'SETTINGS', icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></> },
  ];

  return (
    <div 
      className="fixed left-0 top-0 h-full flex flex-col px-4 py-8 pt-24"
      style={{ backgroundColor: 'var(--sidebar-bg)', width: '160px', zIndex: 40 }}
    >
      <div className="mb-10 pl-2">
        <div className="text-[10px] tracking-widest font-bold mb-2 uppercase" style={{ color: 'var(--nav-text)' }}>CURRENT CHAPTER</div>
        <div className="font-bold text-lg leading-tight" style={{ color: 'var(--text-color)' }}>Biological<br/>Editorial</div>
      </div>

      <nav className="flex-1 flex flex-col space-y-6 mt-4">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <Link 
              key={item.id} 
              to={item.id === 'reader' ? ROUTES.read : '#'}
              className={`flex flex-col items-start px-2 py-2 w-full transition-colors`}
              style={{ color: isActive ? 'var(--accent-blue)' : 'var(--nav-text)' }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--accent-blue)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--nav-text)'; }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mb-2">
                {item.icon}
              </svg>
              <span className={`text-[11px] tracking-widest ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pl-2">
        <Link 
          to="#"
          className="flex flex-col items-start py-2 transition-colors"
          style={{ color: 'var(--nav-text)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-blue)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--nav-text)'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mb-2">
             <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="text-[11px] tracking-widest font-medium uppercase">HELP</span>
        </Link>
      </div>
    </div>
  );
};
