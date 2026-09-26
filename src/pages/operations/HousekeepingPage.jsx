import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { housekeepingApi } from '../../api/operations';
import { useHotel } from '../../context/HotelContext';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmModal from '../../components/common/ConfirmModal';
import HousekeepingFormModal from './HousekeepingFormModal';

const HousekeepingPage = () => {
  const { activeHotelId } = useHotel();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['housekeeping', activeHotelId, page, perPage, statusFilter],
    queryFn: () => housekeepingApi.getTasks(activeHotelId, { 
      page, 
      perPage,
      include: 'room,assignedTo',
      filters: statusFilter ? { status: statusFilter } : undefined
    }),
    enabled: !!activeHotelId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => housekeepingApi.deleteTask(activeHotelId, id),
    onSuccess: () => {
      queryClient.invalidateQueries(['housekeeping', activeHotelId]);
      setIsDeleteOpen(false);
    }
  });

  const openForm = (task = null) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const columns = [
    { 
      header: 'Room', 
      render: (row) => <span className="font-medium text-zinc-900">{row.room?.room_number || `Room ${row.room_id}`}</span> 
    },
    { 
      header: 'Assigned To', 
      render: (row) => row.assigned_user ? `${row.assigned_user.first_name} ${row.assigned_user.last_name}` : <span className="text-zinc-400 italic">Unassigned</span> 
    },
    { 
      header: 'Status', 
      render: (row) => (
        <Badge variant={row.status === 'completed' ? 'success' : row.status === 'in_progress' ? 'info' : 'warning'}>
          {row.status.replace('_', ' ').toUpperCase()}
        </Badge>
      )
    },
    { 
      header: 'Scheduled', 
      render: (row) => row.scheduled_at ? new Date(row.scheduled_at).toLocaleString() : '-' 
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
          <button onClick={() => { setTaskToDelete(row); setIsDeleteOpen(true); }} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (!activeHotelId) {
    return <div className="p-6 bg-white border border-zinc-200 rounded-xl">Please select an active hotel.</div>;
  }

  const filterControls = (
    <select
      value={statusFilter}
      onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
      className="block w-full sm:w-auto py-2 px-3 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
    >
      <option value="">All Statuses</option>
      <option value="pending">Pending</option>
      <option value="in_progress">In Progress</option>
      <option value="completed">Completed</option>
    </select>
  );

  return (
    <div className="space-y-6">
      <div className="-mx-6 -mt-6 px-6 py-6 mb-6 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Housekeeping Tasks</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage room cleaning and preparation workflows.</p>
        </div>
        <Button onClick={() => openForm(null)}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      <DataTable 
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
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

      <HousekeepingFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        task={editingTask}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(taskToDelete?.id)}
        title="Delete Task"
        description="Are you sure you want to delete this housekeeping task?"
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default HousekeepingPage;
