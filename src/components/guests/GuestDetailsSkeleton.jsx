import React from 'react';
import Skeleton from '../common/Skeleton';
import Card from '../common/Card';

const GuestDetailsSkeleton = () => {
  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-150">
      {/* 1. Header Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 w-9 h-9 bg-white border border-zinc-200 rounded-lg flex items-center justify-center">
            <Skeleton className="w-5 h-5 rounded" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-56 rounded-lg" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-40 rounded mt-2" />
          </div>
        </div>
        <div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* 2. Financial & Stay Summary KPI Grid (6 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-16 rounded" />
              <Skeleton className="w-4 h-4 rounded-full" />
            </div>
            <Skeleton className="h-7 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* 3. Main Content: Profile Info & Booking History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card title="Guest Information" className="col-span-1 h-fit">
          <div className="space-y-4">
            <div>
              <Skeleton className="h-3 w-16 rounded mb-1.5" />
              <Skeleton className="h-4 w-40 rounded" />
            </div>
            <div>
              <Skeleton className="h-3 w-12 rounded mb-1.5" />
              <Skeleton className="h-4 w-48 rounded" />
            </div>
            <div>
              <Skeleton className="h-3 w-14 rounded mb-1.5" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
            <div>
              <Skeleton className="h-3 w-20 rounded mb-1.5" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
            <div>
              <Skeleton className="h-3 w-24 rounded mb-1.5" />
              <Skeleton className="h-4 w-36 rounded" />
            </div>
            <div>
              <Skeleton className="h-3 w-20 rounded mb-1.5" />
              <Skeleton className="h-4 w-36 rounded" />
            </div>
          </div>
        </Card>

        {/* Booking History Card */}
        <Card 
          title="Booking History" 
          subtitle="All bookings registered at this hotel" 
          className="col-span-1 lg:col-span-2"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 pb-1">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
            <div className="overflow-hidden rounded-lg border border-zinc-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Reference</th>
                    <th className="px-4 py-2.5 font-medium">Dates</th>
                    <th className="px-4 py-2.5 font-medium">Room</th>
                    <th className="px-4 py-2.5 font-medium text-right">Total</th>
                    <th className="px-4 py-2.5 font-medium text-center">Status</th>
                    <th className="px-4 py-2.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24 rounded" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32 rounded" /></td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-16 rounded" />
                        <Skeleton className="h-3 w-24 rounded mt-1" />
                      </td>
                      <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-16 ml-auto rounded" /></td>
                      <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                      <td className="px-4 py-3 text-right"><Skeleton className="h-7 w-20 ml-auto rounded" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GuestDetailsSkeleton;
