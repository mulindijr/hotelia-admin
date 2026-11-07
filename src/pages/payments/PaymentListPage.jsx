import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  Download, 
  Eye, 
  ExternalLink, 
  CreditCard, 
  Banknote, 
  Building2, 
  Smartphone, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentsApi } from '../../api/payments';
import { downloadBlob } from '../../api/client';
import { useHotel } from '../../context/HotelContext';
import { useCurrency } from '../../hooks/useCurrency';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import RecordPaymentModal from '../../components/payments/RecordPaymentModal';
import EmptyState from '../../components/common/EmptyState';

const PaymentListPage = () => {
  const { activeHotelId, activeHotel } = useHotel();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', activeHotelId, page, perPage, searchQuery, statusFilter, methodFilter],
    queryFn: () => paymentsApi.getPayments(activeHotelId, { 
      page, 
      perPage, 
      include: 'booking,booking.guest',
      filters: {
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        payment_method: methodFilter || undefined
      }
    }),
    enabled: !!activeHotelId,
  });

  const downloadReceiptMutation = useMutation({
    mutationFn: (id) => paymentsApi.downloadReceipt(activeHotelId, id),
    onSuccess: async (response, id) => {
      if (response.data instanceof Blob && response.data.type === 'application/json') {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'Failed to download receipt');
      }
      downloadBlob(response.data, `receipt-${id}.pdf`);
      toast.success('Payment receipt downloaded successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to download receipt');
    }
  });

  const payments = data?.data || [];
  const completedPayments = payments.filter(p => p.status === 'completed');
  const totalCollections = completedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const failedCount = payments.filter(p => p.status === 'failed').length;

  const handleExportSelected = () => {
    const list = payments.filter(p => selectedRows.includes(p.id));
    if (!list.length) return;
    const headers = ['ID', 'Transaction Ref', 'Booking Ref', 'Guest', 'Method', 'Status', 'Amount', 'Date'];
    const rows = list.map(p => [
      p.id,
      p.transaction_reference || '',
      p.booking?.booking_reference || p.booking_id,
      p.booking?.guest ? `"${p.booking.guest.first_name} ${p.booking.guest.last_name}"` : '',
      p.payment_method || '',
      p.status || '',
      p.amount || 0,
      p.created_at || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments-selected-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${list.length} payments`);
  };

  const columns = [
    { 
      header: 'Transaction Ref', 
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-zinc-900 text-xs">
            {row.transaction_reference || `#TXN-${row.id}`}
          </span>
          <span className="text-[11px] text-zinc-400 block">ID #{row.id}</span>
        </div>
      )
    },
    { 
      header: 'Booking Ref', 
      render: (row) => (
        <Link 
          to={`/bookings/${row.booking_id}`}
          className="font-semibold text-zinc-900 hover:text-emerald-600 hover:underline inline-flex items-center gap-1 group text-sm"
          title="View Booking Details"
        >
          <span>{row.booking?.booking_reference || `Booking #${row.booking_id}`}</span>
          <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      )
    },
    { 
      header: 'Guest', 
      render: (row) => {
        const guest = row.booking?.guest;
        if (!guest) return <span className="text-zinc-400 text-xs italic">Unknown Guest</span>;
        return (
          <div>
            <Link 
              to={`/guests/${guest.id}`}
              className="font-medium text-zinc-900 hover:text-emerald-600 hover:underline text-sm block"
              title="View Guest Profile"
            >
              {guest.first_name} {guest.last_name}
            </Link>
            <span className="text-[11px] text-zinc-400 block truncate max-w-[180px]">
              {guest.email || guest.phone || ''}
            </span>
          </div>
        );
      }
    },
    { 
      header: 'Date & Time', 
      render: (row) => {
        const rawDate = row.payment_date || row.created_at;
        const d = new Date(rawDate);
        const isValid = !isNaN(d.getTime());
        return (
          <div className="text-xs">
            <span className="font-medium text-zinc-800">{isValid ? d.toLocaleDateString() : '—'}</span>
            <span className="text-zinc-400 block text-[11px]">
              {isValid ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
        );
      }
    },
    { 
      header: 'Method', 
      render: (row) => {
        const m = row.payment_method?.toLowerCase() || '';
        const configs = {
          mpesa: { label: 'M-Pesa', icon: Smartphone, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          mobile_money: { label: 'M-Pesa', icon: Smartphone, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          card: { label: 'Card', icon: CreditCard, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          credit_card: { label: 'Card', icon: CreditCard, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          cash: { label: 'Cash', icon: Banknote, color: 'bg-amber-50 text-amber-700 border-amber-200' },
          bank_transfer: { label: 'Bank', icon: Building2, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        };
        const cfg = configs[m] || { label: m.replace('_', ' ').toUpperCase(), icon: CreditCard, color: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
        const Icon = cfg.icon;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.color}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
        );
      }
    },
    { 
      header: 'Amount',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <span className="font-bold text-zinc-900 text-sm">
          {formatCurrency(row.amount)}
        </span>
      )
    },
    { 
      header: 'Status', 
      render: (row) => {
        const s = row.status?.toLowerCase();
        if (s === 'completed') {
          return <Badge variant="success">Completed</Badge>;
        }
        if (s === 'failed') {
          return <Badge variant="danger">Failed</Badge>;
        }
        if (s === 'refunded') {
          return <Badge variant="info">Refunded</Badge>;
        }
        return <Badge variant="warning">Pending</Badge>;
      }
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button 
            onClick={() => downloadReceiptMutation.mutate(row.id)}
            disabled={downloadReceiptMutation.isPending && downloadReceiptMutation.variables === row.id}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors disabled:opacity-50"
            title="Download PDF Receipt"
          >
            {downloadReceiptMutation.isPending && downloadReceiptMutation.variables === row.id ? (
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-600" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
          <button 
            onClick={() => navigate(`/bookings/${row.booking_id}`)}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
            title="View Booking"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (!activeHotelId) {
    return <EmptyState />;
  }

  const filterControls = (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <select
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        className="block w-full py-2 px-3 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
      >
        <option value="">All Statuses</option>
        <option value="completed">Completed</option>
        <option value="pending">Pending</option>
        <option value="failed">Failed</option>
        <option value="refunded">Refunded</option>
      </select>
      <select
        value={methodFilter}
        onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
        className="block w-full py-2 px-3 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
      >
        <option value="">All Methods</option>
        <option value="mpesa">Mobile Money (M-Pesa)</option>
        <option value="card">Credit / Debit Card</option>
        <option value="cash">Cash</option>
        <option value="bank_transfer">Bank Transfer</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="-mx-6 -mt-6 px-6 py-6 mb-6 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Payments Ledger</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track and manage all guest transaction records, deposits, and receipts at {activeHotel?.name || 'this property'}.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase tracking-wider">Page Revenue</span>
            <Banknote className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-zinc-900 mt-2 truncate">
            {formatCurrency(totalCollections)}
          </div>
          <div className="text-xs text-zinc-400 mt-1">Completed transactions</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase tracking-wider">Successful</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-2">
            {completedPayments.length}
          </div>
          <div className="text-xs text-zinc-400 mt-1">Verified payments</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase tracking-wider">Pending / Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 mt-2">
            {pendingCount}
          </div>
          <div className="text-xs text-zinc-400 mt-1">Awaiting confirmation</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase tracking-wider">Failed / Incomplete</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600 mt-2">
            {failedCount}
          </div>
          <div className="text-xs text-zinc-400 mt-1">Declined or aborted</div>
        </div>
      </div>

      {/* Payments DataTable */}
      <DataTable 
        columns={columns}
        data={payments}
        isLoading={isLoading}
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setPage(1); }}
        filters={filterControls}
        perPage={perPage}
        onPerPageChange={(val) => { setPerPage(val); setPage(1); }}
        enableSelection={true}
        selectedRowIds={selectedRows}
        onSelectionChange={setSelectedRows}
        bulkActions={
          <button
            onClick={handleExportSelected}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-zinc-900 rounded text-xs font-medium hover:bg-zinc-100 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Selected (CSV)
          </button>
        }
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

      {/* Record Payment Modal */}
      <RecordPaymentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default PaymentListPage;
