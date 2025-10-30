import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { HomePage } from './components/HomePage';
import { PostDetail } from './components/PostDetail';
import { PostEditor } from './components/PostEditor';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Profile } from './components/Profile';
import { AdminDashboard } from './components/AdminDashboard';
import { CategoriesPage } from './components/CategoriesPage';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/create" element={<PostEditor />} />
            <Route path="/edit/:id" element={<PostEditor />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}
