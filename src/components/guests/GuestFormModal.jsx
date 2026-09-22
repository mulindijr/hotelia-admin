import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guestsApi } from '../../api/guests';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

const guestSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  passport_number: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  address: z.string().optional(),
});

const GuestFormModal = ({ isOpen, onClose, guest }) => {
  const queryClient = useQueryClient();
  const isEditing = !!guest;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(guestSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (guest) {
        reset({
          first_name: guest.first_name,
          last_name: guest.last_name,
          email: guest.email,
          phone: guest.phone,
          passport_number: guest.passport_number || '',
          country: guest.country || '',
          address: guest.address || '',
        });
      } else {
        reset({ first_name: '', last_name: '', email: '', phone: '', passport_number: '', country: '', address: '' });
      }
    }
  }, [isOpen, guest, reset]);

  const mutation = useMutation({
    mutationFn: (data) => isEditing ? guestsApi.updateGuest(guest.id, data) : guestsApi.createGuest(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['guests']);
      onClose();
    }
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Guest' : 'Add New Guest'}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit(data => mutation.mutate(data))} isLoading={mutation.isPending}>
            {isEditing ? 'Save Changes' : 'Create Guest'}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" {...register('first_name')} error={errors.first_name?.message} />
          <Input label="Last Name" {...register('last_name')} error={errors.last_name?.message} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Passport / ID Number" {...register('passport_number')} error={errors.passport_number?.message} />
          <Input label="Country" {...register('country')} error={errors.country?.message} />
        </div>
        <Input label="Address" {...register('address')} error={errors.address?.message} />
      </form>
    </Modal>
  );
};

export default GuestFormModal;
