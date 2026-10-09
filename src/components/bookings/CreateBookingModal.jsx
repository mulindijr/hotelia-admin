import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserPlus, UserCheck, Calendar, CreditCard, Key } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { useCurrency } from '../../hooks/useCurrency';
import { bookingsApi } from '../../api/bookings';
import { guestsApi } from '../../api/guests';
import { roomsApi } from '../../api/rooms';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const wizardSchema = z.object({
  guestType: z.enum(['existing', 'new']),
  guest_id: z.coerce.number().optional(),
  guest: z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
  }).optional(),
  room_id: z.coerce.number().min(1, 'Please select a room'),
  check_in_date: z.string().min(1, 'Check-in date is required'),
  check_out_date: z.string().min(1, 'Check-out date is required'),
  adults: z.coerce.number().min(1, 'At least 1 adult required'),
  children: z.coerce.number().min(0).default(0),
  special_requests: z.string().optional(),
  initial_payment: z.object({
    amount: z.coerce.number().min(0).optional(),
    payment_method: z.string().optional(),
  }).optional(),
  check_in_now: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.guestType === 'existing' && !data.guest_id) {
    ctx.addIssue({ path: ['guest_id'], message: 'Please select an existing guest', code: z.ZodIssueCode.custom });
  }
  if (data.guestType === 'new') {
    if (!data.guest?.first_name) ctx.addIssue({ path: ['guest', 'first_name'], message: 'First name is required', code: z.ZodIssueCode.custom });
    if (!data.guest?.last_name) ctx.addIssue({ path: ['guest', 'last_name'], message: 'Last name is required', code: z.ZodIssueCode.custom });
  }
});

