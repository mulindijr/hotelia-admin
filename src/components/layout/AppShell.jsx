import React, { useState, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';

const PageLoader = () => (
  <div className="flex items-center justify-center py-24">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
  </div>
);

const AppShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading: isLoadingAuth } = useAuth();

  if (!isLoadingAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  if (isLoadingAuth && !user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
