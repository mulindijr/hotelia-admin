import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { differenceInDays, parseISO } from 'date-fns';
import { 
  CalendarRange, 
  BedDouble, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Users,
  FileText,
  DollarSign
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useHotel } from '../../context/HotelContext';
import { useCurrency } from '../../hooks/useCurrency';
import { bookingsApi } from '../../api/bookings';
import { roomsApi } from '../../api/rooms';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

const modifySchema = z.object({
  check_in_date: z.string().min(1, 'Check-in date is required'),
  check_out_date: z.string().min(1, 'Check-out date is required'),
  room_id: z.coerce.number().min(1, 'Please select an assigned room'),
  adults: z.coerce.number().min(1, 'At least 1 adult required'),
  children: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.check_in_date && data.check_out_date) {
    if (new Date(data.check_out_date) <= new Date(data.check_in_date)) {
      ctx.addIssue({
        path: ['check_out_date'],
        message: 'Check-out date must be after check-in date',
        code: z.ZodIssueCode.custom,
      });
    }
  }
});

const ModifyBookingModal = ({ isOpen, onClose, booking }) => {
  const { activeHotelId } = useHotel();
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();

  // Fetch all rooms in hotel to display for reassignment
  const { data: roomsData, isLoading: isLoadingRooms } = useQuery({
    queryKey: ['roomsList', activeHotelId],
    queryFn: () => roomsApi.getRooms(activeHotelId, { perPage: 100 }),
    enabled: isOpen && !!activeHotelId,
  });

  const currentRoom = booking?.rooms?.[0];
  const currentRoomId = currentRoom?.id ? Number(currentRoom.id) : undefined;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(modifySchema),
    defaultValues: {
      check_in_date: '',
      check_out_date: '',
      room_id: currentRoomId,
      adults: booking?.adults || 1,
      children: booking?.children || 0,
      notes: booking?.notes || '',
    }
  });

  useEffect(() => {
    if (isOpen && booking) {
      reset({
        check_in_date: booking.check_in_date ? booking.check_in_date.split('T')[0] : '',
        check_out_date: booking.check_out_date ? booking.check_out_date.split('T')[0] : '',
        room_id: currentRoomId || '',
        adults: booking.adults || 1,
        children: booking.children || 0,
        notes: booking.notes || '',
      });
    }
  }, [isOpen, booking, currentRoomId, reset]);

  const selectedRoomId = watch('room_id');
  const checkInDate = watch('check_in_date');
  const checkOutDate = watch('check_out_date');

  const allRooms = roomsData?.data || [];
  const selectedRoom = allRooms.find(r => Number(r.id) === Number(selectedRoomId)) || currentRoom;

  // Calculate nights and estimated room charge
  const nights = checkInDate && checkOutDate 
    ? Math.max(1, differenceInDays(parseISO(checkOutDate), parseISO(checkInDate))) 
    : 1;

  const roomNightlyPrice = selectedRoom?.room_type?.base_price 
    || selectedRoom?.pivot?.price_per_night 
    || 0;
  const estimatedRoomTotal = roomNightlyPrice * nights;

  const isRoomChanged = selectedRoomId && Number(selectedRoomId) !== currentRoomId;
  const isDatesChanged = 
    (booking?.check_in_date && checkInDate !== booking.check_in_date.split('T')[0]) ||
    (booking?.check_out_date && checkOutDate !== booking.check_out_date.split('T')[0]);

  const updateMutation = useMutation({
    mutationFn: (payload) => bookingsApi.patchBooking(activeHotelId, booking.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['booking', activeHotelId, booking.id?.toString()]);
      queryClient.invalidateQueries(['booking', activeHotelId, Number(booking.id)]);
      queryClient.invalidateQueries(['bookings', activeHotelId]);
      queryClient.invalidateQueries(['rooms', activeHotelId]);
      queryClient.invalidateQueries(['roomsList', activeHotelId]);
      toast.success(
        isRoomChanged 
          ? `Room reassigned to #${selectedRoom?.room_number || ''} successfully!` 
          : 'Stay details updated successfully!'
      );
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.response?.data?.errors?.rooms?.[0] || 'Failed to update reservation';
      toast.error(msg);
    }
  });

  const onSubmit = (data) => {
    const payload = {
      check_in_date: data.check_in_date,
      check_out_date: data.check_out_date,
      adults: Number(data.adults),
      children: Number(data.children),
      rooms: [Number(data.room_id)],
      notes: data.notes || null,
    };
    updateMutation.mutate(payload);
  };

  if (!booking) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modify Stay & Reassign Room"
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-zinc-500">
            {booking.booking_reference && (
              <span>Ref: <strong className="text-zinc-800">{booking.booking_reference}</strong></span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit(onSubmit)} 
              isLoading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Overbooking Alert Banner if booking has conflict */}
        {booking.is_overbooked && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-semibold text-amber-900">Overbooked Reservation</p>
              <p className="mt-0.5">
                This booking currently has a room conflict. Selecting an available room below will automatically resolve the overbooking status.
              </p>
            </div>
          </div>
        )}

        {/* Current Stay Snapshot */}
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 text-zinc-400" />
              Current Room Assignment
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-200 text-zinc-700 capitalize">
              {booking.status?.replace('_', ' ')}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-base font-bold text-zinc-900">
                {currentRoom ? `Room ${currentRoom.room_number}` : 'No Room Assigned'}
              </p>
              <p className="text-xs text-zinc-500">
                {currentRoom?.room_type?.name || 'Standard'} • Floor {currentRoom?.floor || 1}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm font-semibold text-zinc-900">
                {formatCurrency(roomNightlyPrice)} <span className="text-xs font-normal text-zinc-500">/ night</span>
              </p>
              <p className="text-xs text-zinc-500">
                {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : ''} → {booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Stay Dates Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
            <CalendarRange className="w-4 h-4 text-zinc-400" />
            Stay Dates & Duration
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Check-In Date *"
              {...register('check_in_date')}
              error={errors.check_in_date?.message}
            />
            <Input
              type="date"
              label="Check-Out Date *"
              {...register('check_out_date')}
              error={errors.check_out_date?.message}
            />
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 rounded-lg text-xs text-zinc-600 border border-zinc-200/60">
            <span>Duration: <strong>{nights} {nights === 1 ? 'night' : 'nights'}</strong></span>
            {isDatesChanged && (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Stay dates modified
              </span>
            )}
          </div>
        </div>

        {/* Room Reassignment Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
            <BedDouble className="w-4 h-4 text-zinc-400" />
            Reassign Room
          </h4>
          
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Select Room *
            </label>
            <select
              {...register('room_id')}
              disabled={isLoadingRooms}
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 ${
                errors.room_id ? 'border-rose-400 focus:ring-rose-400' : 'border-zinc-300'
              }`}
            >
              <option value="">-- Choose a room --</option>
              {allRooms.map((r) => {
                const isCurrent = Number(r.id) === currentRoomId;
                const typeName = r.room_type?.name || 'Room';
                const price = formatCurrency(r.room_type?.base_price || 0);
                const statusLabel = isCurrent ? '(Currently Assigned)' : r.status ? `[${r.status.toUpperCase()}]` : '';

                return (
                  <option key={r.id} value={r.id}>
                    Room {r.room_number} - {typeName} ({price}/night, Floor {r.floor || 1}) {statusLabel}
                  </option>
                );
              })}
            </select>
            {errors.room_id && (
              <p className="mt-1 text-xs text-rose-500">{errors.room_id.message}</p>
            )}
          </div>

          {isRoomChanged && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Reassignment Target Selected</p>
                <p className="text-emerald-700 mt-0.5">
                  Guest will be moved from <strong>Room {currentRoom?.room_number || 'N/A'}</strong> to <strong>Room {selectedRoom?.room_number} ({selectedRoom?.room_type?.name})</strong> upon saving.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Occupancy & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="number"
            min="1"
            label="Adults *"
            {...register('adults')}
            error={errors.adults?.message}
          />
          <Input
            type="number"
            min="0"
            label="Children"
            {...register('children')}
            error={errors.children?.message}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Special Requests / Notes
          </label>
          <textarea
            rows="3"
            {...register('notes')}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="Add any guest preferences, late checkout notes, or reasons for room change..."
          />
        </div>

        {/* Pricing Impact Summary */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Room Base Rate</span>
            <span>{formatCurrency(roomNightlyPrice)} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-bold text-zinc-900 border-t border-zinc-200 pt-2">
            <span>Estimated Room Total</span>
            <span className="text-emerald-600">{formatCurrency(estimatedRoomTotal)}</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            * Final invoice charges and taxes will update automatically upon saving.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default ModifyBookingModal;
