import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { adminApi } from '../../api/admin';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import AuditLogDetailsModal from './AuditLogDetailsModal';

const AuditLogsPage = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [eventFilter, setEventFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page, perPage, eventFilter, searchQuery],
    queryFn: () => adminApi.getAuditLogs({ 
      page, 
      perPage,
      filters: {
        event: eventFilter || undefined,
        description: searchQuery || undefined
      }
    }),
  });

  const openDetails = (log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const columns = [
    { 
      header: 'Timestamp', 
      render: (row) => <span className="text-sm text-zinc-500">{new Date(row.created_at).toLocaleString()}</span> 
    },
    { 
      header: 'User', 
      render: (row) => row.causer ? <span className="font-medium text-zinc-900">{row.causer.first_name} {row.causer.last_name}</span> : <span className="text-zinc-400 italic">System</span> 
    },
    { 
      header: 'Event', 
      render: (row) => (
        <Badge variant={row.event === 'created' ? 'success' : row.event === 'deleted' ? 'danger' : 'info'}>
          {row.event.toUpperCase()}
        </Badge>
      )
    },
    { 
      header: 'Module', 
      render: (row) => <span className="capitalize text-zinc-700">{row.log_name}</span> 
    },
    { 
      header: 'Description', 
      accessor: 'description',
      className: 'max-w-xs truncate'
    },
    {
      header: 'Details',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <button 
          onClick={() => openDetails(row)} 
          className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
          title="View Data Diff"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  const filterControls = (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <input
        type="text"
        placeholder="Search description..."
        value={searchQuery}
        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
        className="w-full sm:w-64 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
      />
      <select
        value={eventFilter}
        onChange={(e) => { setEventFilter(e.target.value); setPage(1); }}
        className="w-full sm:w-auto px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
      >
        <option value="">All Events</option>
        <option value="created">Created</option>
        <option value="updated">Updated</option>
        <option value="deleted">Deleted</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="-mx-6 -mt-6 px-6 py-6 mb-6 bg-zinc-50 border-b border-zinc-200">
        <h1 className="text-2xl font-bold text-zinc-900">Security Audit Logs</h1>
        <p className="mt-1 text-sm text-zinc-500">Review system activity, data modifications, and staff actions.</p>
      </div>

      <DataTable 
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        filters={filterControls}
        perPage={perPage}
        onPerPageChange={(val) => { setPerPage(val); setPage(1); }}
        pagination={{
          current_page: data?.current_page,
          from: data?.from,
          to: data?.to,
          total: data?.total,
          prev_page_url: data?.prev_page_url,
          next_page_url: data?.next_page_url,
          onPageChange: setPage
        }}
      />

      <AuditLogDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        log={selectedLog}
      />
    </div>
  );
};

export default AuditLogsPage;
