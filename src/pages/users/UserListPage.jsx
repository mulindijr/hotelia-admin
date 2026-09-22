import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { usersApi } from '../../api/users';
import { useHotel } from '../../context/HotelContext';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmModal from '../../components/common/ConfirmModal';
import UserFormModal from '../../components/users/UserFormModal';

const UserListPage = () => {
  const { activeHotelId } = useHotel();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', activeHotelId, page],
    queryFn: () => usersApi.getUsers(activeHotelId, { page, perPage: 15 }),
    enabled: !!activeHotelId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersApi.deleteUser(activeHotelId, id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users', activeHotelId]);
      setIsDeleteOpen(false);
    }
  });

  const openForm = (user = null) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const columns = [
    { 
      header: 'Name', 
      render: (row) => <span className="font-medium">{row.first_name} {row.last_name}</span> 
    },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Role', 
      render: (row) => <Badge variant="info">{row.role?.name || 'Staff'}</Badge> 
    },
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
          <button onClick={() => openForm(row)} className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => { setUserToDelete(row); setIsDeleteOpen(true); }} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (!activeHotelId) {
    return <div className="p-6 bg-white border border-zinc-200 rounded-xl">Please select an active hotel.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Staff & Users</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage system access and roles for this property.</p>
        </div>
        <Button onClick={() => openForm(null)}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
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
          onPageChange: setPage
        }}
      />

      <UserFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        user={editingUser}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(userToDelete?.id)}
        title="Remove User"
        description={`Are you sure you want to remove ${userToDelete?.first_name} ${userToDelete?.last_name}'s access?`}
        confirmText="Remove"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default UserListPage;
