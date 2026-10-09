import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useHotel } from '../../context/HotelContext';
import { useCurrency } from '../../hooks/useCurrency';
import { servicesApi } from '../../api/services';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import ConfirmModal from '../../components/common/ConfirmModal';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import Select from '../../components/common/Select';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be greater than or equal to 0'),
  is_active: z.enum(['true', 'false']).transform((val) => val === 'true'),
});

const ServiceFormModal = ({ isOpen, onClose, service, activeHotelId }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      is_active: 'true'
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      if (service) {
        reset({
          name: service.name,
          description: service.description || '',
          price: service.price,
          is_active: service.is_active ? 'true' : 'false'
        });
      } else {
        reset({
          name: '',
          description: '',
          price: 0,
          is_active: 'true'
        });
      }
    }
  }, [isOpen, service, reset]);

  const createMutation = useMutation({
    mutationFn: (data) => servicesApi.createService(activeHotelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['services', activeHotelId]);
      toast.success('Service created successfully');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create service')
  });

  const updateMutation = useMutation({
    mutationFn: (data) => servicesApi.updateService(activeHotelId, service.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['services', activeHotelId]);
      toast.success('Service updated successfully');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update service')
  });

  const onSubmit = (data) => {
    if (service) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={service ? "Edit Service" : "Add New Service"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input 
          label="Service Name" 
          placeholder="e.g. Airport Shuttle"
          {...register('name')} 
          error={errors.name?.message} 
        />
        
        <Input 
          label="Description" 
          placeholder="e.g. Round trip shuttle to main airport"
          {...register('description')} 
          error={errors.description?.message} 
        />

        <div className="grid grid-cols-2 gap-4">
          <Input 
            type="number"
            step="0.01"
            label="Price" 
            {...register('price')} 
            error={errors.price?.message} 
          />

          <Select
            label="Status"
            {...register('is_active')}
            error={errors.is_active?.message}
            options={[
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ]}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {service ? 'Update Service' : 'Create Service'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const ServicesPage = () => {
  const { activeHotelId } = useHotel();
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['services', activeHotelId],
    queryFn: () => servicesApi.getServices(activeHotelId),
    enabled: !!activeHotelId,
  });

  const tableData = React.useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.data?.data)) return data.data.data;
    return [];
  }, [data]);

  const deleteMutation = useMutation({
    mutationFn: (id) => servicesApi.deleteService(activeHotelId, id),
    onSuccess: () => {
      queryClient.invalidateQueries(['services', activeHotelId]);
      toast.success('Service deleted successfully');
      setIsDeleteModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete service')
  });

  if (!activeHotelId) {
    return <EmptyState />;
  }

  const columns = [
    {
      header: 'Service Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-medium text-zinc-900">{row.name}</div>
          {row.description && <div className="text-sm text-zinc-500">{row.description}</div>}
        </div>
      )
    },
    {
      header: 'Price',
      accessor: 'price',
      render: (row) => <span className="font-medium">{formatCurrency(row.price)}</span>
    },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => {
              setEditingService(row);
              setIsFormModalOpen(true);
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => {
              setServiceToDelete(row);
              setIsDeleteModalOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="-mx-6 -mt-6 px-6 py-6 mb-6 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Services & Extras</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage additional services, amenities, and charges for this hotel.</p>
        </div>
        <Button onClick={() => {
            setEditingService(null);
            setIsFormModalOpen(true);
          }}>
          <Plus className="w-4 h-4 mr-2" /> Add Service
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-zinc-500">Loading services...</div>
      ) : (
        <DataTable 
          columns={columns}
          data={tableData}
          keyField="id"
        />
      )}

      <ServiceFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        service={editingService}
        activeHotelId={activeHotelId}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteMutation.mutate(serviceToDelete?.id)}
        title="Delete Service"
        description={`Are you sure you want to delete "${serviceToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Service"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ServicesPage;
