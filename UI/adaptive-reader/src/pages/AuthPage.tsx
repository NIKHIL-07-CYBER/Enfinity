import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      navigate(ROUTES.upload, { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (!isLoading && user) {
    return <Navigate to={ROUTES.upload} replace />;
  }

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await signInWithEmail(email, password);
    setBusy(false);
    if (err) {
      setError(err);
      toast.error(err);
    } else {
      toast.success('Signed in');
      navigate(ROUTES.upload);
    }
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email');
      return;
    }
    setBusy(true);
    const { error: err } = await signUpWithEmail(email, password);
    setBusy(false);
    if (err) {
      setError(err);
      toast.error(err);
    } else {
      toast.success('Account created');
      navigate(ROUTES.upload);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div
        className="w-full max-w-[400px] rounded-xl border p-8"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{
              background: tab === 'signin' ? 'var(--accent-blue)' : 'transparent',
              color: tab === 'signin' ? 'var(--toolbar-on-accent)' : 'var(--text-secondary)',
            }}
            onClick={() => setTab('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{
              background: tab === 'signup' ? 'var(--accent-blue)' : 'transparent',
              color: tab === 'signup' ? 'var(--toolbar-on-accent)' : 'var(--text-secondary)',
            }}
            onClick={() => setTab('signup')}
          >
            Create account
          </button>
        </div>

        {tab === 'signin' ? (
          <form onSubmit={onSignIn} className="space-y-4">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg px-3 py-2 border text-sm"
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2 border text-sm"
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            {error && <p className="text-sm" style={{ color: 'var(--accent-blue)' }}>{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
              style={{ background: 'var(--accent-blue)', color: 'var(--toolbar-on-accent)' }}
            >
              {busy ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Sign in
            </button>
            <button
              type="button"
              className="w-full text-sm text-center"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => navigate(ROUTES.upload)}
            >
              Continue without account
            </button>
          </form>
        ) : (
          <form onSubmit={onSignUp} className="space-y-4">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg px-3 py-2 border text-sm"
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2 border text-sm"
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <input
              type="password"
              required
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg px-3 py-2 border text-sm"
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            {error && <p className="text-sm" style={{ color: 'var(--accent-blue)' }}>{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
              style={{ background: 'var(--accent-blue)', color: 'var(--toolbar-on-accent)' }}
            >
              {busy ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Create account
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
