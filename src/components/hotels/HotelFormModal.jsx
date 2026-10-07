import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelsApi } from '../../api/hotels';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

export const slugify = (text) =>
  text
    ? text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-+|-+$/g, '')
    : '';

const hotelSchema = z.object({
  name: z.string().min(1, 'Hotel name is required'),
  slug: z.string().min(1, 'Slug is required'),
  email: z.string().email('Invalid email address').or(z.literal('')).optional(),
  phone: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().min(1, 'Address is required'),
  description: z.string().optional(),
});

const HotelFormModal = ({ isOpen, onClose, hotel }) => {
  const queryClient = useQueryClient();
  const isEditing = !!hotel;

  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue,
    setError,
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(hotelSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (hotel) {
        reset({
          name: hotel.name || '',
          slug: hotel.slug || slugify(hotel.name || ''),
          email: hotel.email || '',
          phone: hotel.phone || '',
          country: hotel.country || '',
          city: hotel.city || '',
          address: hotel.address || '',
          description: hotel.description || '',
        });
      } else {
        reset({ 
          name: '', 
          slug: '',
          email: '', 
          phone: '', 
          country: '', 
          city: '', 
          address: '', 
          description: '' 
        });
      }
    }
  }, [isOpen, hotel, reset]);

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        name: data.name,
        slug: data.slug || slugify(data.name),
        country: data.country,
        city: data.city,
        address: data.address,
        ...(data.email ? { email: data.email } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.description ? { description: data.description } : {}),
      };

      if (isEditing) {
        return hotelsApi.updateHotel(hotel.id, payload);
      }
      return hotelsApi.createHotel(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] });
      onClose();
    },
    onError: (error) => {
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        Object.entries(serverErrors).forEach(([field, messages]) => {
          setError(field, {
            type: 'server',
            message: Array.isArray(messages) ? messages[0] : messages,
          });
        });
      }
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
        {mutation.isError && !Object.keys(errors).length && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {mutation.error?.response?.data?.message || 'Failed to save hotel. Please check the details and try again.'}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label="Hotel Name" 
            placeholder="e.g. Grand Hotelia Resort"
            {...register('name', {
              onChange: (e) => {
                if (!isEditing) {
                  setValue('slug', slugify(e.target.value), { shouldValidate: true });
                }
              }
            })} 
            error={errors.name?.message} 
          />
          <Input 
            label="Identifier Slug" 
            placeholder="e.g. grand-hotelia-resort"
            {...register('slug')} 
            error={errors.slug?.message} 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Email Address" type="email" placeholder="info@hotel.com" {...register('email')} error={errors.email?.message} />
          <Input label="Phone Number" placeholder="+254 700 000000" {...register('phone')} error={errors.phone?.message} />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Country" placeholder="Kenya" {...register('country')} error={errors.country?.message} />
          <Input label="City" placeholder="Nairobi" {...register('city')} error={errors.city?.message} />
        </div>

        <div>
          <Input label="Address" placeholder="e.g. 123 Safari Way" {...register('address')} error={errors.address?.message} />
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
