import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import { hotelsApi } from '../../api/hotels';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import HotelFormModal from '../../components/hotels/HotelFormModal';
import ConfirmModal from '../../components/common/ConfirmModal';

const HotelListPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['hotels', page],
    queryFn: () => hotelsApi.getHotels({ page, perPage: 15 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => hotelsApi.deleteHotel(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['hotels']);
      setIsDeleteModalOpen(false);
      setHotelToDelete(null);
    }
  });

  const handleEdit = (hotel) => {
    setEditingHotel(hotel);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (hotel) => {
    setHotelToDelete(hotel);
    setIsDeleteModalOpen(true);
  };

  const columns = [
    {
      header: 'Hotel Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.logo ? (
            <img src={row.logo} alt={row.name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-zinc-400" />
            </div>
          )}
          <div>
            <div className="font-medium text-zinc-900">{row.name}</div>
            <div className="text-xs text-zinc-500">{row.city}, {row.country}</div>
          </div>
        </div>
      )
    },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { 
      header: 'Status', 
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'default'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDeleteClick(row); }}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Hotels & Properties</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage all registered hotel properties in the system.</p>
        </div>
        <Button onClick={() => { setEditingHotel(null); setIsFormModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Hotel
        </Button>
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
          onPageChange: (newPage) => setPage(newPage)
        }}
        emptyStateMessage="No hotels found. Add your first property to get started."
      />

      <HotelFormModal 
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        hotel={editingHotel}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteMutation.mutate(hotelToDelete?.id)}
        title="Delete Hotel"
        description={`Are you sure you want to delete ${hotelToDelete?.name}? This action cannot be undone and will delete all associated data.`}
        confirmText="Delete Hotel"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default HotelListPage;
