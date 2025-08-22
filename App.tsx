import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import PersonalExpensesPage from './pages/PersonalExpensesPage';
import OrnamentalGoldPage from './pages/OrnamentalGoldPage';
import AssistantPage from './pages/AssistantPage';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';


const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  // Initialize state to be open on desktop (>=768px) and closed on mobile.
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  // Effect to handle window resizing to correctly show/hide sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    // Cleanup the event listener on component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array ensures this effect runs only once on mount

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-gold"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const AccessDenied: React.FC = () => (
    <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">دسترسی غیر مجاز</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">شما اجازه مشاهده یا انجام عملیات در این بخش را ندارید.</p>
    </div>
);

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/ornamental-gold" element={<OrnamentalGoldPage />} />
        <Route path="/personal-affairs" element={<PersonalExpensesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;