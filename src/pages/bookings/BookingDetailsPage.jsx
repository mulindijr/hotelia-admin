import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit2, Ban, Download, Plus, CreditCard } from 'lucide-react';
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
import InvoiceModal from '../../components/bookings/InvoiceModal';
import BookingDetailsSkeleton from '../../components/bookings/BookingDetailsSkeleton';
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
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
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

  const invoiceMutation = useMutation({
    mutationFn: async ({ emailToGuest }) => {
      if (emailToGuest) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const guestEmail = booking?.guest?.email?.trim();
        if (!guestEmail || !emailRegex.test(guestEmail)) {
          throw new Error('Guest does not have a valid email address configured.');
        }

        await bookingsApi.sendInvoiceEmail(activeHotelId, id);
      }

      const response = await bookingsApi.downloadInvoice(activeHotelId, id);
      if (response.data instanceof Blob && response.data.type === 'application/json') {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'Failed to generate PDF invoice');
      }

      downloadBlob(response.data, `invoice-${booking?.booking_reference || id}.pdf`);
      return { emailed: emailToGuest, email: booking?.guest?.email };
    },
    onSuccess: ({ emailed, email }) => {
      if (emailed) {
        toast.success(`Invoice emailed to ${email} and downloaded successfully`);
      } else {
        toast.success('Invoice downloaded successfully');
      }
      setIsInvoiceModalOpen(false);
    },
    onError: async (err) => {
      let message = 'Failed to process invoice';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) message = json.message;
        } catch (_) {}
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message) {
        message = err.message;
      }
      toast.error(message);
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

  // Show skeleton loader on initial fetch while booking data is loading
  if (isLoading && !booking) {
    return <BookingDetailsSkeleton />;
  }

  // Gracefully handle query errors with retry option
  if (isError && !booking) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-zinc-200 rounded-xl shadow-sm text-center space-y-4 animate-in fade-in duration-200">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900">Unable to Load Booking</h2>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          {error?.response?.data?.message || error?.message || 'An error occurred while fetching booking details. Please check your connection and try again.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-3">
          <Button variant="secondary" onClick={() => navigate('/bookings')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bookings
          </Button>
          <Button onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-zinc-200 rounded-xl shadow-sm text-center space-y-4 animate-in fade-in duration-200">
        <div className="w-12 h-12 bg-zinc-100 text-zinc-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900">Booking Not Found</h2>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          The booking you are looking for does not exist or may have been deleted.
        </p>
        <div className="flex items-center justify-center gap-3 pt-3">
          <Button variant="secondary" onClick={() => navigate('/bookings')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  const servicesSubtotal = booking?.services?.reduce((sum, service) => {
    const qty = Number(service.pivot?.quantity ?? 1);
    const price = Number(service.pivot?.price ?? service.price ?? 0);
    return sum + (price * qty);
  }, 0) || 0;

  const roomsSubtotal = Math.max(0, (Number(booking?.subtotal ?? booking?.total_amount) || 0) - servicesSubtotal);
  const taxRate = Number(booking?.tax_rate ?? 0);
  const taxAmount = Number(booking?.tax_amount ?? ((roomsSubtotal + servicesSubtotal) * (taxRate / 100)));
  const grandTotal = Number(booking?.grand_total ?? ((roomsSubtotal + servicesSubtotal) + taxAmount));
  const totalPaid = booking?.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const balanceDue = grandTotal - totalPaid;

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
          <Button 
            variant="secondary" 
            onClick={() => setIsInvoiceModalOpen(true)} 
            isLoading={invoiceMutation.isPending}
            disabled={invoiceMutation.isPending}
          >
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

        <Card 
          title="Services & Extras" 
          subtitle="Additional services charged to this booking"
          className="col-span-1 md:col-span-3"
          headerActions={
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsServiceModalOpen(true)}
              className="gap-1.5 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-medium shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-600" />
              Add Service
            </Button>
          }
        >
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
                <tfoot className="bg-zinc-50 border-t border-zinc-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-zinc-900 text-right">
                      Services Subtotal
                    </td>
                    <td className="px-4 py-2.5 text-sm font-bold text-zinc-900 text-right">
                      {formatCurrency(servicesSubtotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="py-8 px-4 bg-zinc-50/50 border border-zinc-200 border-dashed rounded-xl text-center flex flex-col items-center justify-center">
              <p className="text-sm text-zinc-500 mb-3">No services have been added to this booking.</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsServiceModalOpen(true)}
                className="gap-1.5 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-medium shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-zinc-600" />
                Add Service
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Card title="Financial Summary">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 py-3 border-b border-zinc-100">
            {/* 1. Rooms Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-500">Rooms Subtotal</span>
              <span className="text-sm font-medium text-zinc-900">{formatCurrency(roomsSubtotal)}</span>
            </div>

            {/* 2. Services Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-500">Services Subtotal</span>
              <span className="text-sm font-medium text-zinc-900">{formatCurrency(servicesSubtotal)}</span>
            </div>

            {/* 3. Tax */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-500">Tax ({taxRate.toFixed(1)}%)</span>
              <span className="text-sm font-medium text-zinc-900">{formatCurrency(taxAmount)}</span>
            </div>

            {/* 4. Total Booking Amount */}
            <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
              <span className="text-sm font-semibold text-zinc-900">Total Booking Amount</span>
              <span className="text-base font-bold text-zinc-900">{formatCurrency(grandTotal)}</span>
            </div>

            {/* 5. Remaining Balance */}
            <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="gap-1.5 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-medium shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5 text-zinc-600" />
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
                  <tfoot className="bg-zinc-50 border-t border-zinc-200">
                    <tr>
                      <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-zinc-900 text-right">
                        Total Paid
                      </td>
                      <td className="px-4 py-2.5 text-sm font-bold text-emerald-600 text-right">
                        {formatCurrency(totalPaid)}
                      </td>
                    </tr>
                  </tfoot>
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

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        booking={booking}
        onConfirm={({ emailToGuest }) => invoiceMutation.mutate({ emailToGuest })}
        isLoading={invoiceMutation.isPending}
      />
    </div>
  );
};

export default BookingDetailsPage;
