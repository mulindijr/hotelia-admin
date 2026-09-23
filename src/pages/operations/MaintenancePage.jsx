import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { maintenanceApi } from '../../api/operations';
import { useHotel } from '../../context/HotelContext';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmModal from '../../components/common/ConfirmModal';
import MaintenanceFormModal from './MaintenanceFormModal';

const MaintenancePage = () => {
  const { activeHotelId } = useHotel();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', activeHotelId, page, perPage, statusFilter, priorityFilter],
    queryFn: () => maintenanceApi.getRequests(activeHotelId, { 
      page, 
      perPage,
      include: 'room',
      filters: {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined
      }
    }),
    enabled: !!activeHotelId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => maintenanceApi.deleteRequest(activeHotelId, id),
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenance', activeHotelId]);
      setIsDeleteOpen(false);
    }
  });

  const openForm = (req = null) => {
    setEditingRequest(req);
    setIsFormOpen(true);
  };

  const columns = [
    { 
      header: 'Room', 
      render: (row) => <span className="font-medium text-zinc-900">{row.room?.room_number || `Room ${row.room_id}`}</span> 
    },
    { 
      header: 'Issue Description', 
      accessor: 'description' 
    },
    { 
      header: 'Priority', 
      render: (row) => (
        <Badge variant={row.priority === 'urgent' ? 'danger' : row.priority === 'high' ? 'warning' : row.priority === 'medium' ? 'info' : 'default'}>
          {row.priority.toUpperCase()}
        </Badge>
      )
    },
    { 
      header: 'Status', 
      render: (row) => (
        <Badge variant={row.status === 'resolved' ? 'success' : row.status === 'in_progress' ? 'info' : 'warning'}>
          {row.status.replace('_', ' ').toUpperCase()}
        </Badge>
      )
    },
    { 
      header: 'Logged', 
      render: (row) => new Date(row.created_at).toLocaleDateString() 
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
          <button onClick={() => { setRequestToDelete(row); setIsDeleteOpen(true); }} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md">
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
    <div className="flex gap-2 w-full sm:w-auto">
      <select
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        className="block w-full py-2 px-3 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
      >
        <option value="">All Statuses</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
      </select>

      <select
        value={priorityFilter}
        onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
        className="block w-full py-2 px-3 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
      >
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="-mx-6 -mt-6 px-6 py-6 mb-6 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Maintenance Log</h1>
          <p className="mt-1 text-sm text-zinc-500">Track and manage facility repairs and issues.</p>
        </div>
        <Button onClick={() => openForm(null)}>
          <Plus className="w-4 h-4 mr-2" />
          Log Issue
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

      <MaintenanceFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        request={editingRequest}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(requestToDelete?.id)}
        title="Delete Request"
        description="Are you sure you want to delete this maintenance record?"
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default MaintenancePage;
