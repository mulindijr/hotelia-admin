import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { pricingApi } from '../../api/pricing';
import { roomsApi } from '../../api/rooms';
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

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const optionalInt = z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().int().min(1).optional());

const ruleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  rate_plan_id: z.string().optional(),
  room_type_id: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  min_nights: optionalInt,
  max_nights: optionalInt,
  price_modifier_type: z.enum(['percentage', 'fixed', 'override']),
  price_modifier_value: z.coerce.number(),
  priority: z.coerce.number().int().optional(),
  is_active: z.boolean().optional(),
}).refine((d) => !d.start_date || !d.end_date || d.end_date >= d.start_date, {
  message: 'End date must be on or after start date',
  path: ['end_date'],
});

const emptyForm = {
  name: '', rate_plan_id: '', room_type_id: '', start_date: '', end_date: '',
  min_nights: '', max_nights: '', price_modifier_type: 'percentage', price_modifier_value: 0,
  priority: 0, is_active: true,
};

const PricingRulesPage = () => {
  const { activeHotelId } = useHotel();
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['pricingRules', activeHotelId, page],
    queryFn: () => pricingApi.getPricingRules(activeHotelId, { page }),
    enabled: !!activeHotelId,
  });

  const { data: ratePlansData } = useQuery({
    queryKey: ['ratePlans', activeHotelId, 'all'],
    queryFn: () => pricingApi.getRatePlans(activeHotelId, { perPage: 100 }),
    enabled: !!activeHotelId,
  });

  const { data: roomTypesData } = useQuery({
    queryKey: ['roomTypesList', activeHotelId],
    queryFn: () => roomsApi.getRoomTypes(activeHotelId, { perPage: 100 }),
    enabled: !!activeHotelId,
  });

  const ratePlans = ratePlansData?.data || [];
  const roomTypes = roomTypesData?.data || [];
  const ratePlanName = (id) => ratePlans.find((r) => r.id === id)?.name;
  const roomTypeName = (id) => roomTypes.find((r) => r.id === id)?.name;

  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm({
    resolver: zodResolver(ruleSchema),
  });

  const openForm = (item = null) => {
    setEditingItem(item);
    setSelectedDays(item?.days_of_week || []);
    reset(item ? {
      name: item.name,
      rate_plan_id: item.rate_plan_id ? String(item.rate_plan_id) : '',
      room_type_id: item.room_type_id ? String(item.room_type_id) : '',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      min_nights: item.min_nights ?? '',
      max_nights: item.max_nights ?? '',
      price_modifier_type: item.price_modifier_type,
      price_modifier_value: item.price_modifier_value,
      priority: item.priority ?? 0,
      is_active: item.is_active,
    } : emptyForm);
    setIsFormOpen(true);
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const saveMutation = useMutation({
    mutationFn: (form) => {
      const payload = {
        ...form,
        rate_plan_id: form.rate_plan_id ? Number(form.rate_plan_id) : null,
        room_type_id: form.room_type_id ? Number(form.room_type_id) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        min_nights: form.min_nights ?? null,
        max_nights: form.max_nights ?? null,
        days_of_week: selectedDays.length ? selectedDays : null,
      };
      return editingItem
        ? pricingApi.updatePricingRule(activeHotelId, editingItem.id, payload)
        : pricingApi.createPricingRule(activeHotelId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingRules', activeHotelId] });
      toast.success(editingItem ? 'Pricing rule updated' : 'Pricing rule created');
      setIsFormOpen(false);
    },
    onError: (err) => {
      const serverErrors = err.response?.data?.errors;
      if (err.response?.status === 422 && serverErrors) {
        Object.entries(serverErrors).forEach(([f, m]) => setError(f, { type: 'server', message: Array.isArray(m) ? m[0] : m }));
      } else {
        toast.error(err.response?.data?.message || 'Failed to save pricing rule');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => pricingApi.deletePricingRule(activeHotelId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingRules', activeHotelId] });
      toast.success('Pricing rule deleted');
      setItemToDelete(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete pricing rule'),
  });

  const formatModifier = (row) => {
    const v = Number(row.price_modifier_value);
    if (row.price_modifier_type === 'percentage') return `${v > 0 ? '+' : ''}${v}%`;
    if (row.price_modifier_type === 'override') return `= ${formatCurrency(v)}`;
    return `${v > 0 ? '+' : ''}${formatCurrency(v)}`;
  };

  const columns = [
    { header: 'Name', render: (row) => <span className="font-medium text-zinc-900">{row.name}</span> },
    {
      header: 'Applies To',
      render: (row) => (
        <div className="text-xs">
          <div>{row.room_type_id ? roomTypeName(row.room_type_id) || `Type #${row.room_type_id}` : 'All room types'}</div>
          <div className="text-zinc-400">{row.rate_plan_id ? ratePlanName(row.rate_plan_id) || `Plan #${row.rate_plan_id}` : 'All rate plans'}</div>
        </div>
      ),
    },
    {
      header: 'Conditions',
      render: (row) => {
        const parts = [];
        if (row.start_date || row.end_date) parts.push(`${row.start_date || '…'} → ${row.end_date || '…'}`);
        if (row.days_of_week?.length) parts.push(row.days_of_week.map((d) => d.slice(0, 3)).join(', '));
        if (row.min_nights || row.max_nights) parts.push(`${row.min_nights || 1}–${row.max_nights || '∞'} nights`);
        return <span className="text-xs text-zinc-600">{parts.length ? parts.join(' • ') : 'Always'}</span>;
      },
    },
    { header: 'Adjustment', render: formatModifier },
    { header: 'Priority', accessor: 'priority' },
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
          <h1 className="text-2xl font-bold text-zinc-900">Pricing Rules</h1>
          <p className="mt-1 text-sm text-zinc-500">Seasonal, weekday and length-of-stay price adjustments. Higher priority rules apply first.</p>
        </div>
        <Button onClick={() => openForm(null)}><Plus className="w-4 h-4 mr-2" /> Add Rule</Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyStateMessage="No pricing rules yet."
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
        title={editingItem ? 'Edit Pricing Rule' : 'Add Pricing Rule'}
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit((d) => saveMutation.mutate(d))} isLoading={saveMutation.isPending}>Save</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Rule Name" placeholder="High season weekend uplift" {...register('name')} error={errors.name?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Room Type"
              options={[{ label: 'All room types', value: '' }, ...roomTypes.map((r) => ({ label: r.name, value: String(r.id) }))]}
              {...register('room_type_id')}
              error={errors.room_type_id?.message}
            />
            <Select
              label="Rate Plan"
              options={[{ label: 'All rate plans', value: '' }, ...ratePlans.map((r) => ({ label: r.name, value: String(r.id) }))]}
              {...register('rate_plan_id')}
              error={errors.rate_plan_id?.message}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" {...register('start_date')} error={errors.start_date?.message} />
            <Input label="End Date" type="date" {...register('end_date')} error={errors.end_date?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Days of Week <span className="text-zinc-400 font-normal">(none = every day)</span></label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border capitalize ${
                    selectedDays.includes(day) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
            {errors.days_of_week && <p className="mt-1.5 text-sm text-red-600">{errors.days_of_week.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Nights" type="number" min="1" {...register('min_nights')} error={errors.min_nights?.message} />
            <Input label="Max Nights" type="number" min="1" {...register('max_nights')} error={errors.max_nights?.message} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Adjustment Type"
              options={[
                { label: 'Percentage (%)', value: 'percentage' },
                { label: 'Fixed amount', value: 'fixed' },
                { label: 'Override price', value: 'override' },
              ]}
              {...register('price_modifier_type')}
              error={errors.price_modifier_type?.message}
            />
            <Input label="Value" type="number" step="0.01" {...register('price_modifier_value')} error={errors.price_modifier_value?.message} />
            <Input label="Priority" type="number" {...register('priority')} error={errors.priority?.message} />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" {...register('is_active')} className="rounded border-zinc-300" /> Active
          </label>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => deleteMutation.mutate(itemToDelete?.id)}
        title="Delete Pricing Rule"
        description={`Are you sure you want to delete "${itemToDelete?.name}"?`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default PricingRulesPage;

