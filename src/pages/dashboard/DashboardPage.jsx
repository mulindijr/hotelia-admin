import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, BedDouble, CalendarCheck, DollarSign, Building2, Wrench, Sparkles, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../../api/reports';
import { useHotel } from '../../context/HotelContext';
import { useCurrency } from '../../hooks/useCurrency';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import CreateBookingModal from '../../components/bookings/CreateBookingModal';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, subDays } from 'date-fns';

const DashboardPage = () => {
  const { activeHotelId, isLoading: isLoadingHotels } = useHotel();
  const { currencyCode, formatCurrency } = useCurrency();
  const navigate = useNavigate();
  
  // Default to last 30 days for dashboard view
  const [dateRange] = useState({
    start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd')
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['reports_dashboard', activeHotelId, dateRange],
    queryFn: () => reportsApi.getDashboardStats(activeHotelId, dateRange),
    enabled: !!activeHotelId,
  });

  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['reports_revenue', activeHotelId, dateRange],
    queryFn: () => reportsApi.getRevenueReport(activeHotelId, dateRange),
    enabled: !!activeHotelId,
  });
  if (isLoadingHotels) {
    return (
      <div className="h-64 flex items-center justify-center bg-transparent">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  if (!activeHotelId) {

    return (
      <div className="p-12 bg-white border border-zinc-200 rounded-xl flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-2">
          <Building2 className="w-8 h-8 text-zinc-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900">Welcome to your new Workspace!</h2>
        <p className="text-zinc-500 max-w-md">
          Your company has been successfully registered. To start managing bookings and viewing your dashboard, you need to add your first hotel property.
        </p>
        <div className="pt-4">
          <button 
            onClick={() => navigate('/hotels')}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors"
          >
            Create Your First Hotel
          </button>
        </div>
      </div>
    );
  }

  const rawDashboard = dashboardData?.data || {};
  const rawRevenue = revenueData?.data || {};
  const metrics = rawDashboard.metrics || {};

  const statCards = [
    {
      label: 'Check-Ins Today',
      value: rawDashboard.today_arrivals ?? metrics.today_check_ins ?? 0,
      icon: CalendarCheck,
      color: 'text-zinc-900',
      bg: 'bg-zinc-100',
      action: () => navigate('/bookings?queue=arrivals_today'),
      actionText: 'Arrivals queue',
    },
    {
      label: 'Check-Outs Today',
      value: rawDashboard.today_departures ?? metrics.today_check_outs ?? 0,
      icon: CalendarCheck,
      color: 'text-zinc-900',
      bg: 'bg-zinc-100',
      action: () => navigate('/bookings?queue=departures_today'),
      actionText: 'Departures queue',
    },
    {
      label: 'In-House Guests',
      value: rawDashboard.in_house_count ?? rawDashboard.active_bookings_count ?? 0,
      icon: Users,
      color: 'text-zinc-900',
      bg: 'bg-zinc-100',
      action: () => navigate('/bookings?queue=in_house'),
      actionText: 'In-house guests',
    },
    {
      label: 'Occupancy Rate',
      value: `${metrics.occupancy_rate ?? rawDashboard.occupancy_rate ?? 0}%`,
      icon: BedDouble,
      color: 'text-zinc-900',
      bg: 'bg-zinc-100',
    },
    {
      label: 'Revenue (30d)',
      value: formatCurrency(metrics.revenue_mtd ?? rawRevenue.payments_collected ?? rawRevenue.total_invoiced ?? 0),
      icon: DollarSign,
      color: 'text-zinc-900',
      bg: 'bg-zinc-100',
    },
  ];

  // Prepare chart data (support both time-series arrays and summary breakdowns from ReportService)
  const occupancyChartData = rawDashboard.occupancy_trend || [];
  const revenueChartData = rawRevenue.daily_revenue || [];

  const roomStatusChartData = rawDashboard.room_statuses
    ? [
        { name: 'Available', count: Number(rawDashboard.room_statuses.available || 0), fill: '#10b981' },
        { name: 'Occupied', count: Number(rawDashboard.room_statuses.occupied || 0), fill: '#f59e0b' },
        { name: 'Cleaning', count: Number(rawDashboard.room_statuses.cleaning || 0), fill: '#3b82f6' },
        { name: 'Maintenance', count: Number(rawDashboard.room_statuses.maintenance || 0), fill: '#ef4444' },
      ]
    : [];

  const paymentMethodChartData = rawRevenue.payment_methods
    ? [
        { name: 'M-Pesa', amount: Number(rawRevenue.payment_methods.mpesa || 0) },
        { name: 'Card', amount: Number(rawRevenue.payment_methods.card || 0) },
        { name: 'Cash', amount: Number(rawRevenue.payment_methods.cash || 0) },
        { name: 'Bank Transfer', amount: Number(rawRevenue.payment_methods.bank_transfer || 0) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="-mx-6 -mt-6 px-6 py-6 mb-6 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-zinc-500">Key metrics and front desk operations for your property.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Booking
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, idx) => (
          <div 
            key={idx} 
            className={`bg-white p-5 rounded-xl border border-zinc-200 shadow-xs flex flex-col justify-between transition-all ${
              stat.action ? 'hover:border-zinc-400 hover:shadow-sm cursor-pointer' : ''
            }`}
            onClick={stat.action ? stat.action : undefined}
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <h3 className="text-sm font-medium text-zinc-500 line-clamp-1">{stat.label}</h3>
              </div>
              {isLoadingDashboard || (idx === 4 && isLoadingRevenue) ? (
                <div className="h-8 bg-zinc-100 rounded animate-pulse w-1/2"></div>
              ) : (
                <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
              )}
            </div>
            {stat.action && (
              <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs font-medium text-zinc-600 hover:text-zinc-900">
                <span>{stat.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Operations Snapshot Strip */}
      {!isLoadingDashboard && (rawDashboard.housekeeping_tasks || rawDashboard.active_maintenance_requests !== undefined) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white px-4 py-3.5 rounded-xl border border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-700">Pending Housekeeping</span>
            </div>
            <span className="text-sm font-bold text-zinc-900">
              {rawDashboard.housekeeping_tasks?.pending ?? 0} tasks
            </span>
          </div>
          <div className="bg-white px-4 py-3.5 rounded-xl border border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-zinc-700">In-Progress Cleaning</span>
            </div>
            <span className="text-sm font-bold text-zinc-900">
              {rawDashboard.housekeeping_tasks?.in_progress ?? 0} tasks
            </span>
          </div>
          <div className="bg-white px-4 py-3.5 rounded-xl border border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-zinc-700">Open Maintenance Issues</span>
            </div>
            <span className="text-sm font-bold text-zinc-900">
              {rawDashboard.active_maintenance_requests ?? 0} active
            </span>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        <Card title={occupancyChartData.length > 0 ? "Occupancy Trend (30 Days)" : "Current Room Status Breakdown"}>
          <div className="h-72 mt-4">
            {isLoadingDashboard ? (
              <div className="w-full h-full bg-zinc-50 animate-pulse rounded-lg flex items-center justify-center text-zinc-400">Loading chart...</div>
            ) : occupancyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={occupancyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#71717a'}} axisLine={false} tickLine={false} minTickGap={30} />
                  <YAxis tick={{fontSize: 12, fill: '#71717a'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value}%`, 'Occupancy']}
                    labelStyle={{ color: '#71717a', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="rate" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorOccupancy)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : roomStatusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomStatusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value} rooms`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {roomStatusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
                No occupancy data available for this period.
              </div>
            )}
          </div>
        </Card>

        <Card title={revenueChartData.length > 0 ? "Revenue Trend (30 Days)" : "Revenue by Payment Method (30 Days)"}>
          <div className="h-72 mt-4">
            {isLoadingRevenue ? (
              <div className="w-full h-full bg-zinc-50 animate-pulse rounded-lg flex items-center justify-center text-zinc-400">Loading chart...</div>
            ) : revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#71717a'}} axisLine={false} tickLine={false} minTickGap={30} />
                  <YAxis tick={{fontSize: 12, fill: '#71717a'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${currencyCode} ${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${currencyCode} ${value}`, 'Revenue']}
                    labelStyle={{ color: '#71717a', marginBottom: '4px' }}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#18181b" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#18181b' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : paymentMethodChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentMethodChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${currencyCode} ${val}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [formatCurrency(value), 'Collected']}
                  />
                  <Bar dataKey="amount" fill="#18181b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
                No revenue data available for this period.
              </div>
            )}
          </div>
        </Card>
      </div>

      {activeHotelId && (
        <CreateBookingModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
