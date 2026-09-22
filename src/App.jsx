import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { HotelProvider } from './context/HotelContext';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/auth/LoginPage';

// Phase 3 Pages
import HotelListPage from './pages/hotels/HotelListPage';
import HotelSettingsPage from './pages/settings/HotelSettingsPage';
import AmenitiesPage from './pages/rooms/AmenitiesPage';
import RoomTypesPage from './pages/rooms/RoomTypesPage';
import RoomsPage from './pages/rooms/RoomsPage';
import AvailabilityMatrixPage from './pages/rooms/AvailabilityMatrixPage';
import GuestListPage from './pages/guests/GuestListPage';

// Phase 4 Pages
import BookingListPage from './pages/bookings/BookingListPage';
import BookingDetailsPage from './pages/bookings/BookingDetailsPage';

// Phase 5 Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import PaymentListPage from './pages/payments/PaymentListPage';
import UserListPage from './pages/users/UserListPage';

// Create a client
const queryClient = new QueryClient();

// Placeholder components for routes
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
                <Route path="/" element={<DashboardPage />} />
                
                {/* Bookings & Payments (Phase 4/5) */}
                <Route path="/bookings" element={<BookingListPage />} />
                <Route path="/bookings/:id" element={<BookingDetailsPage />} />
                <Route path="/payments" element={<PaymentListPage />} />
                <Route path="/users" element={<UserListPage />} />
                
                {/* Phase 3 Master Data */}
                <Route path="/hotels" element={<HotelListPage />} />
                <Route path="/settings" element={<HotelSettingsPage />} />
                <Route path="/guests" element={<GuestListPage />} />
                
                {/* Rooms Sub-Routing */}
                <Route path="/rooms" element={<RoomsPage />} />
                <Route path="/room-types" element={<RoomTypesPage />} />
                <Route path="/amenities" element={<AmenitiesPage />} />
                <Route path="/availability" element={<AvailabilityMatrixPage />} />
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
