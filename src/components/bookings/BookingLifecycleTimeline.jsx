import React from 'react';
import { 
  CalendarCheck, 
  CheckCircle2, 
  LogIn, 
  LogOut, 
  Ban, 
  UserX, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) 
    ? '—' 
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) 
    ? '—' 
    : `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

/**
 * BookingLifecycleTimeline
 * Visual step progression showing the current stage of the reservation:
 * Booked -> Confirmed -> Checked In -> Checked Out
 * Handles cancelled and no-show terminal branches cleanly.
 */
const BookingLifecycleTimeline = ({ booking }) => {
  if (!booking) return null;

  const { status, created_at, check_in_date, check_out_date, actual_check_in_at, actual_check_out_at, updated_at } = booking;

  // Calculate nights of stay
  let nights = 0;
  if (check_in_date && check_out_date) {
    const start = new Date(check_in_date);
    const end = new Date(check_out_date);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    nights = diff > 0 ? diff : 1;
  }

  // Handle Cancelled State
  if (status === 'cancelled') {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Reservation Lifecycle</h3>
            <p className="text-xs text-zinc-500">Scheduled: {formatDate(check_in_date)} — {formatDate(check_out_date)} ({nights} {nights === 1 ? 'night' : 'nights'})</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 self-start sm:self-auto">
            <Ban className="w-3.5 h-3.5" />
            Cancelled Reservation
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Step 1 • Created</p>
              <h4 className="text-sm font-bold text-zinc-900">Booking Placed</h4>
              <p className="text-xs text-zinc-500 mt-0.5">{formatDateTime(created_at)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-rose-50 border border-rose-200">
            <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
              <Ban className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Terminal • Cancelled</p>
              <h4 className="text-sm font-bold text-rose-900">Reservation Cancelled</h4>
              <p className="text-xs text-rose-700 mt-0.5">Voided on {formatDateTime(updated_at)}</p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center gap-2.5 text-xs text-zinc-600">
          <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0" />
          <span>This booking has been cancelled. Allocated room inventory has been returned to the available pool.</span>
        </div>
      </div>
    );
  }

  // Handle No-Show State
  if (status === 'no_show') {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Reservation Lifecycle</h3>
            <p className="text-xs text-zinc-500">Scheduled: {formatDate(check_in_date)} — {formatDate(check_out_date)} ({nights} {nights === 1 ? 'night' : 'nights'})</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 self-start sm:self-auto">
            <UserX className="w-3.5 h-3.5" />
            Guest No-Show
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Step 1</p>
              <h4 className="text-sm font-bold text-zinc-900">Booking Placed</h4>
              <p className="text-xs text-zinc-500 mt-0.5">{formatDateTime(created_at)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Step 2</p>
              <h4 className="text-sm font-bold text-zinc-900">Confirmed</h4>
              <p className="text-xs text-zinc-500 mt-0.5">Reservation Confirmed</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-amber-50 border border-amber-200">
            <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
              <UserX className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Terminal</p>
              <h4 className="text-sm font-bold text-amber-900">Marked No-Show</h4>
              <p className="text-xs text-amber-700 mt-0.5">Missed check-in on {formatDate(check_in_date)}</p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg flex items-center gap-2.5 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>The guest did not arrive on the scheduled arrival date. The reservation is marked as a No-Show.</span>
        </div>
      </div>
    );
  }

  // Standard Lifecycle Steps: Booked -> Confirmed -> Checked In -> Checked Out
  const steps = [
    {
      id: 'booked',
      label: 'Booked',
      icon: CalendarCheck,
      isCompleted: true,
      isCurrent: status === 'pending',
      subtext: formatDateTime(created_at),
      detail: 'Reservation received',
    },
    {
      id: 'confirmed',
      label: 'Confirmed',
      icon: CheckCircle2,
      isCompleted: status === 'confirmed' || status === 'checked_in' || status === 'checked_out',
      isCurrent: status === 'confirmed',
      subtext: status === 'pending' ? 'Pending Confirmation' : 'Reservation Confirmed',
      detail: status === 'pending' ? 'Action required' : 'Room reserved',
    },
    {
      id: 'checked_in',
      label: 'Checked In',
      icon: LogIn,
      isCompleted: status === 'checked_out',
      isCurrent: status === 'checked_in',
      subtext: actual_check_in_at 
        ? formatDateTime(actual_check_in_at) 
        : `Expected: ${formatDate(check_in_date)}`,
      detail: status === 'checked_in' ? 'Currently In-House' : (status === 'checked_out' ? 'Completed stay' : 'Awaiting arrival'),
    },
    {
      id: 'checked_out',
      label: 'Checked Out',
      icon: LogOut,
      isCompleted: status === 'checked_out',
      isCurrent: false,
      subtext: actual_check_out_at 
        ? formatDateTime(actual_check_out_at) 
        : `Expected: ${formatDate(check_out_date)}`,
      detail: status === 'checked_out' ? 'Stay completed' : 'Scheduled departure',
    },
  ];

  // Derive current phase label
  const phaseMap = {
    pending: 'Phase 1 of 4 • Pending Confirmation',
    confirmed: 'Phase 2 of 4 • Confirmed (Upcoming Arrival)',
    checked_in: 'Phase 3 of 4 • In-House Guest',
    checked_out: 'Phase 4 of 4 • Completed Stay',
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Reservation Lifecycle</h3>
          <p className="text-xs text-zinc-500">
            {formatDate(check_in_date)} — {formatDate(check_out_date)} ({nights} {nights === 1 ? 'night' : 'nights'})
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          {phaseMap[status] || status}
        </span>
      </div>

      {/* Stepper Progress Bar */}
      <div className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = step.isCompleted;
            const isCurrent = step.isCurrent;

            return (
              <div key={step.id} className="relative flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 text-left sm:text-center group">
                {/* Connecting Line (for desktop) */}
                {idx < steps.length - 1 && (
                  <div 
                    className={`hidden sm:block absolute top-4.5 left-1/2 w-full h-0.5 -z-0 transition-colors ${
                      steps[idx + 1].isCompleted || (step.isCompleted && !isCurrent)
                        ? 'bg-zinc-900' 
                        : 'bg-zinc-200'
                    }`}
                  />
                )}

                {/* Step Circle / Badge */}
                <div 
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isCurrent
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-xs'
                      : isCompleted
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-400 border border-zinc-300'
                  }`}
                  title={`${step.label} - ${step.detail}`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Step Details */}
                <div className="min-w-0">
                  <div className="flex items-center sm:justify-center gap-1.5">
                    <p className={`text-xs font-bold uppercase tracking-wider ${
                      isCurrent 
                        ? 'text-emerald-700' 
                        : isCompleted 
                          ? 'text-zinc-900' 
                          : 'text-zinc-400'
                    }`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 font-medium truncate mt-0.5">{step.subtext}</p>
                  <p className="text-[11px] text-zinc-400 hidden sm:block mt-0.5">{step.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BookingLifecycleTimeline;
