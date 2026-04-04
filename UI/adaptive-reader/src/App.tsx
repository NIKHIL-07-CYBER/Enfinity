import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UploadPage } from '@/pages/UploadPage';
import { ReadPage } from '@/pages/ReadPage';
import { ReviewPage } from '@/pages/ReviewPage';
import { ROUTES } from '@/constants/routes';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.upload} element={<UploadPage />} />
        <Route path={ROUTES.read} element={<ReadPage />} />
        <Route path={ROUTES.review} element={<ReviewPage />} />
        <Route path="*" element={<Navigate to={ROUTES.upload} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
