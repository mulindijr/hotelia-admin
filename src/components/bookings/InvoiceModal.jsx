import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Mail, Download, AlertCircle, CheckCircle2, FileText, User } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

const InvoiceModal = ({
  isOpen,
  onClose,
  booking,
  onConfirm,
  isLoading = false
}) => {
  const { formatCurrency } = useCurrency();
  const [emailToGuest, setEmailToGuest] = useState(false);

  // Email validation helper
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const guestEmail = booking?.guest?.email?.trim();
  const hasValidEmail = Boolean(guestEmail && emailRegex.test(guestEmail));
  const guestName = `${booking?.guest?.first_name || ''} ${booking?.guest?.last_name || ''}`.trim() || 'Guest';

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmailToGuest(false);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    onConfirm({ emailToGuest: emailToGuest && hasValidEmail });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) onClose();
      }}
      title="Booking Invoice"
      description={`Reference: ${booking?.booking_reference || 'N/A'}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Booking Summary Box */}
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              Guest
            </span>
            <span className="font-medium text-zinc-900">{guestName}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              Email
            </span>
            <span className={`font-medium ${hasValidEmail ? 'text-zinc-800' : 'text-amber-600'}`}>
              {guestEmail || 'Not configured'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-200/60">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              Total Amount
            </span>
            <span className="font-semibold text-zinc-900">
              {formatCurrency(booking?.grand_total ?? booking?.total_amount ?? 0)}
            </span>
          </div>
        </div>

        {/* Option: Email invoice to guest */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3.5 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 transition-colors">
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="email-invoice-checkbox"
                type="checkbox"
                checked={emailToGuest}
                disabled={!hasValidEmail || isLoading}
                onChange={(e) => setEmailToGuest(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="email-invoice-checkbox"
                className={`text-sm font-medium ${
                  !hasValidEmail ? 'text-zinc-400 cursor-not-allowed' : 'text-zinc-900 cursor-pointer'
                }`}
              >
                Email invoice to guest.
              </label>
              <div className="text-xs text-zinc-500 mt-0.5">
                {hasValidEmail ? (
                  emailToGuest ? (
                    <span className="text-emerald-700 flex items-center gap-1 mt-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      PDF attachment will be sent to {guestEmail}
                    </span>
                  ) : (
                    `Send the invoice as a PDF attachment to ${guestEmail}`
                  )
                ) : (
                  'Guest has no valid email address registered.'
                )}
              </div>
            </div>
          </div>

          {/* Warning notice if email is missing or invalid */}
          {!hasValidEmail && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200/80 rounded-lg text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {guestEmail
                  ? `Guest email "${guestEmail}" is invalid. Please update the guest profile to enable email sending.`
                  : 'This guest does not have an email address on file. Update guest details to enable invoice emailing.'}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {emailToGuest ? (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Download & Email Invoice
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Invoice
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default InvoiceModal;
