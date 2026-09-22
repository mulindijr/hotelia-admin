import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { guestsApi } from '../../api/guests';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import GuestFormModal from '../../components/guests/GuestFormModal';
import ConfirmModal from '../../components/common/ConfirmModal';

const GuestListPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['guests', page],
    queryFn: () => guestsApi.getGuests({ page, perPage: 15 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => guestsApi.deleteGuest(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['guests']);
      setIsDeleteOpen(false);
    }
  });

  const openForm = (guest = null) => {
    setEditingGuest(guest);
    setIsFormOpen(true);
  };

  const columns = [
    { 
      header: 'Name', 
      render: (row) => <span className="font-medium">{row.first_name} {row.last_name}</span> 
    },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Country', accessor: 'country' },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => openForm(row)} className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => { setGuestToDelete(row); setIsDeleteOpen(true); }} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md">
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
          <h1 className="text-2xl font-bold text-zinc-900">Guests CRM</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage all customer profiles and histories.</p>
        </div>
        <Button onClick={() => openForm(null)}><Plus className="w-4 h-4 mr-2" /> Add Guest</Button>
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

      <GuestFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        guest={editingGuest}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(guestToDelete?.id)}
        title="Delete Guest"
        description={`Are you sure you want to delete ${guestToDelete?.first_name} ${guestToDelete?.last_name}?`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default GuestListPage;
