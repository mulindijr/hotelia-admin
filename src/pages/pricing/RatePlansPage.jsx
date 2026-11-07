import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { pricingApi } from '../../api/pricing';
import { useHotel } from '../../context/HotelContext';
import { useCurrency } from '../../hooks/useCurrency';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';

const ratePlanSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').max(50),
  description: z.string().optional(),
  modifier_type: z.enum(['percentage', 'fixed']),
  modifier_value: z.coerce.number(),
  meal_plan: z.string().optional(),
  cancellation_policy: z.string().optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
});

const emptyForm = {
  name: '', code: '', description: '', modifier_type: 'percentage', modifier_value: 0,
  meal_plan: '', cancellation_policy: '', is_active: true, is_default: false,
};

const RatePlansPage = () => {
  const { activeHotelId } = useHotel();
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['ratePlans', activeHotelId, page],
    queryFn: () => pricingApi.getRatePlans(activeHotelId, { page }),
    enabled: !!activeHotelId,
  });

  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm({
    resolver: zodResolver(ratePlanSchema),
  });

  const openForm = (item = null) => {
    setEditingItem(item);
    reset(item ? {
      name: item.name, code: item.code, description: item.description || '',
      modifier_type: item.modifier_type, modifier_value: item.modifier_value,
      meal_plan: item.meal_plan || '', cancellation_policy: item.cancellation_policy || '',
      is_active: item.is_active, is_default: item.is_default,
    } : emptyForm);
    setIsFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (form) => editingItem
      ? pricingApi.updateRatePlan(activeHotelId, editingItem.id, form)
      : pricingApi.createRatePlan(activeHotelId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratePlans', activeHotelId] });
      toast.success(editingItem ? 'Rate plan updated' : 'Rate plan created');
      setIsFormOpen(false);
    },
    onError: (err) => {
      const serverErrors = err.response?.data?.errors;
      if (err.response?.status === 422 && serverErrors) {
        Object.entries(serverErrors).forEach(([f, m]) => setError(f, { type: 'server', message: Array.isArray(m) ? m[0] : m }));
      } else {
        toast.error(err.response?.data?.message || 'Failed to save rate plan');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => pricingApi.deleteRatePlan(activeHotelId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratePlans', activeHotelId] });
      toast.success('Rate plan deleted');
      setItemToDelete(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete rate plan'),
  });

  const formatModifier = (row) => {
    const v = Number(row.modifier_value);
    if (row.modifier_type === 'percentage') return `${v > 0 ? '+' : ''}${v}%`;
    return `${v > 0 ? '+' : ''}${formatCurrency(v)}`;
  };

  const columns = [
    {
      header: 'Name',
      render: (row) => (
        <div>
          <span className="font-medium text-zinc-900">{row.name}</span>
          {row.is_default && <Badge variant="info" className="ml-2">Default</Badge>}
          <span className="block text-xs text-zinc-400 font-mono">{row.code}</span>
        </div>
      ),
    },
    { header: 'Modifier', render: formatModifier },
    { header: 'Meal Plan', render: (row) => row.meal_plan || '—' },
    { header: 'Cancellation', render: (row) => <span className="text-xs">{row.cancellation_policy || '—'}</span> },
    {
      header: 'Status',
      render: (row) => <Badge variant={row.is_active ? 'success' : 'default'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => openForm(row)} className="cursor-pointer p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md" title="Edit">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setItemToDelete(row)} className="cursor-pointer p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (!activeHotelId) return <EmptyState />;

  return (
    <div className="space-y-6">
      <div className="-mx-6 -mt-6 px-6 py-6 mb-6 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Rate Plans</h1>
          <p className="mt-1 text-sm text-zinc-500">Define sellable rate packages (e.g. Bed &amp; Breakfast, Non-Refundable) relative to base room prices.</p>
        </div>
        <Button onClick={() => openForm(null)}><Plus className="w-4 h-4 mr-2" /> Add Rate Plan</Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyStateMessage="No rate plans yet."
        pagination={{
          current_page: data?.meta?.current_page,
          from: data?.meta?.from,
          to: data?.meta?.to,
          total: data?.meta?.total,
          prev_page_url: data?.links?.prev,
          next_page_url: data?.links?.next,
          onPageChange: setPage,
        }}
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Edit Rate Plan' : 'Add Rate Plan'}
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit((d) => saveMutation.mutate(d))} isLoading={saveMutation.isPending}>Save</Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" placeholder="Bed & Breakfast" {...register('name')} error={errors.name?.message} />
            <Input label="Code" placeholder="BB" {...register('code')} error={errors.code?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Modifier Type"
              options={[
                { label: 'Percentage (%)', value: 'percentage' },
                { label: 'Fixed amount', value: 'fixed' },
              ]}
              {...register('modifier_type')}
              error={errors.modifier_type?.message}
            />
            <Input label="Modifier Value" type="number" step="0.01" {...register('modifier_value')} error={errors.modifier_value?.message} />
          </div>
          <p className="text-xs text-zinc-500 -mt-2">Use negative values for discounts (e.g. -10 for 10% off).</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Meal Plan" placeholder="Breakfast included" {...register('meal_plan')} error={errors.meal_plan?.message} />
            <Input label="Cancellation Policy" placeholder="Free until 48h before" {...register('cancellation_policy')} error={errors.cancellation_policy?.message} />
          </div>
          <Input label="Description" {...register('description')} error={errors.description?.message} />
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" {...register('is_active')} className="rounded border-zinc-300" /> Active
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" {...register('is_default')} className="rounded border-zinc-300" /> Default plan
            </label>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => deleteMutation.mutate(itemToDelete?.id)}
        title="Delete Rate Plan"
        description={`Are you sure you want to delete "${itemToDelete?.name}"?`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default RatePlansPage;

