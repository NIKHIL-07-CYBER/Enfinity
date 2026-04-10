// Navbar — frosted glass, editorial typography, refined hierarchy
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import { useScrollVelocity } from '@/hooks/useScrollVelocity';
import { useUIStore } from '@/store/uiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ModeSelector } from '@/components/Reader/ModeSelector';
import { useAuthStore } from '@/store/authStore';
import { useDocumentStore } from '@/store/documentStore';
import { TimeRemaining } from '@/components/Reader/TimeRemaining';
import { OfflineBadge } from '@/components/Reader/OfflineBadge';

const NAV_LINKS: { to: string; label: string }[] = [
  { to: ROUTES.upload, label: 'Library' },
  { to: ROUTES.archive, label: 'Archive' },
  { to: ROUTES.saved, label: 'Saved' },
];

export const TopNav: React.FC = () => {
  const { direction } = useScrollVelocity();
  const hidden = direction === 'down';
  const navigate = useNavigate();
  const location = useLocation();
  const chromeOpacity = useUIStore((s) => s.chromeOpacity);
  const burstActive = useUIStore((s) => s.burstActive);
  const setSummaryDrawerOpen = useUIStore((s) => s.setSummaryDrawerOpen);
  const eyeStrainVisible = useUIStore((s) => s.eyeStrainVisible);
  const toggleEyeStrain = useUIStore((s) => s.toggleEyeStrain);
  const adaptationEnabled = useSettingsStore((s) => s.adaptationEnabled);
  const toggleAdaptation = useSettingsStore((s) => s.toggleAdaptation);

  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const currentDocument = useDocumentStore((s) => s.currentDocument);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const initials =
    user?.email
      ?.split('@')[0]
      .slice(0, 2)
      .toUpperCase() ?? '?';

  const showSummary = location.pathname === ROUTES.read && !!currentDocument?.id;

  return (
    <motion.nav
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: hidden ? -72 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`chrome-shell fixed top-0 left-0 w-full z-[1000] flex items-center px-5 gap-5 ${burstActive ? 'chrome-burst' : ''}`}
      style={{
        height: '54px',
        backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 85%, transparent)',
        backdropFilter: 'blur(16px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.6)',
        borderBottom: '1px solid var(--border-color)',
        pointerEvents: hidden ? 'none' : 'auto',
        opacity: chromeOpacity,
        transition: chromeOpacity === 0 ? 'opacity 400ms ease-out' : 'none',
      }}
    >
      <button
        type="button"
        className="shrink-0 bg-transparent border-none cursor-pointer flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '15px',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: 'var(--accent-blue)',
        }}
        onClick={() => navigate(ROUTES.upload)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z" />
        </svg>
        briefly
      </button>

      {/* Nav links */}
      <div className="flex items-center gap-1 shrink-0">
        {NAV_LINKS.map(({ to, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{
                fontFamily: 'var(--font-ui)',
                letterSpacing: '0.01em',
                color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
                background: active ? 'var(--accent-blue-bg)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'var(--accent-blue-bg)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

      {/* Tools */}
      <div className="hidden lg:flex items-center gap-2 shrink-0">
        <ModeSelector />
        {showSummary && (
          <NavButton onClick={() => setSummaryDrawerOpen(true)} active={false}>
            Summary
          </NavButton>
        )}
        <NavButton onClick={toggleAdaptation} active={adaptationEnabled} title={adaptationEnabled ? 'Auto-adapt on' : 'Auto-adapt off'}>
          Adapt
        </NavButton>
        {location.pathname === ROUTES.read && (
          <NavButton onClick={toggleEyeStrain} active={eyeStrainVisible} title="Eye Strain Control">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </NavButton>
        )}
      </div>

      <div className="flex-1" />

      <OfflineBadge />
      <TimeRemaining />
      <ThemeToggle />

      {/* User menu */}
      <div className="relative shrink-0" ref={menuRef}>
        {user ? (
          <>
            <button
              type="button"
              className="w-8 h-8 rounded-full text-[11px] font-semibold border-none cursor-pointer transition-transform"
              style={{
                background: 'linear-gradient(135deg, var(--accent-blue), #7c3aed)',
                color: '#fff',
              }}
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {initials}
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 min-w-[200px] rounded-xl py-1.5 z-[1100]"
                  style={{
                    background: 'color-mix(in srgb, var(--bg-secondary) 92%, transparent)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-float)',
                  }}
                >
                  <MenuButton onClick={() => { navigate(ROUTES.dashboard); setMenuOpen(false); }}>
                    My reading history
                  </MenuButton>
                  <MenuButton onClick={() => { navigate(ROUTES.settings); setMenuOpen(false); }}>
                    Settings
                  </MenuButton>
                  <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 12px' }} />
                  <MenuButton onClick={() => { void signOut(); setMenuOpen(false); navigate(ROUTES.auth); }}>
                    Sign out
                  </MenuButton>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <button
            type="button"
            className="text-[12px] font-medium bg-transparent border-none cursor-pointer px-3 py-1.5 rounded-lg transition-colors"
            style={{
              color: 'var(--accent-blue)',
              fontFamily: 'var(--font-ui)',
            }}
            onClick={() => navigate(ROUTES.auth)}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-blue-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            Sign in
          </button>
        )}
      </div>
    </motion.nav>
  );
};

/* ── Reusable button sub–components ──────────────────────────────── */

const NavButton: React.FC<{
  onClick: () => void;
  active: boolean;
  title?: string;
  children: React.ReactNode;
}> = ({ onClick, active, title, children }) => (
  <button
    type="button"
    title={title}
    className="text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all"
    style={{
      fontFamily: 'var(--font-ui)',
      border: 'none',
      color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
      background: active ? 'var(--accent-blue-bg)' : 'transparent',
      cursor: 'pointer',
    }}
    onClick={onClick}
    onMouseEnter={(e) => {
      if (!active) e.currentTarget.style.background = 'var(--accent-blue-bg)';
    }}
    onMouseLeave={(e) => {
      if (!active) e.currentTarget.style.background = 'transparent';
    }}
  >
    {children}
  </button>
);

const MenuButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    type="button"
    className="block w-full text-left px-4 py-2 text-[13px] bg-transparent border-none cursor-pointer transition-colors"
    style={{
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-ui)',
    }}
    onClick={onClick}
    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-blue-bg)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
  >
    {children}
  </button>
);
