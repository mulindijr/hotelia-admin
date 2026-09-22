import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelsApi } from '../../api/hotels';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

const hotelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().min(1, 'Address is required'),
  description: z.string().optional(),
});

const HotelFormModal = ({ isOpen, onClose, hotel }) => {
  const queryClient = useQueryClient();
  const isEditing = !!hotel;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(hotelSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (hotel) {
        reset({
          name: hotel.name || '',
          email: hotel.email || '',
          phone: hotel.phone || '',
          country: hotel.country || '',
          city: hotel.city || '',
          address: hotel.address || '',
          description: hotel.description || '',
        });
      } else {
        reset({ name: '', email: '', phone: '', country: '', city: '', address: '', description: '' });
      }
    }
  }, [isOpen, hotel, reset]);

  const mutation = useMutation({
    mutationFn: (data) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      });
      // Optionally handle logo upload if we had a file input
      // const fileInput = document.querySelector('#logo');
      // if (fileInput?.files?.[0]) formData.append('logo', fileInput.files[0]);

      if (isEditing) {
        return hotelsApi.updateHotel(hotel.id, formData);
      }
      return hotelsApi.createHotel(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['hotels']);
      onClose();
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Hotel' : 'Add New Hotel'}
      description={isEditing ? 'Update the details for this property.' : 'Register a new property in the system.'}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={mutation.isPending}>
            {isEditing ? 'Save Changes' : 'Create Hotel'}
          </Button>
        </>
      }
    >
      <form id="hotel-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Hotel Name" {...register('name')} error={errors.name?.message} />
          <Input label="Email Address" type="email" {...register('email')} error={errors.email?.message} />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Phone Number" {...register('phone')} error={errors.phone?.message} />
          <Input label="Country" {...register('country')} error={errors.country?.message} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="City" {...register('city')} error={errors.city?.message} />
          <Input label="Address" {...register('address')} error={errors.address?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Description</label>
          <textarea
            {...register('description')}
            className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all min-h-[100px] ${errors.description ? 'border-red-300 focus:ring-red-500' : 'border-zinc-200'}`}
            placeholder="A brief description of the property..."
          ></textarea>
          {errors.description && <p className="mt-1.5 text-sm text-red-600">{errors.description.message}</p>}
        </div>
      </form>
    </Modal>
  );
};

export default HotelFormModal;
