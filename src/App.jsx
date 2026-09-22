import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { HotelProvider } from './context/HotelContext';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/auth/LoginPage';

// Create a client
const queryClient = new QueryClient();

// Placeholder components for routes
const Dashboard = () => <div className="p-6"><h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1><p className="mt-4 text-zinc-600">Welcome to Hotelia Admin.</p></div>;
const Placeholder = ({ title }) => <div className="p-6"><h1 className="text-2xl font-bold text-zinc-900">{title}</h1></div>;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <HotelProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<Placeholder title="Forgot Password" />} />
              <Route path="/reset-password" element={<Placeholder title="Reset Password" />} />

              {/* Protected Routes inside AppShell */}
              <Route element={<AppShell />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/bookings" element={<Placeholder title="Bookings" />} />
                <Route path="/rooms" element={<Placeholder title="Rooms & Grid" />} />
                <Route path="/guests" element={<Placeholder title="Guests" />} />
                <Route path="/payments" element={<Placeholder title="Payments" />} />
                <Route path="/hotels" element={<Placeholder title="Hotels" />} />
                <Route path="/users" element={<Placeholder title="Staff & Users" />} />
                <Route path="/settings" element={<Placeholder title="Settings" />} />
              </Route>

              {/* Catch-all 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HotelProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
