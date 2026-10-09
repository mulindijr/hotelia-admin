import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import api from '../../api/client';
import { useHotel } from '../../context/HotelContext';
import { useCurrency } from '../../hooks/useCurrency';

const serviceSchema = z.object({
  service_id: z.coerce.number().min(1, 'Please select a service'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1')
});

const AddServiceModal = ({ isOpen, onClose, onAddService, isLoading }) => {
  const { activeHotelId } = useHotel();
  const { formatCurrency } = useCurrency();

  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services', activeHotelId],
    queryFn: async () => {
      const response = await api.get(`/hotels/${activeHotelId}/services`);
      return response.data;
    },
    enabled: !!activeHotelId && isOpen
  });

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      service_id: '',
      quantity: 1
    }
  });

  const selectedServiceId = watch('service_id');
  const selectedService = servicesData?.data?.find(s => s.id === Number(selectedServiceId));
  const quantity = watch('quantity');

  const onSubmit = (data) => {
    onAddService({
      id: data.service_id,
      quantity: data.quantity
    }, () => {
      reset();
      onClose();
    });
  };

  const serviceOptions = servicesData?.data?.map(s => ({
    label: `${s.name} (${formatCurrency(s.price)})`,
    value: s.id
  })) || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Service/Extra">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {isLoadingServices ? (
          <div className="py-4 text-center text-sm text-zinc-500">Loading available services...</div>
        ) : (
          <>
            <Select
              label="Select Service"
              {...register('service_id')}
              error={errors.service_id?.message}
              options={[
                { label: '-- Select a Service --', value: '' },
                ...serviceOptions
              ]}
            />

            <Input 
              type="number" 
              min="1"
              label="Quantity" 
              {...register('quantity')} 
              error={errors.quantity?.message} 
            />

            {selectedService && (
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex justify-between items-center text-sm mt-4">
                <span className="text-zinc-600">Additional Cost:</span>
                <span className="font-bold text-zinc-900">{formatCurrency(selectedService.price * quantity)}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-100">
              <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Add Charge
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};

export default AddServiceModal;
