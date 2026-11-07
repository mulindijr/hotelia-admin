import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import { reportsApi } from '../../api/reports';
import { useHotel } from '../../context/HotelContext';
import { useCurrency } from '../../hooks/useCurrency';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { format, subDays } from 'date-fns';
import EmptyState from '../../components/common/EmptyState';

const ReportsPage = () => {
  const { activeHotelId } = useHotel();
  const { formatCurrency } = useCurrency();
  
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [activeTab, setActiveTab] = useState('revenue'); // 'revenue' or 'occupancy'

  // Fetch Reports
  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['reports_revenue', activeHotelId, startDate, endDate],
    queryFn: () => reportsApi.getRevenueReport(activeHotelId, { start_date: startDate, end_date: endDate }),
    enabled: !!activeHotelId && activeTab === 'revenue',
  });

  const { data: occupancyData, isLoading: isLoadingOccupancy } = useQuery({
    queryKey: ['reports_dashboard', activeHotelId, startDate, endDate],
    queryFn: () => reportsApi.getDashboardStats(activeHotelId, { start_date: startDate, end_date: endDate }),
    enabled: !!activeHotelId && activeTab === 'occupancy',
  });

  if (!activeHotelId) {
    return <EmptyState />;
  }

  const rawRevenue = revenueData?.data || {};
  const rawOccupancy = occupancyData?.data || {};

  // Build table rows supporting both daily arrays and ReportService summary payloads
  const revenueTableData = rawRevenue.daily_revenue?.length
    ? rawRevenue.daily_revenue.map((row, idx) => ({
        id: idx + 1,
        label: new Date(row.date).toLocaleDateString(),
        category: 'Daily Revenue',
        value: formatCurrency(row.amount),
        rawValue: row.amount,
      }))
    : rawRevenue.payment_methods
    ? [
        { id: 'invoiced', label: 'Total Invoiced', category: 'Billing Summary', value: formatCurrency(rawRevenue.total_invoiced || 0), rawValue: rawRevenue.total_invoiced || 0 },
        { id: 'collected', label: 'Payments Collected', category: 'Billing Summary', value: formatCurrency(rawRevenue.payments_collected || 0), rawValue: rawRevenue.payments_collected || 0 },
        { id: 'room_rev', label: 'Room Revenue', category: 'Revenue Stream', value: formatCurrency(rawRevenue.room_revenue || 0), rawValue: rawRevenue.room_revenue || 0 },
        { id: 'adr', label: 'Average Daily Rate (ADR)', category: 'KPI', value: formatCurrency(rawRevenue.adr || 0), rawValue: rawRevenue.adr || 0 },
        { id: 'revpar', label: 'Revenue Per Available Room (RevPAR)', category: 'KPI', value: formatCurrency(rawRevenue.revpar || 0), rawValue: rawRevenue.revpar || 0 },
        { id: 'mpesa', label: 'Mobile Money (M-Pesa)', category: 'Payment Method', value: formatCurrency(rawRevenue.payment_methods.mpesa || 0), rawValue: rawRevenue.payment_methods.mpesa || 0 },
        { id: 'card', label: 'Credit / Debit Card', category: 'Payment Method', value: formatCurrency(rawRevenue.payment_methods.card || 0), rawValue: rawRevenue.payment_methods.card || 0 },
        { id: 'cash', label: 'Cash', category: 'Payment Method', value: formatCurrency(rawRevenue.payment_methods.cash || 0), rawValue: rawRevenue.payment_methods.cash || 0 },
        { id: 'bank_transfer', label: 'Bank Transfer', category: 'Payment Method', value: formatCurrency(rawRevenue.payment_methods.bank_transfer || 0), rawValue: rawRevenue.payment_methods.bank_transfer || 0 },
      ]
    : [];

  const occupancyTableData = rawOccupancy.occupancy_trend?.length
    ? rawOccupancy.occupancy_trend.map((row, idx) => ({
        id: idx + 1,
        label: new Date(row.date).toLocaleDateString(),
        category: 'Daily Occupancy',
        value: `${row.rate}%`,
        rawValue: `${row.rate}%`,
      }))
    : rawOccupancy.room_statuses
    ? [
        { id: 'total_rooms', label: 'Total Rooms', category: 'Inventory', value: `${rawOccupancy.total_rooms ?? 0}`, rawValue: rawOccupancy.total_rooms ?? 0 },
        { id: 'occupied_rooms', label: 'Occupied Rooms', category: 'Inventory', value: `${rawOccupancy.occupied_rooms ?? 0}`, rawValue: rawOccupancy.occupied_rooms ?? 0 },
        { id: 'occupancy_rate', label: 'Occupancy Rate', category: 'KPI', value: `${rawOccupancy.occupancy_rate ?? 0}%`, rawValue: `${rawOccupancy.occupancy_rate ?? 0}%` },
        { id: 'available', label: 'Available Rooms', category: 'Room Status', value: `${rawOccupancy.room_statuses.available ?? 0}`, rawValue: rawOccupancy.room_statuses.available ?? 0 },
        { id: 'cleaning', label: 'Rooms in Cleaning', category: 'Room Status', value: `${rawOccupancy.room_statuses.cleaning ?? 0}`, rawValue: rawOccupancy.room_statuses.cleaning ?? 0 },
        { id: 'maintenance', label: 'Rooms in Maintenance', category: 'Room Status', value: `${rawOccupancy.room_statuses.maintenance ?? 0}`, rawValue: rawOccupancy.room_statuses.maintenance ?? 0 },
        { id: 'active_bookings', label: 'Active Bookings', category: 'Front Desk', value: `${rawOccupancy.active_bookings_count ?? 0}`, rawValue: rawOccupancy.active_bookings_count ?? 0 },
        { id: 'hk_pending', label: 'Pending Housekeeping Tasks', category: 'Operations', value: `${rawOccupancy.housekeeping_tasks?.pending ?? 0}`, rawValue: rawOccupancy.housekeeping_tasks?.pending ?? 0 },
        { id: 'maint_active', label: 'Active Maintenance Requests', category: 'Operations', value: `${rawOccupancy.active_maintenance_requests ?? 0}`, rawValue: rawOccupancy.active_maintenance_requests ?? 0 },
      ]
    : [];

  const revenueColumns = [
    { header: 'Metric / Date', accessor: 'label', className: 'font-medium text-zinc-900' },
    { header: 'Category', accessor: 'category' },
    { header: 'Amount', accessor: 'value', className: 'text-right', cellClassName: 'text-right font-semibold text-zinc-900' }
  ];

  const occupancyColumns = [
    { header: 'Metric / Date', accessor: 'label', className: 'font-medium text-zinc-900' },
    { header: 'Category', accessor: 'category' },
    { header: 'Value', accessor: 'value', className: 'text-right', cellClassName: 'text-right font-semibold text-zinc-900' }
  ];

  const handleExportCSV = () => {
    const dataToExport = activeTab === 'revenue' ? revenueTableData : occupancyTableData;
    if (!dataToExport || dataToExport.length === 0) return;

    const headers = ['Metric / Date', 'Category', 'Value'];
    const csvRows = [headers.join(',')];

    dataToExport.forEach(row => {
      csvRows.push(`"${row.label}","${row.category}","${row.rawValue}"`);
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTab}-report-${startDate}-to-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="-mx-6 -mt-6 px-6 py-6 mb-6 bg-zinc-50 border-b border-zinc-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Analytics & Reports</h1>
            <p className="mt-1 text-sm text-zinc-500">Analyze financial performance and occupancy trends.</p>
          </div>
          
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 bg-white p-2 border border-zinc-200 rounded-lg shadow-sm">
            <CalendarIcon className="w-5 h-5 text-zinc-400 ml-2" />
            <div className="flex items-center gap-2 px-2">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm border-none focus:ring-0 text-zinc-900 cursor-pointer"
              />
              <span className="text-zinc-400">to</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm border-none focus:ring-0 text-zinc-900 cursor-pointer"
              />
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-6 mt-6 border-b border-zinc-200">
          <button
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'revenue' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
            onClick={() => setActiveTab('revenue')}
          >
            Revenue Report
          </button>
          <button
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'occupancy' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
            onClick={() => setActiveTab('occupancy')}
          >
            Occupancy Report
          </button>
        </div>
      </div>

      {/* Content */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-zinc-900">
            {activeTab === 'revenue' ? 'Daily Revenue Breakdown' : 'Daily Occupancy Breakdown'}
          </h2>
          <Button variant="secondary" onClick={handleExportCSV} disabled={activeTab === 'revenue' ? !revenueTableData.length : !occupancyTableData.length}>
            <Download className="w-4 h-4 mr-2" />
            Export to CSV
          </Button>
        </div>

        <DataTable 
          columns={activeTab === 'revenue' ? revenueColumns : occupancyColumns}
          data={activeTab === 'revenue' ? revenueTableData : occupancyTableData}
          isLoading={activeTab === 'revenue' ? isLoadingRevenue : isLoadingOccupancy}
          emptyStateMessage="No data available for the selected date range."
        />
      </Card>
    </div>
  );
};

export default ReportsPage;
