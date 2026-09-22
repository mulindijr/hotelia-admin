import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useHotel } from '../../context/HotelContext';
import { bookingsApi } from '../../api/bookings';
import { guestsApi } from '../../api/guests';
import { roomsApi } from '../../api/rooms';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const bookingSchema = z.object({
  guest_id: z.coerce.number().min(1, 'Please select a guest'),
  room_id: z.coerce.number().min(1, 'Please select a room'),
  check_in_date: z.string().min(1, 'Check-in date is required'),
  check_out_date: z.string().min(1, 'Check-out date is required'),
  adults: z.coerce.number().min(1, 'At least 1 adult required'),
  children: z.coerce.number().min(0).default(0),
  special_requests: z.string().optional()
});

const CreateBookingModal = ({ isOpen, onClose }) => {
  const { activeHotelId } = useHotel();
  const queryClient = useQueryClient();

  const { data: guestsData, isLoading: isLoadingGuests } = useQuery({
    queryKey: ['guestsList'],
    queryFn: () => guestsApi.getGuests({ perPage: 100 }),
    enabled: isOpen,
  });

  const { data: roomsData, isLoading: isLoadingRooms } = useQuery({
    queryKey: ['roomsList', activeHotelId],
    queryFn: () => roomsApi.getRooms(activeHotelId, { perPage: 100, filter: { status: 'available' } }),
    enabled: isOpen && !!activeHotelId,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      adults: 1,
      children: 0
    }
  });

  const mutation = useMutation({
    mutationFn: (data) => bookingsApi.createBooking(activeHotelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings', activeHotelId]);
      reset();
      onClose();
    }
  });

  const guestOptions = guestsData?.data?.map(g => ({ label: `${g.first_name} ${g.last_name}`, value: g.id })) || [];
  const roomOptions = roomsData?.data?.map(r => ({ label: `Room ${r.room_number}`, value: r.id })) || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Reservation"
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit(data => mutation.mutate(data))} isLoading={mutation.isPending}>
            Confirm Booking
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select 
            label="Guest" 
            options={[{ label: 'Select Guest', value: '' }, ...guestOptions]} 
            {...register('guest_id')} 
            error={errors.guest_id?.message}
            disabled={isLoadingGuests}
          />
          <Select 
            label="Room (Available)" 
            options={[{ label: 'Select Room', value: '' }, ...roomOptions]} 
            {...register('room_id')} 
            error={errors.room_id?.message}
            disabled={isLoadingRooms}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input type="date" label="Check-In Date" {...register('check_in_date')} error={errors.check_in_date?.message} />
          <Input type="date" label="Check-Out Date" {...register('check_out_date')} error={errors.check_out_date?.message} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input type="number" label="Adults" {...register('adults')} error={errors.adults?.message} />
          <Input type="number" label="Children" {...register('children')} error={errors.children?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Special Requests</label>
          <textarea
            {...register('special_requests')}
            className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all min-h-[80px] ${errors.special_requests ? 'border-red-300 focus:ring-red-500' : 'border-zinc-200'}`}
          ></textarea>
        </div>
      </form>
    </Modal>
  );
};

export default CreateBookingModal;
