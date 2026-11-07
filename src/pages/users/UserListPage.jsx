import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../../api/users';
import { useHotel } from '../../context/HotelContext';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmModal from '../../components/common/ConfirmModal';
import UserFormModal from '../../components/users/UserFormModal';
import EmptyState from '../../components/common/EmptyState';

const formatRoleLabel = (name) =>
  name
    ? name
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Staff';

const getUserRoleName = (row) => {
  if (Array.isArray(row.roles) && row.roles.length > 0) {
    return typeof row.roles[0] === 'string' ? row.roles[0] : row.roles[0]?.name;
  }
  if (row.role?.name) return row.role.name;
  if (typeof row.role === 'string') return row.role;
  return '';
};

const UserListPage = () => {
  const { activeHotelId } = useHotel();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', activeHotelId, page, perPage, search],
    queryFn: () => usersApi.getUsers(activeHotelId, { 
      page, 
      perPage,
      filters: {
        email: search || undefined,
      }
    }),
    enabled: !!activeHotelId,
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles', activeHotelId],
    queryFn: () => usersApi.getRoles(activeHotelId),
    enabled: !!activeHotelId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersApi.deleteUser(activeHotelId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', activeHotelId] });
      toast.success('Staff member removed');
      setIsDeleteOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to remove staff member');
    }
  });

  const unlockMutation = useMutation({
    mutationFn: (id) => usersApi.unlockUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', activeHotelId] });
      toast.success('User account unlocked successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to unlock user account');
    }
  });

  const openForm = (user = null) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const rawUsers = data?.data || [];
  const filteredUsers = roleFilter
    ? rawUsers.filter((u) => getUserRoleName(u) === roleFilter)
    : rawUsers;

  const columns = [
    { 
      header: 'Name', 
      render: (row) => (
        <div>
          <span className="font-medium text-zinc-900">{row.first_name} {row.last_name}</span>
          {row.phone && <span className="block text-xs text-zinc-400">{row.phone}</span>}
        </div>
      )
    },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Role', 
      render: (row) => {
        const roleName = getUserRoleName(row);
        return <Badge variant="info">{formatRoleLabel(roleName)}</Badge>;
      }
    },
    { 
      header: 'Status', 
      render: (row) => {
        const isLocked = row.locked_until && new Date(row.locked_until) > new Date();
        return (
          <div className="flex items-center gap-1.5">
            <Badge variant={row.is_active ? 'success' : 'default'}>
              {row.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {isLocked && <Badge variant="danger">Locked</Badge>}
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
          <button
            onClick={() => unlockMutation.mutate(row.id)}
            disabled={unlockMutation.isPending}
            title="Unlock Account"
            className="cursor-pointer p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-md"
          >
            <Unlock className="w-4 h-4" />
          </button>
          <button onClick={() => openForm(row)} className="cursor-pointer p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md" title="Edit User">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => { setUserToDelete(row); setIsDeleteOpen(true); }} className="cursor-pointer p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md" title="Remove User">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (!activeHotelId) {
    return <EmptyState />;
  }

  const roleOptions = rolesData?.data?.map(r => ({ label: formatRoleLabel(r.name), value: r.name })) || [
    { label: 'Hotel Manager', value: 'hotel_manager' },
    { label: 'Receptionist', value: 'receptionist' },
    { label: 'Housekeeper', value: 'housekeeper' },
    { label: 'Accountant', value: 'accountant' },
  ];

  const filterControls = (
    <select
      value={roleFilter}
      onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
      className="block w-full sm:w-auto py-2 px-3 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
    >
      <option value="">All Roles</option>
      {roleOptions.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );

  return (
    <div className="space-y-6">
      <div className="-mx-6 -mt-6 px-6 py-6 mb-6 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Staff Management</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage system access and roles for this property.</p>
        </div>
        <Button onClick={() => openForm(null)}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <DataTable 
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        searchPlaceholder="Search by email..."
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        filters={filterControls}
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
