import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { roomsApi } from '../../api/rooms';
import { useHotel } from '../../context/HotelContext';
import { useCurrency } from '../../hooks/useCurrency';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import CreateBookingModal from '../../components/bookings/CreateBookingModal';

const toIso = (d) => format(d, 'yyyy-MM-dd');

// Cell colour based on remaining availability ratio
const cellClass = (available, total) => {
  if (!total) return 'bg-zinc-50 text-zinc-400';
  if (available <= 0) return 'bg-rose-50 text-rose-700';
  if (available / total <= 0.25) return 'bg-amber-50 text-amber-700';
  return 'bg-emerald-50 text-emerald-700';
};

const AvailabilityMatrixPage = () => {
  const { activeHotelId } = useHotel();
  const { formatCurrency } = useCurrency();

  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    return { start: toIso(today), end: toIso(addDays(today, 13)) };
  });
  const [roomTypeId, setRoomTypeId] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingInitialValues, setBookingInitialValues] = useState(null);

  const handleCellClick = (row, date, cell) => {
    if (cell.available_rooms <= 0) return;
    const checkIn = date;
    const checkOut = toIso(addDays(parseISO(date), 1));
    setBookingInitialValues({
      room_type_id: row.id,
      room_type_name: row.name,
      check_in_date: checkIn,
      check_out_date: checkOut,
    });
    setIsBookingModalOpen(true);
  };

  const { data: roomTypesData } = useQuery({
    queryKey: ['roomTypesList', activeHotelId],
    queryFn: () => roomsApi.getRoomTypes(activeHotelId, { perPage: 100 }),
    enabled: !!activeHotelId,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['availability', activeHotelId, dateRange.start, dateRange.end, roomTypeId],
    queryFn: () => roomsApi.getAvailability(activeHotelId, dateRange.start, dateRange.end, roomTypeId || null),
    enabled: !!activeHotelId && !!dateRange.start && !!dateRange.end && dateRange.start <= dateRange.end,
  });

  // Payload may be wrapped in `data` or returned flat
  const matrix = useMemo(() => (data?.data?.matrix || data?.matrix || []), [data]);

  // Pivot: rows = room types, columns = dates
  const { dates, rows } = useMemo(() => {
    const dates = matrix.map(d => ({ date: d.date, dow: d.day_of_week }));
    const byType = new Map();
    matrix.forEach((day) => {
      (day.room_types || []).forEach((rt) => {
        if (!byType.has(rt.room_type_id)) {
          byType.set(rt.room_type_id, { id: rt.room_type_id, name: rt.room_type_name, cells: {} });
        }
        byType.get(rt.room_type_id).cells[day.date] = rt;
      });
    });
    return { dates, rows: Array.from(byType.values()) };
  }, [matrix]);

  const shiftRange = (days) => {
    setDateRange(prev => ({
      start: toIso(addDays(parseISO(prev.start), days)),
      end: toIso(addDays(parseISO(prev.end), days)),
    }));
  };

  if (!activeHotelId) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <div className="-mx-6 -mt-6 px-6 py-6 mb-6 bg-zinc-50 border-b border-zinc-200">
        <h1 className="text-2xl font-bold text-zinc-900">Tape Chart / Grid</h1>
        <p className="mt-1 text-sm text-zinc-500">View room-type availability across dates.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              min={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Room Type</label>
            <select
              value={roomTypeId}
              onChange={(e) => setRoomTypeId(e.target.value)}
              className="py-2 px-3 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900"
            >
              <option value="">All Types</option>
              {(roomTypesData?.data || []).map(rt => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-1 ml-auto">
            <button onClick={() => shiftRange(-7)} className="p-2 border border-zinc-200 rounded-lg hover:bg-zinc-100" title="Previous week">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => shiftRange(7)} className="p-2 border border-zinc-200 rounded-lg hover:bg-zinc-100" title="Next week">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {dateRange.start > dateRange.end ? (
          <p className="text-sm text-rose-600">End date must be on or after the start date.</p>
        ) : isLoading ? (
          <div className="flex justify-center py-12 text-zinc-500">Loading matrix data...</div>
        ) : isError ? (
          <p className="text-sm text-rose-600">{error?.response?.data?.message || 'Failed to load availability.'}</p>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 flex flex-col items-center border border-dashed border-zinc-200 rounded-lg">
            <CalendarIcon className="w-10 h-10 text-zinc-300 mb-3" />
            <p className="text-sm">No availability data for this range. Make sure room types and rooms are configured.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border border-zinc-200 rounded-lg">
              <table className="min-w-max w-full text-xs">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="sticky left-0 z-10 bg-zinc-50 text-left px-3 py-2 font-semibold text-zinc-700 border-r border-zinc-200">Room Type</th>
                    {dates.map(d => {
                      const parsed = parseISO(d.date);
                      const isWeekend = [0, 6].includes(parsed.getDay());
                      return (
                        <th key={d.date} className={`px-2 py-2 text-center font-medium border-r border-zinc-100 ${isWeekend ? 'text-zinc-900' : 'text-zinc-500'}`}>
                          <div>{format(parsed, 'EEE')}</div>
                          <div className="text-[11px]">{format(parsed, 'dd MMM')}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id} className="border-t border-zinc-200">
                      <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-zinc-900 border-r border-zinc-200 whitespace-nowrap">
                        {row.name}
                      </td>
                      {dates.map(d => {
                        const cell = row.cells[d.date];
                        if (!cell) {
                          return <td key={d.date} className="px-2 py-2 text-center text-zinc-300 border-r border-zinc-100">—</td>;
                        }
                        const isAvailable = cell.available_rooms > 0;
                        return (
                          <td
                            key={d.date}
                            onClick={() => isAvailable && handleCellClick(row, d.date, cell)}
                            className={`px-2 py-2 text-center border-r border-zinc-100 select-none transition-all ${
                              isAvailable 
                                ? 'cursor-pointer hover:ring-2 hover:ring-zinc-900 hover:ring-inset hover:scale-105 hover:z-10 relative' 
                                : 'cursor-not-allowed opacity-80'
                            } ${cellClass(cell.available_rooms, cell.total_rooms)}`}
                            title={isAvailable 
                              ? `Click to book • ${cell.available_rooms} of ${cell.total_rooms} available • ${cell.booked_rooms} booked${cell.price != null ? ` • ${formatCurrency(cell.price)} / night` : ''}`
                              : `Sold out • ${cell.booked_rooms} booked / ${cell.total_rooms} total`
                            }
                          >
                            <div className="font-bold text-sm">{cell.available_rooms}</div>
                            <div className="text-[10px] opacity-75">of {cell.total_rooms}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 mt-3 text-xs text-zinc-600">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-200" /> Low (≤25%)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-100 border border-rose-200" /> Sold out</span>
              </div>
              <span className="text-zinc-500 font-medium">Tip: Click any available cell to create a booking.</span>
            </div>
          </>
        )}
      </Card>

      <CreateBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setBookingInitialValues(null);
        }}
        initialValues={bookingInitialValues}
      />
    </div>
  );
};

export default AvailabilityMatrixPage;
