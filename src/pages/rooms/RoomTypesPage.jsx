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
import RoomTypeGalleryModal from '../../components/rooms/RoomTypeGalleryModal';
import { Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const roomTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  beds: z.coerce.number().min(1, 'Beds must be at least 1'),
  base_price: z.coerce.number().min(0, 'Price cannot be negative'),
});

const RoomTypesPage = () => {
  const { activeHotelId } = useHotel();
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeGalleryRoomType, setActiveGalleryRoomType] = useState(null);
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

  const { data: amenitiesData } = useQuery({
    queryKey: ['amenities', 'all'],
    queryFn: () => roomsApi.getAmenities({ perPage: 100 }),
    enabled: !!activeHotelId,
  });
  const allAmenities = amenitiesData?.data || [];
  const [selectedAmenityIds, setSelectedAmenityIds] = useState([]);

  const toggleAmenity = (id) => {
    setSelectedAmenityIds(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(roomTypeSchema)
  });

  const openForm = (item = null) => {
    setEditingItem(item);
    setSelectedAmenityIds(item?.amenities?.map(a => a.id) || []);
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
    mutationFn: (formData) => {
      const payload = { ...formData, amenity_ids: selectedAmenityIds };
      return editingItem 
        ? roomsApi.updateRoomType(activeHotelId, editingItem.id, payload) 
        : roomsApi.createRoomType(activeHotelId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomTypes', activeHotelId] });
      toast.success(editingItem ? 'Room type updated' : 'Room type created');
      setIsFormOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save room type'),
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
      header: 'Amenities',
      render: (row) => {
        const list = row.amenities || [];
        if (!list.length) return <span className="text-xs text-zinc-400">—</span>;
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {list.slice(0, 3).map(a => (
              <span key={a.id} className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px]">{a.name}</span>
            ))}
            {list.length > 3 && <span className="text-[11px] text-zinc-500">+{list.length - 3}</span>}
          </div>
        );
      }
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
          <button onClick={() => { setActiveGalleryRoomType(row); setIsGalleryOpen(true); }} className="cursor-pointer p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Gallery">
            <ImageIcon className="w-4 h-4" />
          </button>
          <button onClick={() => { setItemToDelete(row); setIsDeleteOpen(true); }} className="cursor-pointer p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md">
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
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Amenities</label>
            {allAmenities.length === 0 ? (
              <p className="text-xs text-zinc-500">No amenities defined yet. Add some on the Amenities tab.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-zinc-200 rounded-lg p-2">
                {allAmenities.map(a => (
                  <label key={a.id} className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAmenityIds.includes(a.id)}
                      onChange={() => toggleAmenity(a.id)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                    />
                    {a.name}
                  </label>
                ))}
              </div>
            )}
          </div>
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
      
      <RoomTypeGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => { setIsGalleryOpen(false); setActiveGalleryRoomType(null); }}
        roomType={activeGalleryRoomType}
      />

    </div>
  );
};

export default RoomTypesPage;
