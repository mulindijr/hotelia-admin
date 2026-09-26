import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit2, Ban, Download } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { useCurrency } from '../../hooks/useCurrency';
import { bookingsApi } from '../../api/bookings';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';

const BookingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeHotelId } = useHotel();
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['booking', activeHotelId, id],
    queryFn: () => bookingsApi.getBooking(activeHotelId, id),
    enabled: !!activeHotelId && !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => bookingsApi.updateBookingStatus(activeHotelId, id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['booking', activeHotelId, id]);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: () => bookingsApi.cancelBooking(activeHotelId, id),
    onSuccess: () => {
      queryClient.invalidateQueries(['booking', activeHotelId, id]);
      setIsCancelModalOpen(false);
    }
  });

  const downloadInvoiceMutation = useMutation({
    mutationFn: () => bookingsApi.getBookingInvoice(activeHotelId, id),
    onSuccess: (response) => {
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${booking?.booking_reference || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  });

  if (!activeHotelId) {
    return <EmptyState />;
  }

  if (isLoading) {
    return <div className="flex justify-center p-12 text-zinc-500">Loading booking details...</div>;
  }

  const booking = data?.data;

  if (!booking) {
    return <div className="p-6 text-red-500">Booking not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/bookings')} className="p-2 text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900">Reservation #{booking.booking_reference}</h1>
              <BookingStatusBadge status={booking.status} />
            </div>
            <p className="mt-1 text-sm text-zinc-500">Created on {new Date(booking.created_at).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {booking.status === 'confirmed' && (
            <Button variant="secondary" onClick={() => updateStatusMutation.mutate('checked_in')} isLoading={updateStatusMutation.isPending}>
              Check In
            </Button>
          )}
          {booking.status === 'checked_in' && (
            <Button variant="secondary" onClick={() => updateStatusMutation.mutate('checked_out')} isLoading={updateStatusMutation.isPending}>
              Check Out
            </Button>
          )}
          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <Button variant="destructive" onClick={() => setIsCancelModalOpen(true)}>
              Cancel Booking
            </Button>
          )}
          <Button variant="secondary" onClick={() => downloadInvoiceMutation.mutate()} isLoading={downloadInvoiceMutation.isPending}>
            <Download className="w-4 h-4 mr-2" />
            Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Guest Details" className="col-span-1">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-zinc-500">Name</p>
              <p className="text-sm font-medium text-zinc-900">{booking.guest?.first_name} {booking.guest?.last_name}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Email</p>
              <p className="text-sm text-zinc-900">{booking.guest?.email}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Phone</p>
              <p className="text-sm text-zinc-900">{booking.guest?.phone}</p>
            </div>
          </div>
        </Card>

        <Card title="Stay Information" className="col-span-1 md:col-span-2">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-zinc-500">Check-In</p>
              <p className="text-sm font-medium text-zinc-900">{new Date(booking.check_in_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Check-Out</p>
              <p className="text-sm font-medium text-zinc-900">{new Date(booking.check_out_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Room(s)</p>
              <p className="text-sm text-zinc-900">{booking.rooms?.length > 0 ? booking.rooms.map(r => r.room_number).join(', ') : 'Not Assigned'}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Occupancy</p>
              <p className="text-sm text-zinc-900">{booking.adults} Adults, {booking.children} Children</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-zinc-500">Special Requests</p>
              <p className="text-sm text-zinc-900 italic">{booking.special_requests || 'None'}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Financial Summary">
        <div className="flex justify-between items-center py-3 border-b border-zinc-100">
          <span className="text-sm text-zinc-600">Total Price</span>
          <span className="text-lg font-bold text-zinc-900">{formatCurrency(booking.total_amount)}</span>
        </div>
      </Card>

      <ConfirmModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? This action may trigger cancellation policies."
        confirmText="Confirm Cancellation"
        isDestructive={true}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
};

export default BookingDetailsPage;
