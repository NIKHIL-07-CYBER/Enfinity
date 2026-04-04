import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        <div className="animate-spin w-10 h-10 rounded-full border-4 border-[var(--accent-blue)] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.auth} replace />;
  }

  return <>{children}</>;
};
