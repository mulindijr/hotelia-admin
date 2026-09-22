import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { paymentsApi } from '../../api/payments';
import { useHotel } from '../../context/HotelContext';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import RecordPaymentModal from '../../components/payments/RecordPaymentModal';

const PaymentListPage = () => {
  const { activeHotelId } = useHotel();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', activeHotelId, page],
    queryFn: () => paymentsApi.getPayments(activeHotelId, { page, perPage: 15, include: 'booking' }),
    enabled: !!activeHotelId,
  });

  const columns = [
    { 
      header: 'Booking Ref', 
      render: (row) => <span className="font-medium text-zinc-900">{row.booking?.booking_reference || `ID: ${row.booking_id}`}</span> 
    },
    { 
      header: 'Date', 
      render: (row) => new Date(row.payment_date).toLocaleString() 
    },
    { 
      header: 'Amount', 
      render: (row) => `$${Number(row.amount).toFixed(2)}` 
    },
    { 
      header: 'Method', 
      render: (row) => row.payment_method.replace('_', ' ').toUpperCase()
    },
    { 
      header: 'Status', 
      render: (row) => (
        <Badge variant={row.status === 'completed' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
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
          <h1 className="text-2xl font-bold text-zinc-900">Payments Ledger</h1>
          <p className="mt-1 text-sm text-zinc-500">View all financial transactions and receipts.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
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

      <RecordPaymentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default PaymentListPage;
