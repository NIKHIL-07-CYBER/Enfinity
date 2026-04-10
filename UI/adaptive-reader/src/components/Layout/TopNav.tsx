// Navbar: Task 9 — logo, links, mode, summary, adaptation, theme, user
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
      animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`chrome-shell fixed top-0 left-0 w-full z-[1000] flex items-center px-5 gap-4 border-b ${burstActive ? 'chrome-burst' : ''}`}
      style={{
        height: '56px',
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        pointerEvents: hidden ? 'none' : 'auto',
        opacity: chromeOpacity,
        transition: chromeOpacity === 0 ? 'opacity 400ms ease-out' : 'none',
      }}
    >
      <button
        type="button"
        className="shrink-0 text-base font-semibold bg-transparent border-none cursor-pointer"
        style={{ color: 'var(--accent-blue)' }}
        onClick={() => navigate(ROUTES.upload)}
      >
        AR
      </button>

      <div className="flex items-center gap-4 shrink-0">
        {NAV_LINKS.map(({ to, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className="text-[13px] pb-0.5 transition-colors"
              style={{
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: active ? '2px solid var(--accent-blue)' : '2px solid transparent',
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="hidden lg:flex items-center gap-3 shrink-0">
        <ModeSelector />
        {showSummary && (
          <button
            type="button"
            className="text-[13px] px-2 py-1 rounded-md border"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            onClick={() => setSummaryDrawerOpen(true)}
          >
            Summary
          </button>
        )}
        <button
          type="button"
          title={adaptationEnabled ? 'Auto-adapt on' : 'Auto-adapt off'}
          className="text-[12px] px-2 py-1 rounded-md"
          style={{
            border: '1px solid var(--border-color)',
            color: adaptationEnabled ? 'var(--accent-blue)' : 'var(--text-secondary)',
            background: adaptationEnabled ? 'var(--accent-blue-bg)' : 'transparent',
          }}
          onClick={toggleAdaptation}
        >
          Auto-adapt
        </button>
      </div>

      <div className="flex-1" />

      <OfflineBadge />
      <TimeRemaining />
      <ThemeToggle />

      <div className="relative shrink-0" ref={menuRef}>
        {user ? (
          <>
            <button
              type="button"
              className="w-8 h-8 rounded-full text-xs font-semibold border-none cursor-pointer"
              style={{ background: 'var(--accent-blue)', color: 'var(--toolbar-on-accent)' }}
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
            >
              {initials}
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-10 min-w-[200px] rounded-lg border py-1 shadow-lg z-[1100]"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <button
                  type="button"
                  className="block w-full text-left px-3 py-2 text-sm bg-transparent border-none cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}
                  onClick={() => {
                    navigate(ROUTES.dashboard);
                    setMenuOpen(false);
                  }}
                >
                  My reading history
                </button>
                <button
                  type="button"
                  className="block w-full text-left px-3 py-2 text-sm bg-transparent border-none cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}
                  onClick={() => {
                    navigate(ROUTES.settings);
                    setMenuOpen(false);
                  }}
                >
                  Settings
                </button>
                <div style={{ borderTop: '1px solid var(--border-color)' }} />
                <button
                  type="button"
                  className="block w-full text-left px-3 py-2 text-sm bg-transparent border-none cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}
                  onClick={() => {
                    void signOut();
                    setMenuOpen(false);
                    navigate(ROUTES.auth);
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            className="text-[13px] bg-transparent border-none cursor-pointer"
            style={{ color: 'var(--accent-blue)' }}
            onClick={() => navigate(ROUTES.auth)}
          >
            Sign in
          </button>
        )}
      </div>
    </motion.nav>
  );
};
