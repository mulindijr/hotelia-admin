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
    queryFn: () => reportsApi.getRevenueReport(activeHotelId, { filters: { start_date: startDate, end_date: endDate } }),
    enabled: !!activeHotelId && activeTab === 'revenue',
  });

  const { data: occupancyData, isLoading: isLoadingOccupancy } = useQuery({
    queryKey: ['reports_dashboard', activeHotelId, startDate, endDate], // Dashboard endpoint has occupancy trend
    queryFn: () => reportsApi.getDashboardStats(activeHotelId, { filters: { start_date: startDate, end_date: endDate } }),
    enabled: !!activeHotelId && activeTab === 'occupancy',
  });

  if (!activeHotelId) {
    return <EmptyState />;
  }

  // Raw data mapping
  const revenueTableData = revenueData?.data?.daily_revenue || [];
  const occupancyTableData = occupancyData?.data?.occupancy_trend || [];

  const revenueColumns = [
    { header: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { header: 'Revenue Amount', render: (row) => formatCurrency(row.amount) }
  ];

  const occupancyColumns = [
    { header: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { header: 'Occupancy Rate', render: (row) => `${row.rate}%` }
  ];

  const handleExportCSV = () => {
    const dataToExport = activeTab === 'revenue' ? revenueTableData : occupancyTableData;
    if (!dataToExport || dataToExport.length === 0) return;

    // Build CSV string
    const headers = activeTab === 'revenue' ? ['Date', 'Revenue'] : ['Date', 'Occupancy Rate (%)'];
    const csvRows = [headers.join(',')];

    dataToExport.forEach(row => {
      if (activeTab === 'revenue') {
        csvRows.push(`${row.date},${row.amount}`);
      } else {
        csvRows.push(`${row.date},${row.rate}`);
      }
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
