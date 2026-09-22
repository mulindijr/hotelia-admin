import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon } from 'lucide-react';
import { roomsApi } from '../../api/rooms';
import { useHotel } from '../../context/HotelContext';
import Card from '../../components/common/Card';

const AvailabilityMatrixPage = () => {
  const { activeHotelId } = useHotel();
  // For demo purposes, fetch next 14 days
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 14);

  const [dateRange, setDateRange] = useState({
    start: today.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['availability', activeHotelId, dateRange.start, dateRange.end],
    queryFn: () => roomsApi.getAvailability(activeHotelId, dateRange.start, dateRange.end),
    enabled: !!activeHotelId,
  });

  if (!activeHotelId) {
    return <div className="p-6 bg-white border border-zinc-200 rounded-xl">Please select an active hotel.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Tape Chart / Grid</h1>
          <p className="mt-1 text-sm text-zinc-500">View room availability matrix across dates.</p>
        </div>
      </div>

      <Card>
        <div className="flex gap-4 mb-6">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Start Date</label>
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">End Date</label>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12 text-zinc-500">Loading matrix data...</div>
        ) : (
          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            {/* Very basic UI representation for Tape Chart Matrix */}
            <div className="min-w-max p-8 text-center text-zinc-500 flex flex-col items-center">
              <CalendarIcon className="w-12 h-12 text-zinc-300 mb-4" />
              <p>The tape chart calendar visualization will be rendered here.</p>
              <p className="text-xs mt-2">Data payload shape from endpoint depends on implementation details.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AvailabilityMatrixPage;
