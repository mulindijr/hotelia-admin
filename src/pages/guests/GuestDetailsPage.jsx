import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Edit2, 
  Mail, 
  Phone, 
  Globe, 
  CreditCard, 
  CalendarCheck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  User,
  MapPin,
  Calendar,
  Building,
  Search,
  X
} from 'lucide-react';
import { guestsApi } from '../../api/guests';
import { useHotel } from '../../context/HotelContext';
import { useCurrency } from '../../hooks/useCurrency';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge';
import GuestFormModal from '../../components/guests/GuestFormModal';
import GuestDetailsSkeleton from '../../components/guests/GuestDetailsSkeleton';
import EmptyState from '../../components/common/EmptyState';

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

const GuestDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeHotel, activeHotelId } = useHotel();
  const { formatCurrency } = useCurrency();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Table pagination and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // 1. Fetch Guest Profile
  const { 
    data: guestData, 
    isLoading: isLoadingGuest, 
    isError: isErrorGuest, 
    error: guestError, 
    refetch: refetchGuest 
  } = useQuery({
    queryKey: ['guest', id],
    queryFn: () => guestsApi.getGuest(id),
    enabled: !!id,
  });

  // 2. Fetch Guest Bookings scoped to the current hotel
  const { 
    data: bookingsData, 
    isLoading: isLoadingBookings, 
    isError: isErrorBookings, 
    error: bookingsError,
    refetch: refetchBookings 
  } = useQuery({
    queryKey: ['guest-bookings', id, activeHotelId],
    queryFn: () => guestsApi.getGuestBookings(id, { hotel_id: activeHotelId }),
    enabled: !!id && !!activeHotelId,
  });

  const guest = guestData?.data;
  const bookings = bookingsData?.data || [];

  // Reset pagination if hotel changes
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
  }, [activeHotelId, id]);

  if (!activeHotelId) {
    return <EmptyState />;
  }

  // Show skeleton on initial fetch
  if ((isLoadingGuest && !guest) || (isLoadingBookings && bookings.length === 0 && !guest)) {
    return <GuestDetailsSkeleton />;
  }

  // Gracefully handle profile query errors
  if (isErrorGuest && !guest) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-zinc-200 rounded-xl shadow-sm text-center space-y-4 animate-in fade-in duration-200">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900">Unable to Load Guest Profile</h2>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          {guestError?.response?.data?.message || guestError?.message || 'An error occurred while fetching guest information. Please check your connection and try again.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-3">
          <Button variant="secondary" onClick={() => navigate('/guests')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Guests
          </Button>
          <Button onClick={() => refetchGuest()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-zinc-200 rounded-xl shadow-sm text-center space-y-4 animate-in fade-in duration-200">
        <div className="w-12 h-12 bg-zinc-100 text-zinc-500 rounded-full flex items-center justify-center mx-auto">
          <User className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900">Guest Not Found</h2>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          The requested guest profile does not exist or may have been removed.
        </p>
        <div className="flex items-center justify-center gap-3 pt-3">
          <Button variant="secondary" onClick={() => navigate('/guests')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Guests
          </Button>
        </div>
      </div>
    );
  }

  // 3. Compute Financial and Stay Summary strictly for the active hotel
  const hotelBookings = bookings.filter(b => !activeHotelId || Number(b.hotel_id) === Number(activeHotelId));
  const otherHotelBookingsCount = bookings.filter(b => activeHotelId && Number(b.hotel_id) !== Number(activeHotelId)).length;

  const totalBookings = hotelBookings.length;
  const completedStays = hotelBookings.filter(b => b.status === 'checked_out').length;
  const upcomingStays = hotelBookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length;
  const cancelledStays = hotelBookings.filter(b => b.status === 'cancelled').length;

  const totalSpent = hotelBookings.reduce((sum, b) => {
    if (b.status === 'cancelled') return sum;
    return sum + Number(b.grand_total ?? b.total_amount ?? 0);
  }, 0);

  const totalBalanceDue = hotelBookings.reduce((sum, b) => {
    if (b.status === 'cancelled') return sum;
    const bTotal = Number(b.grand_total ?? b.total_amount ?? 0);
    const bPaid = b.payments?.filter(p => !p.status || p.status === 'completed').reduce((acc, p) => acc + Number(p.amount || 0), 0) || 0;
    const diff = bTotal - bPaid;
    return sum + (diff > 0 ? diff : 0);
  }, 0);

  // 4. Search Filter
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return hotelBookings;
    
    const query = searchQuery.trim().toLowerCase();
    
    return hotelBookings.filter((b) => {
      // 1. Reference
      const refMatch = b.booking_reference?.toLowerCase().includes(query);

      // 2. Room or room type
      const roomMatch = b.rooms?.some((r) => {
        const numMatch = r.room_number?.toString().toLowerCase().includes(query);
        const typeMatch = r.room_type?.name?.toLowerCase().includes(query);
        return numMatch || typeMatch;
      });

      // 3. Status
      const rawStatus = b.status?.toLowerCase() || '';
      const readableStatus = (STATUS_LABELS[b.status] || b.status || '').toLowerCase();
      const statusMatch = rawStatus.includes(query) || readableStatus.includes(query);

      // 4. Stay dates
      const inMatch = b.check_in_date?.toLowerCase().includes(query);
      const outMatch = b.check_out_date?.toLowerCase().includes(query);

      return refMatch || roomMatch || statusMatch || inMatch || outMatch;
    });
  }, [hotelBookings, searchQuery]);

  // 5. Pagination Calculation
  const totalFiltered = filteredBookings.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalFiltered);
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  const fromRecord = totalFiltered > 0 ? startIndex + 1 : 0;
  const toRecord = endIndex;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Generate pagination buttons
  const getPaginationItems = () => {
    const items = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      if (safeCurrentPage <= 3) {
        items.push(1, 2, 3, 4, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 2) {
        items.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        items.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return items;
  };

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-200">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/guests')}
            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200 bg-white"
            title="Back to Guests"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900">
                {guest.first_name} {guest.last_name}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
                Guest #{guest.id}
              </span>
            </div>
            <p className="text-sm text-zinc-500 mt-0.5">
              Profile registered {guest.created_at ? new Date(guest.created_at).toLocaleDateString() : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* KPI Cards: Stay & Financial Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase tracking-wider">Bookings</span>
            <Calendar className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 mt-2">{totalBookings}</div>
          <div className="text-xs text-zinc-400 mt-1">at {activeHotel?.name || 'this hotel'}</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase tracking-wider">Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{completedStays}</div>
          <div className="text-xs text-zinc-400 mt-1">Checked out stays</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase tracking-wider">Upcoming</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{upcomingStays}</div>
          <div className="text-xs text-zinc-400 mt-1">Pending / Confirmed</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase tracking-wider">Cancelled</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{cancelledStays}</div>
          <div className="text-xs text-zinc-400 mt-1">Past cancellations</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Spent</span>
            <CreditCard className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-lg font-bold text-zinc-900 mt-2 truncate" title={formatCurrency(totalSpent)}>
            {formatCurrency(totalSpent)}
          </div>
          <div className="text-xs text-zinc-400 mt-1">Non-cancelled totals</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase tracking-wider">Balance Due</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-lg font-bold mt-2 truncate ${totalBalanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`} title={formatCurrency(totalBalanceDue)}>
            {formatCurrency(totalBalanceDue)}
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            {totalBalanceDue > 0 ? 'Outstanding balance' : 'All accounts settled'}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Guest Details Card */}
        <Card title="Guest Information" className="col-span-1 h-fit">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Full Name</p>
              <p className="text-sm font-semibold text-zinc-900 mt-0.5">
                {guest.first_name} {guest.last_name}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email Address</p>
              <p className="text-sm text-zinc-900 mt-0.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                {guest.email ? (
                  <a href={`mailto:${guest.email}`} className="text-zinc-900 hover:text-zinc-600 hover:underline">
                    {guest.email}
                  </a>
                ) : (
                  <span className="text-zinc-400 italic">Not provided</span>
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Phone Number</p>
              <p className="text-sm text-zinc-900 mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                {guest.phone ? (
                  <a href={`tel:${guest.phone}`} className="text-zinc-900 hover:text-zinc-600 hover:underline">
                    {guest.phone}
                  </a>
                ) : (
                  <span className="text-zinc-400 italic">Not provided</span>
                )}
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-100">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Country / Nationality</p>
              <p className="text-sm text-zinc-900 mt-0.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                {guest.country || guest.nationality || <span className="text-zinc-400 italic">Not specified</span>}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">National ID</p>
              <p className="text-sm text-zinc-900 mt-0.5">
                {guest.national_id || <span className="text-zinc-400 italic">Not provided</span>}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Passport Number</p>
              <p className="text-sm text-zinc-900 mt-0.5">
                {guest.passport_number || <span className="text-zinc-400 italic">Not provided</span>}
              </p>
            </div>

            {guest.address && (
              <div className="pt-3 border-t border-zinc-100">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Address</p>
                <p className="text-sm text-zinc-900 mt-0.5 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  {guest.address}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Right Column: Booking History Card */}
        <Card 
          title="Booking History" 
          subtitle={`Reservations at ${activeHotel?.name || 'this property'} (${hotelBookings.length})`}
          className="col-span-1 lg:col-span-2"
        >
          {isErrorBookings ? (
            <div className="py-8 px-4 text-center border border-rose-200 rounded-xl bg-rose-50/50 space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-900">Failed to Load Booking History</p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  {bookingsError?.response?.data?.message || bookingsError?.message || 'An error occurred while retrieving reservation records for this guest.'}
                </p>
              </div>
              <div>
                <Button size="sm" variant="secondary" onClick={() => refetchBookings()}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Retry
                </Button>
              </div>
            </div>
          ) : isLoadingBookings ? (
            <div className="py-12 px-4 text-center text-zinc-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-400" />
              <p className="text-xs">Loading reservation history...</p>
            </div>
          ) : hotelBookings.length === 0 ? (
            <div className="py-12 px-4 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 space-y-3">
              <CalendarCheck className="w-10 h-10 text-zinc-300 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-zinc-900">No Booking History Found</p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                  This guest has no reservation records registered at {activeHotel?.name || 'this hotel'}.
                </p>
              </div>

              {otherHotelBookingsCount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-200">
                  <Building className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Guest has {otherHotelBookingsCount} booking{otherHotelBookingsCount > 1 ? 's' : ''} at other properties. Switch property in the top bar to inspect them.
                  </span>
                </div>
              )}

              <div className="pt-2">
                <Button size="sm" onClick={() => navigate('/bookings')}>
                  Create New Reservation
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Controls Header: Search & Show Entries */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                {/* Search Bar */}
                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search reference, room, status..."
                    className="block w-full pl-9 pr-8 py-1.5 text-xs border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-colors bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Show Entries Dropdown */}
                <div className="flex items-center gap-2 text-xs text-zinc-600 self-end sm:self-auto">
                  <span className="font-medium text-zinc-500">Show</span>
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-zinc-200 rounded-md py-1.5 px-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 cursor-pointer bg-white"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="font-medium text-zinc-500">entries</span>
                </div>
              </div>

              {/* Table or Filtered Empty State */}
              {paginatedBookings.length === 0 ? (
                <div className="py-12 px-4 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 space-y-2">
                  <Search className="w-8 h-8 text-zinc-300 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-900">No matching reservations</p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    No bookings found matching "{searchQuery}". Try searching by a different reference, room, or status.
                  </p>
                  <div className="pt-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                    >
                      Clear Search
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200">
                  <table className="w-full text-left text-sm min-w-[720px]">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                      <tr>
                        <th className="px-4 py-2.5 font-medium whitespace-nowrap">Reference</th>
                        <th className="px-4 py-2.5 font-medium whitespace-nowrap">Stay Dates</th>
                        <th className="px-4 py-2.5 font-medium whitespace-nowrap">Room</th>
                        <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Total</th>
                        <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Paid / Balance</th>
                        <th className="px-4 py-2.5 font-medium text-center whitespace-nowrap min-w-[120px]">Status</th>
                        <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 bg-white">
                      {paginatedBookings.map((b) => {
                        const total = Number(b.grand_total ?? b.total_amount ?? 0);
                        const paid = b.payments?.filter(p => !p.status || p.status === 'completed').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
                        const balance = total - paid;
                        const checkIn = b.check_in_date ? new Date(b.check_in_date).toLocaleDateString() : 'N/A';
                        const checkOut = b.check_out_date ? new Date(b.check_out_date).toLocaleDateString() : 'N/A';
                        
                        const roomNumbers = b.rooms?.map(r => r.room_number).filter(Boolean).join(', ');
                        const roomTypes = [...new Set(b.rooms?.map(r => r.room_type?.name).filter(Boolean))].join(', ');
                        const roomNumberDisplay = roomNumbers || 'Assigned on arrival';
                        const roomTypeDisplay = roomTypes || b.rooms?.[0]?.room_type?.name || '';

                        return (
                          <tr key={b.id} className="hover:bg-zinc-50/60 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Link 
                                to={`/bookings/${b.id}`} 
                                className="font-semibold text-zinc-900 hover:text-zinc-600 hover:underline flex items-center gap-1 group"
                              >
                                {b.booking_reference}
                                <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                              <span className="text-xs text-zinc-400 block mt-0.5">
                                Created {b.created_at ? new Date(b.created_at).toLocaleDateString() : ''}
                              </span>
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-medium text-zinc-800">{checkIn}</span>
                              <span className="text-zinc-400 mx-1">→</span>
                              <span className="font-medium text-zinc-800">{checkOut}</span>
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-medium text-zinc-900 block" title={roomNumberDisplay}>
                                {roomNumberDisplay}
                              </span>
                              <span className="text-xs text-zinc-500 block mt-0.5" title={roomTypeDisplay || undefined}>
                                {roomTypeDisplay || (b.adults ? `${b.adults} Adults${b.children > 0 ? `, ${b.children} Children` : ''}` : 'Standard')}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-right font-medium text-zinc-900 whitespace-nowrap">
                              {formatCurrency(total)}
                            </td>

                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="text-xs text-zinc-600">{formatCurrency(paid)}</div>
                              {b.status === 'cancelled' ? (
                                <span className="text-xs text-zinc-400 italic">Cancelled</span>
                              ) : balance <= 0 ? (
                                <span className="text-xs font-semibold text-emerald-600">Settled</span>
                              ) : (
                                <span className="text-xs font-semibold text-rose-600">
                                  {formatCurrency(balance)} due
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <BookingStatusBadge status={b.status} />
                            </td>

                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => navigate(`/bookings/${b.id}`)}
                                className="text-xs text-zinc-600 hover:text-zinc-900"
                              >
                                View
                                <ChevronRight className="w-3.5 h-3.5 ml-1" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Footer */}
              {totalFiltered > 0 && (
                <div className="px-4 py-3 border border-zinc-200 bg-zinc-50/70 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-600">
                  <div>
                    Showing <span className="font-semibold text-zinc-900">{fromRecord}</span> to{' '}
                    <span className="font-semibold text-zinc-900">{toRecord}</span> of{' '}
                    <span className="font-semibold text-zinc-900">{totalFiltered}</span> results
                    {searchQuery && (
                      <span className="text-zinc-400 ml-1.5">
                        (filtered from {hotelBookings.length} total)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      disabled={safeCurrentPage <= 1}
                      onClick={() => handlePageChange(safeCurrentPage - 1)}
                      className="px-2.5 py-1.5 border border-zinc-200 rounded-md hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed bg-white font-medium text-xs transition-colors flex items-center gap-1 text-zinc-700"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Prev
                    </button>

                    <div className="flex items-center gap-1">
                      {getPaginationItems().map((item, idx) => {
                        if (item === '...') {
                          return (
                            <span key={`ellipsis-${idx}`} className="px-2 py-1 text-zinc-400 select-none">
                              …
                            </span>
                          );
                        }
                        const isCurrent = item === safeCurrentPage;
                        return (
                          <button
                            key={item}
                            onClick={() => handlePageChange(item)}
                            className={`min-w-[28px] h-7 px-2 rounded-md font-medium text-xs transition-colors ${
                              isCurrent
                                ? 'bg-zinc-900 text-white shadow-xs'
                                : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      disabled={safeCurrentPage >= totalPages}
                      onClick={() => handlePageChange(safeCurrentPage + 1)}
                      className="px-2.5 py-1.5 border border-zinc-200 rounded-md hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed bg-white font-medium text-xs transition-colors flex items-center gap-1 text-zinc-700"
                      title="Next Page"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Edit Profile Modal */}
      <GuestFormModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        guest={guest}
        onSuccess={() => {
          queryClient.invalidateQueries(['guest', id]);
          refetchGuest();
        }}
      />
    </div>
  );
};

export default GuestDetailsPage;
