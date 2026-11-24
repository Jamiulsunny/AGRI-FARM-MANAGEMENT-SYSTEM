import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { FarmProvider } from './context/FarmContext';
import AppLayout from './components/layout/AppLayout';

// ১. ল্যান্ডিং পেজ ইমপোর্ট
import LandingPage from './pages/LandingPage';

// ২. ড্যাশবোর্ড ও ভেতরের পেজগুলো ইমপোর্ট
import Dashboard from './pages/Dashboard';
import Animals from './pages/Animals';
import AddAnimal from './pages/AddAnimal';
import EditAnimal from './pages/EditAnimal';
import AnimalDetails from './pages/AnimalDetails';
import AnimalHealth from './pages/AnimalHealth';
import Reports from './pages/Reports';
import DeletedAnimals from './pages/DeletedAnimals';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <FarmProvider>
          <Routes>
            {/* মূল ওয়েবসাইটে ঢুকলে (/) ল্যান্ডিং পেজ দেখাবে */}
            <Route path="/" element={<LandingPage />} />

            {/* ভেতরের ড্যাশবোর্ড সিস্টেম */}
            <Route element={<AppLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="animals" element={<Animals />} />
              <Route path="animals/:id" element={<AnimalDetails />} />
              <Route path="add-animal" element={<AddAnimal />} />
              <Route path="edit-animal/:id" element={<EditAnimal />} />
              <Route path="health" element={<AnimalHealth />} />
              <Route path="reports" element={<Reports />} />
              <Route path="deleted" element={<DeletedAnimals />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </FarmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}