import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, BedDouble, CalendarCheck, DollarSign } from 'lucide-react';
import { reportsApi } from '../../api/reports';
import { useHotel } from '../../context/HotelContext';
import { useCurrency } from '../../hooks/useCurrency';
import Card from '../../components/common/Card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format, subDays } from 'date-fns';

const DashboardPage = () => {
  const { activeHotelId } = useHotel();
  const { currencyCode, formatCurrency } = useCurrency();
  
  // Default to last 30 days for dashboard view
  const [dateRange] = useState({
    start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd')
  });

  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['reports_dashboard', activeHotelId, dateRange],
    queryFn: () => reportsApi.getDashboardStats(activeHotelId, { filters: dateRange }),
    enabled: !!activeHotelId,
  });

  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['reports_revenue', activeHotelId, dateRange],
    queryFn: () => reportsApi.getRevenueReport(activeHotelId, { filters: dateRange }),
    enabled: !!activeHotelId,
  });

  if (!activeHotelId) {
    return <div className="p-6 bg-white border border-zinc-200 rounded-xl">Please select an active hotel to view the dashboard.</div>;
  }

  // Expecting backend to return metrics in dashboardData.data.metrics or similar
  // Let's adapt based on a standard assumption, and fallback to 0
  const stats = dashboardData?.data?.metrics || {
    today_check_ins: 0,
    today_check_outs: 0,
    occupancy_rate: 0,
    available_rooms: 0,
    revenue_mtd: 0
  };

  const statCards = [
    { label: 'Check-Ins Today', value: stats.today_check_ins, icon: CalendarCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Check-Outs Today', value: stats.today_check_outs, icon: CalendarCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Occupancy Rate', value: `${stats.occupancy_rate}%`, icon: BedDouble, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Available Rooms', value: stats.available_rooms, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Revenue (MTD)', value: formatCurrency(stats.revenue_mtd), icon: DollarSign, color: 'text-zinc-900', bg: 'bg-zinc-100' },
  ];

  // Prepare chart data (fallback to empty arrays if undefined)
  const occupancyChartData = dashboardData?.data?.occupancy_trend || [];
  const revenueChartData = revenueData?.data?.daily_revenue || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-zinc-500">Key metrics and performance for your property.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <h3 className="text-sm font-medium text-zinc-500 line-clamp-1">{stat.label}</h3>
            </div>
            {isLoadingDashboard ? (
              <div className="h-8 bg-zinc-100 rounded animate-pulse w-1/2"></div>
            ) : (
              <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        <Card title="Occupancy Trend (30 Days)">
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
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
                No occupancy data available for this period.
              </div>
            )}
          </div>
        </Card>

        <Card title="Revenue Trend (30 Days)">
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
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
                No revenue data available for this period.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
