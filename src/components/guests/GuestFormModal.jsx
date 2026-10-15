import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { guestsApi } from '../../api/guests';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

const guestSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  nationality: z.string().optional().nullable(),
  national_id: z.string().optional().nullable(),
  passport_number: z.string().optional().nullable(),
});

const GuestFormModal = ({ isOpen, onClose, guest, onSuccess }) => {
  const queryClient = useQueryClient();
  const isEditing = !!guest;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(guestSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (guest) {
        reset({
          first_name: guest.first_name || '',
          last_name: guest.last_name || '',
          email: guest.email || '',
          phone: guest.phone || '',
          nationality: guest.nationality || guest.country || '',
          national_id: guest.national_id || '',
          passport_number: guest.passport_number || '',
        });
      } else {
        reset({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          nationality: '',
          national_id: '',
          passport_number: '',
        });
      }
    }
  }, [isOpen, guest, reset]);

  const mutation = useMutation({
    mutationFn: (data) => isEditing ? guestsApi.updateGuest(guest.id, data) : guestsApi.createGuest(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['guests']);
      if (guest?.id) {
        queryClient.invalidateQueries(['guest', guest.id.toString()]);
        queryClient.invalidateQueries(['guest', Number(guest.id)]);
      }
      toast.success(isEditing ? 'Guest profile updated successfully' : 'Guest created successfully');
      if (onSuccess) onSuccess(response);
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to save guest profile';
      toast.error(msg);
    }
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Guest Profile' : 'Add New Guest'}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(data => mutation.mutate(data))} isLoading={mutation.isPending}>
            {isEditing ? 'Save Changes' : 'Create Guest'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name *" {...register('first_name')} error={errors.first_name?.message} />
          <Input label="Last Name *" {...register('last_name')} error={errors.last_name?.message} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email Address *" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Phone Number *" {...register('phone')} error={errors.phone?.message} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Nationality" placeholder="e.g. Kenyan, British" {...register('nationality')} error={errors.nationality?.message} />
          <Input label="National ID" placeholder="e.g. 12345678" {...register('national_id')} error={errors.national_id?.message} />
          <Input label="Passport Number" placeholder="e.g. A1234567B" {...register('passport_number')} error={errors.passport_number?.message} />
        </div>
      </form>
    </Modal>
  );
};

export default GuestFormModal;
