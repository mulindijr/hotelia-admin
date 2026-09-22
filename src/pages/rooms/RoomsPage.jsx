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
import Select from '../../components/common/Select';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/common/Badge';

const roomSchema = z.object({
  room_number: z.string().min(1, 'Room number is required'),
  room_type_id: z.coerce.number().min(1, 'Room type is required'),
  floor: z.coerce.number().optional(),
  status: z.enum(['available', 'occupied', 'cleaning', 'maintenance']),
});

const statusColors = {
  available: 'success',
  occupied: 'warning',
  cleaning: 'info',
  maintenance: 'danger',
};

const RoomsPage = () => {
  const { activeHotelId } = useHotel();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['rooms', activeHotelId, page],
    queryFn: () => roomsApi.getRooms(activeHotelId, { page, perPage: 15, include: 'roomType' }),
    enabled: !!activeHotelId,
  });

  const { data: roomTypesData } = useQuery({
    queryKey: ['roomTypesList', activeHotelId],
    queryFn: () => roomsApi.getRoomTypes(activeHotelId, { perPage: 100 }),
    enabled: !!activeHotelId,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(roomSchema)
  });

  const openForm = (item = null) => {
    setEditingItem(item);
    if (item) {
      reset({ 
        room_number: item.room_number, 
        room_type_id: item.room_type_id,
        floor: item.floor || 1,
        status: item.status
      });
    } else {
      reset({ room_number: '', room_type_id: '', floor: 1, status: 'available' });
    }
    setIsFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (formData) => editingItem 
      ? roomsApi.updateRoom(activeHotelId, editingItem.id, formData) 
      : roomsApi.createRoom(activeHotelId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['rooms', activeHotelId]);
      setIsFormOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => roomsApi.deleteRoom(activeHotelId, id),
    onSuccess: () => {
      queryClient.invalidateQueries(['rooms', activeHotelId]);
      setIsDeleteOpen(false);
    }
  });

  const columns = [
    { header: 'Room #', accessor: 'room_number', className: 'font-medium' },
    { 
      header: 'Type', 
      render: (row) => row.roomType?.name || `Type #${row.room_type_id}` 
    },
    { header: 'Floor', accessor: 'floor' },
    { 
      header: 'Status', 
      render: (row) => (
        <Badge variant={statusColors[row.status] || 'default'}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      )
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
    return <div className="p-6 bg-white border border-zinc-200 rounded-xl">Please select an active hotel.</div>;
  }

  const roomTypeOptions = roomTypesData?.data?.map(rt => ({ label: rt.name, value: rt.id })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Rooms</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage individual physical rooms.</p>
        </div>
        <Button onClick={() => openForm(null)}><Plus className="w-4 h-4 mr-2" /> Add Room</Button>
      </div>

      <DataTable 
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
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
        title={editingItem ? 'Edit Room' : 'Add Room'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(data => saveMutation.mutate(data))} isLoading={saveMutation.isPending}>Save</Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Room Number" {...register('room_number')} error={errors.room_number?.message} />
            <Input label="Floor" type="number" {...register('floor')} error={errors.floor?.message} />
          </div>
          <Select 
            label="Room Type" 
            options={roomTypeOptions}
            {...register('room_type_id')} 
            error={errors.room_type_id?.message} 
          />
          <Select 
            label="Status" 
            options={[
              { label: 'Available', value: 'available' },
              { label: 'Occupied', value: 'occupied' },
              { label: 'Cleaning', value: 'cleaning' },
              { label: 'Maintenance', value: 'maintenance' },
            ]}
            {...register('status')} 
            error={errors.status?.message} 
          />
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(itemToDelete?.id)}
        title="Delete Room"
        description={`Are you sure you want to delete room ${itemToDelete?.room_number}?`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default RoomsPage;
