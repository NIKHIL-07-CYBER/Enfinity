import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { UploadPage } from '@/pages/UploadPage';
import { ReadPage } from '@/pages/ReadPage';
import { ReviewPage } from '@/pages/ReviewPage';
import { ArchivePage } from '@/pages/ArchivePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ROUTES } from '@/constants/routes';
import { SelectionPanel } from '@/components/Selection/SelectionPanel';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import './App.css';

const SavedPage: React.FC = () => <SelectionPanel />;

function AuthInit(): null {
  useEffect(() => {
    void useAuthStore.getState().initialize();
  }, []);
  return null;
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthInit />
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            fontSize: '14px',
          },
        }}
      />
      <Routes>
        <Route path={ROUTES.auth} element={<AuthPage />} />
        <Route path={ROUTES.upload} element={<UploadPage />} />
        <Route path={ROUTES.read} element={<ReadPage />} />
        <Route
          path={ROUTES.review}
          element={
            <ProtectedRoute>
              <ReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.archive}
          element={
            <ProtectedRoute>
              <ArchivePage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.settings}
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path={ROUTES.saved} element={<SavedPage />} />
        <Route
          path={ROUTES.dashboard}
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={ROUTES.upload} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
