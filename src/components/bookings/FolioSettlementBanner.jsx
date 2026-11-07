import React from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Receipt
} from 'lucide-react';
import Button from '../common/Button';
import { useCurrency } from '../../hooks/useCurrency';

/**
 * FolioSettlementBanner
 * High-visibility billing banner showing:
 * - Current Folio settlement status badge (Paid in Full vs Unsettled Balance vs Credit)
 * - Folio metrics: Total Charges, Total Paid, Balance Due
 * - Quick-action button: 1-click "Collect Balance" which opens AddPaymentModal prefilled
 */
const FolioSettlementBanner = ({
  grandTotal = 0,
  totalPaid = 0,
  balanceDue = 0,
  paymentsCount = 0,
  onCollectBalance,
  onViewInvoice,
  isCollecting = false
}) => {
  const { formatCurrency } = useCurrency();

  // Determine settlement state
  const isSettled = balanceDue === 0 && grandTotal > 0;
  const isOverpaid = balanceDue < 0;
  const hasOutstanding = balanceDue > 0;
  const isZeroFolio = grandTotal === 0 && totalPaid === 0;

  return (
    <div className={`rounded-xl border p-5 shadow-xs transition-colors ${
      hasOutstanding 
        ? 'bg-rose-50/40 border-rose-200' 
        : isOverpaid 
          ? 'bg-amber-50/40 border-amber-200' 
          : 'bg-white border-zinc-200'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        
        {/* Left: Folio Status & Description */}
        <div className="space-y-1.5 max-w-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Guest Folio
            </span>
            {hasOutstanding && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                Balance Due
              </span>
            )}
            {isSettled && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Paid in Full
              </span>
            )}
            {isOverpaid && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <RefreshCw className="w-3 h-3 text-amber-600" />
                Credit Balance
              </span>
            )}
            {isZeroFolio && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                Zero Folio
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-600">
            {hasOutstanding && `Outstanding folio balance of ${formatCurrency(balanceDue)} awaiting settlement.`}
            {isSettled && 'All room charges and incidental service fees have been fully settled.'}
            {isOverpaid && `Folio overpaid by ${formatCurrency(Math.abs(balanceDue))}. Guest credit or refund due.`}
            {isZeroFolio && 'No charges have been posted to this folio yet.'}
          </p>
        </div>

        {/* Center: 3 Metric Counters */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 py-2 px-3 sm:px-4 bg-white/80 backdrop-blur-xs rounded-lg border border-zinc-200/80">
          <div>
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Total Charges</p>
            <p className="text-base sm:text-lg font-bold text-zinc-900 mt-0.5">{formatCurrency(grandTotal)}</p>
            <p className="text-[10px] text-zinc-400 truncate mt-0.5 hidden sm:block">
              Rooms + Extras + Tax
            </p>
          </div>

          <div className="border-l border-zinc-200/80 pl-4 sm:pl-6">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Total Paid</p>
            <p className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5">{formatCurrency(totalPaid)}</p>
            <p className="text-[10px] text-zinc-400 truncate mt-0.5 hidden sm:block">
              {paymentsCount} {paymentsCount === 1 ? 'payment' : 'payments'} recorded
            </p>
          </div>

          <div className="border-l border-zinc-200/80 pl-4 sm:pl-6">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Balance Due</p>
            <p className={`text-base sm:text-lg font-black mt-0.5 ${
              hasOutstanding 
                ? 'text-rose-600' 
                : isOverpaid 
                  ? 'text-amber-600' 
                  : 'text-zinc-900'
            }`}>
              {isOverpaid ? '-' : ''}{formatCurrency(Math.abs(balanceDue))}
            </p>
            <p className="text-[10px] text-zinc-400 truncate mt-0.5 hidden sm:block">
              {hasOutstanding ? 'Due immediately' : (isOverpaid ? 'Refund due' : 'Settled to zero')}
            </p>
          </div>
        </div>

        {/* Right: Quick Action Button */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto sm:shrink-0 justify-end">
          {hasOutstanding ? (
            <Button
              onClick={onCollectBalance}
              disabled={isCollecting}
              className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white font-semibold shadow-xs flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Collect Balance ({formatCurrency(balanceDue)})</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onViewInvoice && (
                <Button
                  variant="secondary"
                  onClick={onViewInvoice}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
                >
                  <Receipt className="w-4 h-4 text-zinc-500" />
                  <span>Invoice</span>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={onCollectBalance}
                className="flex-1 sm:flex-initial text-xs border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                title="Record additional deposit or advance payment"
              >
                + Add Payment
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FolioSettlementBanner;
