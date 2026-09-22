import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { hotelsApi } from '../../api/hotels';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const settingsSchema = z.object({
  currency: z.string().min(1, 'Currency code is required'),
  check_in_time: z.string().min(1, 'Check-in time is required'),
  check_out_time: z.string().min(1, 'Check-out time is required'),
  tax_rate: z.coerce.number().min(0, 'Tax rate cannot be negative'),
  cancellation_grace_period_hours: z.coerce.number().min(0, 'Grace period cannot be negative'),
});

const HotelSettingsPage = () => {
  const { activeHotelId, activeHotel } = useHotel();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['hotelSettings', activeHotelId],
    queryFn: () => hotelsApi.getSettings(activeHotelId),
    enabled: !!activeHotelId,
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    if (data?.data) {
      reset({
        currency: data.data.currency || 'USD',
        check_in_time: data.data.check_in_time || '14:00',
        check_out_time: data.data.check_out_time || '11:00',
        tax_rate: data.data.tax_rate || 0,
        cancellation_grace_period_hours: data.data.cancellation_grace_period_hours || 24,
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (formData) => hotelsApi.updateSettings(activeHotelId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['hotelSettings', activeHotelId]);
    }
  });

  if (!activeHotelId) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed border-zinc-200 rounded-xl">
        <p className="text-zinc-500">Please select an active hotel to manage settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Hotel Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Configure global preferences and policies for {activeHotel?.name}.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white border border-zinc-200 rounded-xl">
          <p className="text-zinc-500">Loading settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(data => mutation.mutate(data))}>
          <Card 
            title="General Policies" 
            subtitle="Configure standard operating times and financial defaults"
            className="mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Input 
                  label="Check-In Time" 
                  type="time" 
                  {...register('check_in_time')} 
                  error={errors.check_in_time?.message} 
                />
                <Input 
                  label="Check-Out Time" 
                  type="time" 
                  {...register('check_out_time')} 
                  error={errors.check_out_time?.message} 
                />
              </div>

              <div className="space-y-6">
                <Input 
                  label="Default Currency (ISO Code)" 
                  placeholder="e.g. USD, KES, EUR"
                  {...register('currency')} 
                  error={errors.currency?.message} 
                />
                <Input 
                  label="Standard Tax Rate (%)" 
                  type="number" 
                  step="0.01"
                  {...register('tax_rate')} 
                  error={errors.tax_rate?.message} 
                />
              </div>

              <div className="md:col-span-2">
                <Input 
                  label="Cancellation Grace Period (Hours)" 
                  type="number" 
                  {...register('cancellation_grace_period_hours')} 
                  error={errors.cancellation_grace_period_hours?.message} 
                />
                <p className="mt-2 text-xs text-zinc-500">
                  Number of hours before check-in when cancellations are allowed without penalty.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              isLoading={mutation.isPending}
              disabled={!isDirty || mutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default HotelSettingsPage;