const CreateBookingModal = ({ isOpen, onClose }) => {
  const { activeHotelId } = useHotel();
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);

  const { data: guestsData, isLoading: isLoadingGuests } = useQuery({
    queryKey: ['guestsList'],
    queryFn: () => guestsApi.getGuests({ perPage: 100 }),
    enabled: isOpen && step === 1,
  });

  const { data: roomsData, isLoading: isLoadingRooms } = useQuery({
    queryKey: ['roomsList', activeHotelId],
    queryFn: () => roomsApi.getRooms(activeHotelId, { perPage: 100, filters: { status: 'available' } }),
    enabled: isOpen && !!activeHotelId,
  });

  const { register, handleSubmit, control, watch, setValue, reset, trigger, getValues, setError, clearErrors, formState: { errors } } = useForm({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      guestType: 'existing',
      adults: 1,
      children: 0,
      check_in_now: true,
      initial_payment: { amount: 0, payment_method: 'card' }
    }
  });

  const guestType = watch('guestType');

  // Reset wizard on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        reset();
      }, 300);
    } else {
      // Set default dates
      const today = new Date().toISOString().split('T')[0];
      const tmrw = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      setValue('check_in_date', today);
      setValue('check_out_date', tmrw);
    }
  }, [isOpen, reset, setValue]);

  const mutation = useMutation({
    mutationFn: (payload) => bookingsApi.createBooking(activeHotelId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings', activeHotelId]);
      queryClient.invalidateQueries(['rooms', activeHotelId]);
      queryClient.invalidateQueries(['roomsList', activeHotelId]);
      queryClient.invalidateQueries(['guestsList']);
      onClose();
    }
  });

  const guestOptions = guestsData?.data?.map(g => ({ label: `${g.first_name} ${g.last_name}`, value: g.id })) || [];
  
  // Format rooms to group by room type
  const roomOptions = roomsData?.data?.map(r => ({ 
    label: `Room ${r.room_number} (${r.room_type?.name || 'Unknown Type'})`, 
    value: r.id 
  })) || [];

  
  const selectedRoomId = watch('room_id');
  const selectedRoom = roomsData?.data?.find(r => r.id === Number(selectedRoomId));
  const checkInDate = watch('check_in_date');
  const checkOutDate = watch('check_out_date');
  const nights = checkInDate && checkOutDate ? Math.max(1, differenceInDays(new Date(checkOutDate), new Date(checkInDate))) : 1;
  const estimatedTotal = selectedRoom && selectedRoom.room_type ? selectedRoom.room_type.base_price * nights : 0;

  const handleNextStep = async () => {
    clearErrors();
    const vals = getValues();
    let isValid = true;
    
    if (step === 1) {
      if (vals.guestType === 'existing' && !vals.guest_id) {
        setError('guest_id', { type: 'manual', message: 'Please select an existing guest' });
        isValid = false;
      }
      if (vals.guestType === 'new') {
        if (!vals.guest?.first_name) {
          setError('guest.first_name', { type: 'manual', message: 'First name is required' });
          isValid = false;
        }
        if (!vals.guest?.last_name) {
          setError('guest.last_name', { type: 'manual', message: 'Last name is required' });
          isValid = false;
        }
        if (!vals.guest?.email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(vals.guest.email)) {
          setError('guest.email', { type: 'manual', message: 'Valid email is required' });
          isValid = false;
        }
      }
    } else if (step === 2) {
      isValid = await trigger(['room_id', 'check_in_date', 'check_out_date', 'adults', 'children']);
    }
    
    if (isValid) setStep(step + 1);
  };

  const onSubmit = (data) => {
    const payload = {
      check_in_date: data.check_in_date,
      check_out_date: data.check_out_date,
      adults: data.adults,
      children: data.children,
      rooms: [data.room_id],
      notes: data.special_requests,
      check_in_now: data.check_in_now,
    };

    if (data.guestType === 'existing') {
      payload.guest_id = data.guest_id;
    } else {
      payload.guest = data.guest;
    }

    if (data.initial_payment?.amount > 0) {
      payload.initial_payment = data.initial_payment;
    }

    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Walk-In & New Reservation Wizard"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex justify-between w-full">
          <Button variant="secondary" onClick={() => step > 1 ? setStep(step - 1) : onClose()}>
            {step > 1 ? 'Back' : 'Cancel'}
          </Button>
          {step < 3 ? (
            <Button onClick={handleNextStep}>Next Step</Button>
          ) : (
            <Button onClick={handleSubmit(onSubmit)} isLoading={mutation.isPending}>
              Confirm Reservation
            </Button>
          )}
        </div>
      }
    >
      <div className="mb-8 flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-zinc-100 -z-10 -translate-y-1/2"></div>
        {[
          { icon: UserCheck, label: 'Guest Details' },
          { icon: Calendar, label: 'Room & Dates' },
          { icon: Key, label: 'Check-In' }
        ].map((s, i) => (
          <div key={i} className={`flex flex-col items-center bg-white px-2 ${step > i ? 'text-zinc-900' : 'text-zinc-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white ${step > i ? 'border-zinc-900 text-zinc-900' : 'border-zinc-200 text-zinc-300'} ${step === i + 1 ? 'ring-4 ring-zinc-100' : ''}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium mt-2">{s.label}</span>
          </div>
        ))}
      </div>

      <form className="space-y-6">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex gap-4 p-1 bg-zinc-100 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => setValue('guestType', 'existing')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${guestType === 'existing' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                Existing Guest
              </button>
              <button
                type="button"
                onClick={() => setValue('guestType', 'new')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${guestType === 'new' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                Create New Guest
              </button>
            </div>

            {guestType === 'existing' ? (
              <Select 
                label="Search Existing Guest" 
                options={[{ label: 'Select Guest...', value: '' }, ...guestOptions]} 
                {...register('guest_id')} 
                error={errors.guest_id?.message}
                disabled={isLoadingGuests}
              />
            ) : (
              <div className="space-y-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name *" {...register('guest.first_name')} error={errors.guest?.first_name?.message} />
                  <Input label="Last Name *" {...register('guest.last_name')} error={errors.guest?.last_name?.message} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input type="email" label="Email Address *" {...register('guest.email')} error={errors.guest?.email?.message} />
                  <Input label="Phone Number" {...register('guest.phone')} error={errors.guest?.phone?.message} />
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <Select 
              label="Select Available Room *" 
              options={[{ label: 'Select Room...', value: '' }, ...roomOptions]} 
              {...register('room_id')} 
              error={errors.room_id?.message}
              disabled={isLoadingRooms}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input type="date" label="Check-In Date *" {...register('check_in_date')} error={errors.check_in_date?.message} />
              <Input type="date" label="Check-Out Date *" {...register('check_out_date')} error={errors.check_out_date?.message} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input type="number" label="Adults *" {...register('adults')} error={errors.adults?.message} />
              <Input type="number" label="Children" {...register('children')} error={errors.children?.message} />
            </div>
            
            <Input label="Special Requests (Optional)" {...register('special_requests')} error={errors.special_requests?.message} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            
            <div className="bg-white border border-zinc-200 p-4 rounded-xl space-y-3 mb-4">
              <h4 className="text-sm font-semibold text-zinc-900 mb-2">Booking Summary</h4>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Duration</span>
                <span className="font-medium text-zinc-900">{nights} Night{nights !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Room Rate</span>
                <span className="font-medium text-zinc-900">{selectedRoom ? formatCurrency(selectedRoom.room_type?.base_price) : '--'} / night</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold pt-3 border-t border-zinc-100">
                <span className="text-zinc-900">Estimated Total</span>
                <span className="text-indigo-600">{formatCurrency(estimatedTotal)}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-4">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900">Record Initial Payment</h4>
                  <p className="text-sm text-blue-700/80 mt-1">If the walk-in guest is paying right now, record the deposit or full amount.</p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <Input 
                      type="number" 
                      step="0.01" 
                      label="Amount Paid" 
                      {...register('initial_payment.amount')} 
                      error={errors.initial_payment?.amount?.message} 
                    />
                    <Select
                      label="Payment Method"
                      {...register('initial_payment.payment_method')}
                      options={[
                        { label: 'Credit Card', value: 'card' },
                        { label: 'Cash', value: 'cash' },
                        { label: 'Bank Transfer', value: 'bank_transfer' },
                        { label: 'Mobile Money (M-Pesa)', value: 'mpesa' },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-100 transition-colors">
              <input 
                type="checkbox" 
                {...register('check_in_now')}
                className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <div>
                <div className="text-sm font-semibold text-zinc-900">Immediate Check-In</div>
                <div className="text-sm text-zinc-500">Automatically mark this booking as "Checked In" and change the room status to "Occupied". Perfect for walk-ins holding the key.</div>
              </div>
            </label>

          </div>
        )}
      </form>
    </Modal>
  );
};

export default CreateBookingModal;
