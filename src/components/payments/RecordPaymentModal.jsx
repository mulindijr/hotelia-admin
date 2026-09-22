import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../../api/payments';
import { useHotel } from '../../context/HotelContext';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const paymentSchema = z.object({
  booking_id: z.coerce.number().min(1, 'Booking reference ID is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than zero'),
  payment_method: z.enum(['credit_card', 'cash', 'bank_transfer', 'mobile_money']),
  status: z.enum(['completed', 'pending', 'failed']),
  transaction_reference: z.string().optional()
});

const RecordPaymentModal = ({ isOpen, onClose }) => {
  const { activeHotelId } = useHotel();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: { status: 'completed' }
  });

  const mutation = useMutation({
    mutationFn: (data) => paymentsApi.recordPayment(activeHotelId, data.booking_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments', activeHotelId]);
      reset();
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
      title="Record Payment"
      description="Log a new payment transaction against a reservation."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={mutation.isPending}>
            Record Payment
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <Input 
          label="Booking ID" 
          type="number"
          placeholder="e.g. 1045"
          {...register('booking_id')} 
          error={errors.booking_id?.message} 
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Amount" 
            type="number" 
            step="0.01" 
            {...register('amount')} 
            error={errors.amount?.message} 
          />
          <Select 
            label="Method" 
            options={[
              { label: 'Credit Card', value: 'credit_card' },
              { label: 'Cash', value: 'cash' },
              { label: 'Bank Transfer', value: 'bank_transfer' },
              { label: 'Mobile Money', value: 'mobile_money' }
            ]}
            {...register('payment_method')} 
            error={errors.payment_method?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select 
            label="Status" 
            options={[
              { label: 'Completed', value: 'completed' },
              { label: 'Pending', value: 'pending' },
              { label: 'Failed', value: 'failed' }
            ]}
            {...register('status')} 
            error={errors.status?.message}
          />
          <Input 
            label="Transaction Ref (Optional)" 
            {...register('transaction_reference')} 
            error={errors.transaction_reference?.message} 
          />
        </div>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;
