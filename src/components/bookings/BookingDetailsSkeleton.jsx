import React from 'react';
import Skeleton from '../common/Skeleton';
import Card from '../common/Card';

const BookingDetailsSkeleton = () => {
  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-150">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Back button skeleton */}
          <div className="p-2 w-9 h-9 bg-white border border-zinc-200 rounded-lg flex items-center justify-center">
            <Skeleton className="w-5 h-5 rounded" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-60 sm:w-72 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-40 rounded mt-2" />
          </div>
        </div>

        {/* Action Buttons skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* 2. Top Info Cards (Guest Details + Stay Information) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Guest Details Card */}
        <Card title="Guest Details" className="col-span-1">
          <div className="space-y-4">
            <div>
              <Skeleton className="h-3 w-10 rounded mb-1.5" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
            <div>
              <Skeleton className="h-3 w-10 rounded mb-1.5" />
              <Skeleton className="h-4 w-44 rounded" />
            </div>
            <div>
              <Skeleton className="h-3 w-12 rounded mb-1.5" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
          </div>
        </Card>

        {/* Stay Information Card */}
        <Card title="Stay Information" className="col-span-1 md:col-span-2">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Skeleton className="h-3 w-16 rounded mb-1.5" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
            <div>
              <Skeleton className="h-3 w-16 rounded mb-1.5" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
            <div>
              <Skeleton className="h-3 w-14 rounded mb-1.5" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
            <div>
              <Skeleton className="h-3 w-16 rounded mb-1.5" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
            <div className="col-span-2">
              <Skeleton className="h-3 w-24 rounded mb-1.5" />
              <Skeleton className="h-4 w-48 rounded" />
            </div>
          </div>
        </Card>

        {/* Services & Extras Card */}
        <Card
          title="Services & Extras"
          subtitle="Additional services charged to this booking"
          className="col-span-1 md:col-span-3"
          headerActions={<Skeleton className="h-8 w-28 rounded-lg" />}
        >
          <div className="overflow-hidden rounded-lg border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Service Name</th>
                  <th className="px-4 py-2 font-medium text-center">Quantity</th>
                  <th className="px-4 py-2 font-medium text-right">Unit Price</th>
                  <th className="px-4 py-2 font-medium text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                <tr>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-36 rounded" /></td>
                  <td className="px-4 py-3 text-center"><Skeleton className="h-4 w-8 mx-auto rounded" /></td>
                  <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-16 ml-auto rounded" /></td>
                  <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-20 ml-auto rounded" /></td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-28 rounded" /></td>
                  <td className="px-4 py-3 text-center"><Skeleton className="h-4 w-8 mx-auto rounded" /></td>
                  <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-16 ml-auto rounded" /></td>
                  <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-20 ml-auto rounded" /></td>
                </tr>
              </tbody>
              <tfoot className="bg-zinc-50 border-t border-zinc-200">
                <tr>
                  <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-zinc-900 text-right">
                    Services Subtotal
                  </td>
                  <td className="px-4 py-2.5 text-sm font-bold text-zinc-900 text-right">
                    <Skeleton className="h-4 w-20 ml-auto rounded" />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>

      {/* 3. Financial Summary Card */}
      <Card title="Financial Summary">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 py-3 border-b border-zinc-100">
            {/* 1. Rooms Subtotal */}
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>

            {/* 2. Services Subtotal */}
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>

            {/* 3. Tax */}
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>

            {/* 4. Total Booking Amount */}
            <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-6 w-28 rounded" />
            </div>

            {/* 5. Remaining Balance */}
            <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
              <Skeleton className="h-5 w-36 rounded" />
              <Skeleton className="h-7 w-28 rounded" />
            </div>
          </div>

          {/* Payment History section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>

            <div className="overflow-hidden rounded-lg border border-zinc-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium">Method</th>
                    <th className="px-4 py-2 font-medium">Ref</th>
                    <th className="px-4 py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  <tr>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32 rounded" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16 rounded" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20 rounded" /></td>
                    <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-20 ml-auto rounded" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BookingDetailsSkeleton;
