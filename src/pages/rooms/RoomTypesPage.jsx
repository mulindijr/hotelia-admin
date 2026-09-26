import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { roomsApi } from '../../api/rooms';
import { useHotel } from '../../context/HotelContext';
import { useCurrency } from '../../hooks/useCurrency';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';

const roomTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  beds: z.coerce.number().min(1, 'Beds must be at least 1'),
  base_price: z.coerce.number().min(0, 'Price cannot be negative'),
  // amenity_ids: z.array(z.number()).optional(), // Handled separately or as part of form
});

const RoomTypesPage = () => {
  const { activeHotelId } = useHotel();
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['roomTypes', activeHotelId, page, perPage, search],
    queryFn: () => roomsApi.getRoomTypes(activeHotelId, { 
      page, 
      perPage,
      filters: search ? { name: search } : undefined
    }),
    enabled: !!activeHotelId,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(roomTypeSchema)
  });

  const openForm = (item = null) => {
    setEditingItem(item);
    if (item) {
      reset({ 
        name: item.name, 
        description: item.description || '',
        capacity: item.capacity,
        beds: item.beds,
        base_price: item.base_price
      });
    } else {
      reset({ name: '', description: '', capacity: 2, beds: 1, base_price: 100 });
    }
    setIsFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (formData) => editingItem 
      ? roomsApi.updateRoomType(activeHotelId, editingItem.id, formData) 
      : roomsApi.createRoomType(activeHotelId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['roomTypes', activeHotelId]);
      setIsFormOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => roomsApi.deleteRoomType(activeHotelId, id),
    onSuccess: () => {
      queryClient.invalidateQueries(['roomTypes', activeHotelId]);
      setIsDeleteOpen(false);
    }
  });

  const columns = [
    { header: 'Name', accessor: 'name', className: 'font-medium' },
    { header: 'Capacity', accessor: 'capacity' },
    { header: 'Beds', accessor: 'beds' },
    { 
      header: 'Base Price', 
      render: (row) => formatCurrency(row.base_price)
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => openForm(row)} className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => { setItemToDelete(row); setIsDeleteOpen(true); }} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (!activeHotelId) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <div className="-mx-6 -mt-6 px-6 py-6 mb-6 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Room Types</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage categories and base pricing.</p>
        </div>
        <Button onClick={() => openForm(null)}>
          <Plus className="w-4 h-4 mr-2" /> 
          Add Room Type
        </Button>
      </div>

      <DataTable 
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        searchPlaceholder="Search room types..."
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        perPage={perPage}
        onPerPageChange={(val) => { setPerPage(val); setPage(1); }}
        enableSelection={true}
        selectedRowIds={selectedRows}
        onSelectionChange={setSelectedRows}
        pagination={{
          current_page: data?.meta?.current_page,
          from: data?.meta?.from,
          to: data?.meta?.to,
          total: data?.meta?.total,
          prev_page_url: data?.links?.prev,
          next_page_url: data?.links?.next,
          onPageChange: setPage
        }}
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Edit Room Type' : 'Add Room Type'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(data => saveMutation.mutate(data))} isLoading={saveMutation.isPending}>Save</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Name" {...register('name')} error={errors.name?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Capacity" type="number" {...register('capacity')} error={errors.capacity?.message} />
            <Input label="Beds" type="number" {...register('beds')} error={errors.beds?.message} />
          </div>
          <Input label="Base Price" type="number" step="0.01" {...register('base_price')} error={errors.base_price?.message} />
          <Input label="Description" {...register('description')} error={errors.description?.message} />
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(itemToDelete?.id)}
        title="Delete Room Type"
        description={`Are you sure you want to delete ${itemToDelete?.name}?`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default RoomTypesPage;
