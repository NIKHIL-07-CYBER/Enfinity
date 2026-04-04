// DONE: Task 1 (routes, nav), Task 2 (active paragraph), Task 3 (text selection), Task 4 (adaptation toggle), 
// Task 5 (chatbot), Task 6 (scroll-to-fade), Task 7 (focus mode), Task 8 (brightness adapter)
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UploadPage } from '@/pages/UploadPage';
import { ReadPage } from '@/pages/ReadPage';
import { ReviewPage } from '@/pages/ReviewPage';
import { ArchivePage } from '@/pages/ArchivePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ROUTES } from '@/constants/routes';
import { SelectionPanel } from '@/components/Selection/SelectionPanel';
import './App.css';

const SavedPage: React.FC = () => <SelectionPanel />;

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.upload} element={<UploadPage />} />
        <Route path={ROUTES.read} element={<ReadPage />} />
        <Route path={ROUTES.review} element={<ReviewPage />} />
        <Route path={ROUTES.archive} element={<ArchivePage />} />
        <Route path={ROUTES.settings} element={<SettingsPage />} />
        <Route path={ROUTES.saved} element={<SavedPage />} />
        <Route path="*" element={<Navigate to={ROUTES.upload} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
