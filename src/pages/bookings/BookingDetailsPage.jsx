import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit2, Ban, Download, Plus } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { useCurrency } from '../../hooks/useCurrency';
import { bookingsApi } from '../../api/bookings';
import { downloadBlob } from '../../api/client';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import toast from 'react-hot-toast';
import AddPaymentModal from '../../components/bookings/AddPaymentModal';
import AddServiceModal from '../../components/bookings/AddServiceModal';
import EmptyState from '../../components/common/EmptyState';

const BookingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeHotelId } = useHotel();
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['booking', activeHotelId, id],
    queryFn: () => bookingsApi.getBooking(activeHotelId, id, { include: 'guest,rooms,payments,services' }),
    enabled: !!activeHotelId && !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => bookingsApi.updateBookingStatus(activeHotelId, id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['booking', activeHotelId, id]);
      toast.success('Service added successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add service');
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

  const booking = data?.data;

const addPaymentMutation = useMutation({
    mutationFn: (data) => bookingsApi.addPayment(activeHotelId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['booking', activeHotelId, id]);
      toast.success('Service added successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add service');
    }
  });

  const addServiceMutation = useMutation({
    mutationFn: (newService) => {
      const existingServices = booking?.services?.map(s => ({ id: s.id, quantity: s.pivot.quantity })) || [];
      // check if existing service id exists
      const existingIndex = existingServices.findIndex(s => s.id === newService.id);
      if (existingIndex > -1) {
        existingServices[existingIndex].quantity += newService.quantity;
      } else {
        existingServices.push(newService);
      }
      return bookingsApi.patchBooking(activeHotelId, id, { services: existingServices });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['booking', activeHotelId, id]);
      toast.success('Service added successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add service');
    }
  });

    
  if (!activeHotelId) {
    return <EmptyState />;
  }

  if (isLoading) {
    return <div className="flex justify-center p-12 text-zinc-500">Loading booking details...</div>;
  }

  
  const totalPaid = booking?.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const balanceDue = (booking?.total_amount || 0) - totalPaid;


  if (!booking) {
    return <div className="p-6 text-red-500">Booking not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/bookings')} className="cursor-pointer p-2 text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg">
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
          {booking.status === 'pending' && (
            <Button variant="secondary" onClick={() => updateStatusMutation.mutate('confirmed')} isLoading={updateStatusMutation.isPending && updateStatusMutation.variables === 'confirmed'} disabled={updateStatusMutation.isPending}>
              Confirm
            </Button>
          )}
          {(booking.status === 'confirmed' || booking.status === 'pending') && (
            <Button variant="secondary" onClick={() => updateStatusMutation.mutate('checked_in')} isLoading={updateStatusMutation.isPending && updateStatusMutation.variables === 'checked_in'} disabled={updateStatusMutation.isPending}>
              Check In
            </Button>
          )}
          {booking.status === 'checked_in' && (
            <Button variant="secondary" onClick={() => updateStatusMutation.mutate('checked_out')} isLoading={updateStatusMutation.isPending && updateStatusMutation.variables === 'checked_out'} disabled={updateStatusMutation.isPending}>
              Check Out
            </Button>
          )}
          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <Button variant="destructive" onClick={() => setIsCancelModalOpen(true)} disabled={updateStatusMutation.isPending}>
              Cancel
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
              <p className="text-sm text-zinc-900 italic">{booking.notes || 'None'}</p>
            </div>
          </div>
        </Card>

        <Card title="Services & Extras" className="col-span-1 md:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-zinc-500">Additional services charged to this booking</p>
            <Button variant="outline" size="sm" onClick={() => setIsServiceModalOpen(true)}>
              <Plus className="w-3 h-3 mr-1" />
              Add Service
            </Button>
          </div>
          
          {booking.services && booking.services.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-zinc-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Service Name</th>
                    <th className="px-4 py-2 font-medium text-center">Quantity</th>
                    <th className="px-4 py-2 font-medium text-right">Unit Price</th>
                    <th className="px-4 py-2 font-medium text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {booking.services.map((service) => (
                    <tr key={service.id}>
                      <td className="px-4 py-2 text-zinc-900 font-medium">{service.name}</td>
                      <td className="px-4 py-2 text-zinc-600 text-center">{service.pivot.quantity}</td>
                      <td className="px-4 py-2 text-zinc-500 text-right">{formatCurrency(service.pivot.price)}</td>
                      <td className="px-4 py-2 text-zinc-900 font-medium text-right">{formatCurrency(service.pivot.price * service.pivot.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 bg-zinc-50 border border-zinc-200 border-dashed rounded-xl text-center">
              <p className="text-sm text-zinc-500">No services have been added to this booking.</p>
            </div>
          )}
        </Card>
      </div>

      <Card title="Financial Summary">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 py-3 border-b border-zinc-100">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-500">Subtotal (Rooms + Services)</span>
              <span className="text-sm font-medium text-zinc-900">{formatCurrency(booking.total_amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-500">Total Paid</span>
              <span className="text-sm font-medium text-emerald-600">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-zinc-100">
              <span className="text-sm font-bold text-zinc-900">
                {balanceDue < 0 ? 'Overpaid / Refund Due' : 'Remaining Balance'}
              </span>
              <span className={`text-lg font-bold ${balanceDue > 0 ? 'text-rose-600' : (balanceDue < 0 ? 'text-amber-600' : 'text-zinc-900')}`}>
                {balanceDue < 0 ? '-' : ''}{formatCurrency(Math.abs(balanceDue))}
              </span>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-zinc-900">Payment History</h4>
              {balanceDue > 0 && (
                <Button variant="outline" size="sm" onClick={() => setIsPaymentModalOpen(true)}>
                  <Plus className="w-3 h-3 mr-1" />
                  Log Payment
                </Button>
              )}
            </div>
            {booking.payments && booking.payments.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Date</th>
                      <th className="px-4 py-2 font-medium">Method</th>
                      <th className="px-4 py-2 font-medium">Ref</th>
                      <th className="px-4 py-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    {booking.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-2 text-zinc-600">{new Date(payment.created_at).toLocaleString()}</td>
                        <td className="px-4 py-2 text-zinc-900 capitalize">{payment.payment_method.replace('_', ' ')}</td>
                        <td className="px-4 py-2 text-zinc-500">{payment.transaction_reference || '-'}</td>
                        <td className="px-4 py-2 text-zinc-900 font-medium text-right">{formatCurrency(payment.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 italic">No payments recorded yet.</p>
            )}
          </div>
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

      <AddPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onAddPayment={(data, onSuccess) => {
          addPaymentMutation.mutate(data, {
            onSuccess: () => onSuccess()
          });
        }}
        isLoading={addPaymentMutation.isPending}
        balanceDue={balanceDue}
      />

      <AddServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onAddService={(data, onSuccess) => {
          addServiceMutation.mutate(data, {
            onSuccess: () => onSuccess()
          });
        }}
        isLoading={addServiceMutation.isPending}
      />
    </div>
  );
};

export default BookingDetailsPage;
