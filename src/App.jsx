import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { HotelProvider } from './context/HotelContext';
import AppShell from './components/layout/AppShell';

// Public Auth Pages (Lazy loaded)
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

// Protected Pages (Lazy loaded)
const HotelListPage = lazy(() => import('./pages/hotels/HotelListPage'));
const HotelSettingsPage = lazy(() => import('./pages/settings/HotelSettingsPage'));
const ServicesPage = lazy(() => import('./pages/rooms/ServicesPage'));
const AmenitiesPage = lazy(() => import('./pages/rooms/AmenitiesPage'));
const RoomTypesPage = lazy(() => import('./pages/rooms/RoomTypesPage'));
const RoomsPage = lazy(() => import('./pages/rooms/RoomsPage'));
const AvailabilityMatrixPage = lazy(() => import('./pages/rooms/AvailabilityMatrixPage'));
const GuestListPage = lazy(() => import('./pages/guests/GuestListPage'));
const GuestDetailsPage = lazy(() => import('./pages/guests/GuestDetailsPage'));

const BookingListPage = lazy(() => import('./pages/bookings/BookingListPage'));
const BookingDetailsPage = lazy(() => import('./pages/bookings/BookingDetailsPage'));
const PaymentListPage = lazy(() => import('./pages/payments/PaymentListPage'));
const UserListPage = lazy(() => import('./pages/users/UserListPage'));

const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));

const HousekeepingPage = lazy(() => import('./pages/operations/HousekeepingPage'));
const MaintenancePage = lazy(() => import('./pages/operations/MaintenancePage'));

const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage'));
const RolesPage = lazy(() => import('./pages/admin/RolesPage'));

const RatePlansPage = lazy(() => import('./pages/pricing/RatePlansPage'));
const PricingRulesPage = lazy(() => import('./pages/pricing/PricingRulesPage'));

// Create a client
const queryClient = new QueryClient();

const FallbackLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-zinc-50">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <HotelProvider>
            <Suspense fallback={<FallbackLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Protected Routes inside AppShell */}
                <Route element={<AppShell />}>
                  <Route path="/" element={<DashboardPage />} />
                  
                  {/* Analytics */}
                  <Route path="/reports" element={<ReportsPage />} />

                  {/* Operations */}
                  <Route path="/housekeeping" element={<HousekeepingPage />} />
                  <Route path="/maintenance" element={<MaintenancePage />} />

                  {/* Admin */}
                  <Route path="/audit-logs" element={<AuditLogsPage />} />
                  <Route path="/roles" element={<RolesPage />} />
                  
                  {/* Bookings & Payments */}
                  <Route path="/bookings" element={<BookingListPage />} />
                  <Route path="/bookings/:id" element={<BookingDetailsPage />} />
                  <Route path="/payments" element={<PaymentListPage />} />
                  <Route path="/users" element={<UserListPage />} />
                  
                  {/* Master Data */}
                  <Route path="/hotels" element={<HotelListPage />} />
                  <Route path="/settings" element={<HotelSettingsPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/guests" element={<GuestListPage />} />
                  <Route path="/guests/:id" element={<GuestDetailsPage />} />
                  
                  {/* Rooms Sub-Routing */}
                  <Route path="/rooms" element={<RoomsPage />} />
                  <Route path="/room-types" element={<RoomTypesPage />} />
                  <Route path="/amenities" element={<AmenitiesPage />} />
                  <Route path="/availability" element={<AvailabilityMatrixPage />} />

                  {/* Pricing */}
                  <Route path="/rate-plans" element={<RatePlansPage />} />
                  <Route path="/pricing-rules" element={<PricingRulesPage />} />
                </Route>

                {/* Catch-all 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </HotelProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
