import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { roomsApi } from '../../api/rooms';
import { useHotel } from '../../context/HotelContext';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';

const amenitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const AmenitiesPage = () => {
  const { activeHotelId } = useHotel();
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
    queryKey: ['amenities', activeHotelId, page, perPage, search],
    queryFn: () => roomsApi.getAmenities(activeHotelId, { 
      page, 
      perPage,
      filters: search ? { name: search } : undefined
    }),
    enabled: !!activeHotelId,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(amenitySchema)
  });

  const openForm = (item = null) => {
    setEditingItem(item);
    if (item) {
      reset({ name: item.name, description: item.description || '' });
    } else {
      reset({ name: '', description: '' });
    }
    setIsFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (formData) => editingItem 
      ? roomsApi.updateAmenity(activeHotelId, editingItem.id, formData) 
      : roomsApi.createAmenity(activeHotelId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['amenities', activeHotelId]);
      setIsFormOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => roomsApi.deleteAmenity(activeHotelId, id),
    onSuccess: () => {
      queryClient.invalidateQueries(['amenities', activeHotelId]);
      setIsDeleteOpen(false);
    }
  });

  const columns = [
    { header: 'Name', accessor: 'name', className: 'font-medium' },
    { header: 'Description', accessor: 'description' },
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
          <h1 className="text-2xl font-bold text-zinc-900">Amenities</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage property and room amenities.</p>
        </div>
        <Button onClick={() => openForm(null)}><Plus className="w-4 h-4 mr-2" /> Add Amenity</Button>
      </div>

      <DataTable 
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        searchPlaceholder="Search amenities..."
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
        title={editingItem ? 'Edit Amenity' : 'Add Amenity'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(data => saveMutation.mutate(data))} isLoading={saveMutation.isPending}>
              Save
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Name" {...register('name')} error={errors.name?.message} />
          <Input label="Description" {...register('description')} error={errors.description?.message} />
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(itemToDelete?.id)}
        title="Delete Amenity"
        description={`Are you sure you want to delete ${itemToDelete?.name}?`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AmenitiesPage;
