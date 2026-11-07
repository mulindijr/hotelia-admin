import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, CheckCircle2, User, BedDouble, AlertCircle, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { paymentsApi } from '../../api/payments';
import { bookingsApi } from '../../api/bookings';
import { useHotel } from '../../context/HotelContext';
import { useCurrency } from '../../hooks/useCurrency';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const paymentSchema = z.object({
  booking_id: z.coerce.number().min(1, 'Please select a reservation'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than zero'),
  payment_method: z.enum(['mpesa', 'card', 'cash', 'bank_transfer']),
  status: z.enum(['completed', 'pending', 'failed']),
  transaction_reference: z.string().optional().nullable(),
});

const RecordPaymentModal = ({ isOpen, onClose, defaultBookingId = null }) => {
  const { activeHotelId } = useHotel();
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();

  // Fetch active bookings for selection
  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['activeBookingsForPayment', activeHotelId],
    queryFn: () => bookingsApi.getBookings(activeHotelId, { 
      perPage: 100,
    }),
    enabled: isOpen && !!activeHotelId,
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      booking_id: defaultBookingId || '',
      amount: '',
      payment_method: 'mpesa',
      status: 'completed',
      transaction_reference: '',
    }
  });

  const bookingsList = bookingsData?.data || [];
  const selectedBookingId = watch('booking_id');
  const selectedBooking = bookingsList.find(b => Number(b.id) === Number(selectedBookingId));

  // Compute balance due for the selected reservation
  const grandTotal = Number(selectedBooking?.grand_total ?? selectedBooking?.total_amount ?? 0);
  const totalPaid = selectedBooking?.payments?.filter(p => !p.status || p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
  const balanceDue = Math.max(0, grandTotal - totalPaid);

  useEffect(() => {
    if (isOpen) {
      if (defaultBookingId) {
        setValue('booking_id', Number(defaultBookingId));
      }
    } else {
      reset();
    }
  }, [isOpen, defaultBookingId, setValue, reset]);

  // When a reservation is selected, automatically pre-fill amount with remaining balance if available
  const handleBookingChange = (e) => {
    const bId = e.target.value;
    setValue('booking_id', bId ? Number(bId) : '');
    const found = bookingsList.find(b => Number(b.id) === Number(bId));
    if (found) {
      const gTot = Number(found.grand_total ?? found.total_amount ?? 0);
      const paid = found.payments?.filter(p => !p.status || p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
      const due = Math.max(0, gTot - paid);
      if (due > 0) {
        setValue('amount', due.toFixed(2));
      }
    }
  };

  const mutation = useMutation({
    mutationFn: (data) => paymentsApi.recordPayment(activeHotelId, data.booking_id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries(['payments', activeHotelId]);
      queryClient.invalidateQueries(['bookings', activeHotelId]);
      queryClient.invalidateQueries(['booking', activeHotelId, vars.booking_id?.toString()]);
      queryClient.invalidateQueries(['booking', activeHotelId, Number(vars.booking_id)]);
      toast.success(`Payment of ${formatCurrency(vars.amount)} logged successfully!`);
      reset();
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to record payment transaction';
      toast.error(msg);
    }
  });

  const onSubmit = (data) => {
    mutation.mutate({
      booking_id: Number(data.booking_id),
      amount: Number(data.amount),
      payment_method: data.payment_method,
      status: data.status,
      transaction_reference: data.transaction_reference || null,
    });
  };

  const bookingOptions = bookingsList.map((b) => {
    const guestName = b.guest ? `${b.guest.first_name} ${b.guest.last_name}` : 'Unknown Guest';
    const room = b.rooms?.[0];
    const roomDesc = room ? `Room ${room.room_number}` : 'No room';
    return {
      value: b.id,
      label: `${b.booking_reference} — ${guestName} (${roomDesc})`
    };
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      description="Log a new payment transaction against a hotel reservation."
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-zinc-500">
            {selectedBooking && (
              <span>Balance due: <strong className={balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}>{formatCurrency(balanceDue)}</strong></span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} isLoading={mutation.isPending}>
              Record Payment
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Select Reservation */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Reservation *
          </label>
          <select
            {...register('booking_id')}
            onChange={handleBookingChange}
            disabled={isLoadingBookings}
            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 ${
              errors.booking_id ? 'border-rose-400 focus:ring-rose-400' : 'border-zinc-300'
            }`}
          >
            <option value="">-- Choose a reservation --</option>
            {bookingOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.booking_id && (
            <p className="mt-1 text-xs text-rose-500">{errors.booking_id.message}</p>
          )}
        </div>

        {/* Selected Reservation Snapshot */}
        {selectedBooking && (
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                {selectedBooking.guest?.first_name} {selectedBooking.guest?.last_name}
              </span>
              <span className="text-zinc-500 font-mono font-medium">
                {selectedBooking.booking_reference}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-zinc-600">
              <div>
                <span className="text-[11px] text-zinc-400 block">Total Bill</span>
                <span className="font-medium text-zinc-900">{formatCurrency(grandTotal)}</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 block">Already Paid</span>
                <span className="font-medium text-emerald-600">{formatCurrency(totalPaid)}</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 block">Remaining Balance</span>
                <span className={`font-bold ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            </div>
            {balanceDue > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setValue('amount', balanceDue.toFixed(2))}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline"
                >
                  Fill full remaining balance ({formatCurrency(balanceDue)})
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Payment Amount *" 
            type="number" 
            step="0.01" 
            placeholder="0.00"
            {...register('amount')} 
            error={errors.amount?.message} 
          />
          <Select 
            label="Payment Method *" 
            options={[
              { label: 'Mobile Money (M-Pesa)', value: 'mpesa' },
              { label: 'Credit / Debit Card', value: 'card' },
              { label: 'Cash', value: 'cash' },
              { label: 'Bank Transfer', value: 'bank_transfer' },
            ]}
            {...register('payment_method')} 
            error={errors.payment_method?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select 
            label="Transaction Status *" 
            options={[
              { label: 'Completed', value: 'completed' },
              { label: 'Pending / In Review', value: 'pending' },
              { label: 'Failed', value: 'failed' }
            ]}
            {...register('status')} 
            error={errors.status?.message}
          />
          <Input 
            label="Transaction Ref / Code" 
            placeholder="e.g. QKH78923KL or Receipt #"
            {...register('transaction_reference')} 
            error={errors.transaction_reference?.message} 
          />
        </div>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;
