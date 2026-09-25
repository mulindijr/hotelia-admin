import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookingsApi } from '../../api/bookings';
import { useHotel } from '../../context/HotelContext';
import { useCurrency } from '../../hooks/useCurrency';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import CreateBookingModal from '../../components/bookings/CreateBookingModal';
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge';

const BookingListPage = () => {
  const { activeHotelId } = useHotel();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', activeHotelId, page, perPage, statusFilter],
    queryFn: () => bookingsApi.getBookings(activeHotelId, { 
      page, 
      perPage, 
      include: 'guest,rooms',
      filters: statusFilter ? { status: statusFilter } : undefined
    }),
    enabled: !!activeHotelId,
  });

  const downloadInvoiceMutation = useMutation({
    mutationFn: (bookingId) => bookingsApi.getBookingInvoice(activeHotelId, bookingId),
    onSuccess: (response, bookingId) => {
      // Create a blob link to download the PDF
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  });

  const columns = [
    { header: 'Ref #', accessor: 'booking_reference', className: 'font-medium text-zinc-900' },
    { 
      header: 'Guest', 
      render: (row) => row.guest ? `${row.guest.first_name} ${row.guest.last_name}` : 'Unknown'
    },
    { 
      header: 'Dates', 
      render: (row) => (
        <div className="text-sm">
          <div>In: {new Date(row.check_in_date).toLocaleDateString()}</div>
          <div className="text-zinc-500">Out: {new Date(row.check_out_date).toLocaleDateString()}</div>
        </div>
      )
    },
    { 
      header: 'Total Price', 
      render: (row) => formatCurrency(row.total_amount)
    },
    { 
      header: 'Status', 
      render: (row) => <BookingStatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => navigate(`/bookings/${row.id}`)}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={() => downloadInvoiceMutation.mutate(row.id)}
            disabled={downloadInvoiceMutation.isPending}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors disabled:opacity-50"
            title="Download Invoice"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (!activeHotelId) {
    return <div className="p-6 bg-white border border-zinc-200 rounded-xl">Please select an active hotel.</div>;
  }

  const statusDropdown = (
    <select
      value={statusFilter}
      onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
      className="block w-full py-2 px-3 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
    >
      <option value="">All Statuses</option>
      <option value="pending">Pending</option>
      <option value="confirmed">Confirmed</option>
      <option value="checked_in">Checked In</option>
      <option value="checked_out">Checked Out</option>
      <option value="cancelled">Cancelled</option>
      <option value="no_show">No Show</option>
    </select>
  );

  return (
    <div className="space-y-6">
      <div className="-mx-6 -mt-6 px-6 py-6 mb-6 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Reservations</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage all past, current, and upcoming bookings.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Booking
        </Button>
      </div>

      <DataTable 
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        filters={statusDropdown}
        perPage={perPage}
        onPerPageChange={(val) => { setPerPage(val); setPage(1); }}
        enableSelection={true}
        selectedRowIds={selectedRows}
        onSelectionChange={setSelectedRows}
        pagination={{
          current_page: data?.meta?.current_page,
          from: data?.meta?.from,
          to: data?.meta?.to,
          total: data?.meta?.total,
          prev_page_url: data?.links?.prev,
          next_page_url: data?.links?.next,
          onPageChange: setPage
        }}
        emptyStateMessage="No bookings found."
      />

      <CreateBookingModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default BookingListPage;
