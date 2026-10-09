import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import { useCurrency } from '../../hooks/useCurrency';

const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'mpesa'], {
    required_error: 'Payment method is required',
  }),
  transaction_reference: z.string().optional(),
});

const AddPaymentModal = ({ isOpen, onClose, onAddPayment, isLoading, balanceDue }) => {
  const { formatCurrency } = useCurrency();
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: balanceDue > 0 ? balanceDue : 0,
      payment_method: 'card',
      transaction_reference: ''
    }
  });

  // Reset form when modal opens or balance changes
  React.useEffect(() => {
    if (isOpen) {
      setValue('amount', balanceDue > 0 ? balanceDue : 0);
    }
  }, [isOpen, balanceDue, setValue]);

  const onSubmit = (data) => {
    onAddPayment(data, () => {
      reset();
      onClose();
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Payment">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {balanceDue > 0 && (
          <div className="p-3 bg-zinc-50 rounded-lg text-sm mb-4">
            <span className="text-zinc-600">Remaining Balance: </span>
            <span className="font-bold text-zinc-900">{formatCurrency(balanceDue)}</span>
          </div>
        )}
        
        <Input 
          type="number" 
          step="0.01" 
          label="Amount" 
          {...register('amount')} 
          error={errors.amount?.message} 
        />
        
        <Select
          label="Payment Method"
          {...register('payment_method')}
          error={errors.payment_method?.message}
          options={[
            { label: 'Credit/Debit Card', value: 'card' },
            { label: 'Cash', value: 'cash' },
            { label: 'Bank Transfer', value: 'bank_transfer' },
            { label: 'Mobile Money (M-Pesa)', value: 'mpesa' },
          ]}
        />
        
        <Input 
          label="Transaction Reference (Optional)" 
          placeholder="e.g. Receipt # or Check #"
          {...register('transaction_reference')} 
          error={errors.transaction_reference?.message} 
        />

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Submit Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddPaymentModal;
