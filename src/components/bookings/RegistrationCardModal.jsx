import React, { useRef } from 'react';
import { Printer, X, Building2, ShieldCheck, Calendar, BedDouble, User, CreditCard } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { useCurrency } from '../../hooks/useCurrency';
import Button from '../common/Button';

const RegistrationCardModal = ({ isOpen, onClose, booking }) => {
  const { activeHotel } = useHotel();
  const { formatCurrency } = useCurrency();
  const printRef = useRef(null);

  if (!isOpen || !booking) return null;

  const guest = booking.guest || {};
  const room = booking.rooms?.[0];
  const hotel = booking.hotel || activeHotel || {};

  const handlePrint = () => {
    window.print();
  };

  const nights = booking.check_in_date && booking.check_out_date
    ? Math.max(1, Math.round((new Date(booking.check_out_date) - new Date(booking.check_in_date)) / (1000 * 60 * 60 * 24)))
    : 1;

  const totalPaid = booking.payments?.filter(p => !p.status || p.status === 'completed').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
  const grandTotal = Number(booking.grand_total ?? booking.total_amount ?? 0);
  const balanceDue = Math.max(0, grandTotal - totalPaid);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #registration-card-print-area, #registration-card-print-area * {
            visibility: visible;
          }
          #registration-card-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Toolbar (hidden during print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-zinc-900 text-white border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Printer className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold tracking-wide">Guest Registration Card</h3>
              <p className="text-xs text-zinc-400">Printable check-in folio for {guest.first_name} {guest.last_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-1.5 px-3 text-xs"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print Card
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors hover:bg-zinc-800"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="overflow-y-auto p-8 text-zinc-900 bg-white" id="registration-card-print-area" ref={printRef}>
          {/* Header */}
          <div className="border-b-2 border-zinc-900 pb-5 mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-zinc-900 uppercase">
                  {hotel.name || 'Hotelia Resort & Suites'}
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-1 max-w-md">
                {hotel.address || 'Hospitality Blvd, Waterfront District'} • Tel: {hotel.phone || '+254 700 000 000'}
              </p>
              <p className="text-xs text-zinc-500">
                Email: {hotel.email || 'frontdesk@hotelia.pms'} • Web: www.hotelia.pms
              </p>
            </div>
            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider rounded">
                Registration Card
              </span>
              <p className="text-sm font-mono font-bold text-zinc-900 mt-2">
                Ref: {booking.booking_reference}
              </p>
              <p className="text-[11px] text-zinc-500">
                Date: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Section 1: Guest Information */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 pb-1 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              1. Guest Information
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs">
              <div>
                <span className="text-zinc-500 block">Full Name:</span>
                <span className="font-bold text-sm text-zinc-900">
                  {guest.first_name} {guest.last_name}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Nationality:</span>
                <span className="font-medium text-zinc-800">{guest.nationality || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Passport / National ID:</span>
                <span className="font-mono font-medium text-zinc-800">
                  {guest.passport_number || guest.national_id || '—'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Phone Number:</span>
                <span className="font-medium text-zinc-800">{guest.phone || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Email Address:</span>
                <span className="font-medium text-zinc-800">{guest.email || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Residential Address:</span>
                <span className="font-medium text-zinc-800">{guest.address || guest.country || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Reservation & Stay Details */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 pb-1 mb-3 flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5 text-zinc-400" />
              2. Stay Information
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4 text-xs bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <div>
                <span className="text-zinc-500 block">Room Number:</span>
                <span className="font-black text-base text-zinc-900">
                  {room?.room_number ? `Room ${room.room_number}` : 'Unassigned'}
                </span>
                <span className="text-[11px] text-zinc-500 block">{room?.room_type?.name || 'Standard'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Arrival Date:</span>
                <span className="font-bold text-zinc-900">
                  {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : '—'}
                </span>
                <span className="text-[11px] text-zinc-500 block">Check-in: 14:00</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Departure Date:</span>
                <span className="font-bold text-zinc-900">
                  {booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : '—'}
                </span>
                <span className="text-[11px] text-zinc-500 block">Check-out: 11:00</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Duration & Guests:</span>
                <span className="font-bold text-zinc-900">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                <span className="text-[11px] text-zinc-500 block">
                  {booking.adults || 1} Adult{booking.adults > 1 ? 's' : ''}, {booking.children || 0} Children
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Billing & Rates Summary */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 pb-1 mb-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
              3. Rate & Billing Summary
            </h4>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="border border-zinc-200 rounded-lg p-3">
                <span className="text-zinc-500 block">Total Accommodation</span>
                <span className="text-sm font-bold text-zinc-900">{formatCurrency(grandTotal)}</span>
              </div>
              <div className="border border-zinc-200 rounded-lg p-3">
                <span className="text-zinc-500 block">Total Payments</span>
                <span className="text-sm font-bold text-emerald-600">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50">
                <span className="text-zinc-500 block">Balance Due at Check-In/Out</span>
                <span className="text-sm font-bold text-zinc-900">{formatCurrency(balanceDue)}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Terms and House Rules */}
          <div className="mb-8 border border-zinc-200 rounded-lg p-4 bg-zinc-50/50 text-[11px] text-zinc-600 space-y-1.5">
            <h5 className="font-bold uppercase tracking-wider text-zinc-800 text-[11px] mb-1">
              Guest Declaration & Hotel Rules
            </h5>
            <p>
              1. <strong>Check-Out Policy:</strong> Standard check-out time is 11:00 AM. Late check-out without prior authorization may incur additional half-day or full-day room charges.
            </p>
            <p>
              2. <strong>Smoking & Damages:</strong> All guest rooms and indoor areas are strictly non-smoking. A cleaning fee will be assessed for smoking violations. Guests will be billed for any damage or loss of hotel inventory.
            </p>
            <p>
              3. <strong>Valuables:</strong> Management is not liable for jewelry, cash, or valuables left unattended in rooms. In-room safes and front-office security deposits are available.
            </p>
            <p>
              4. <strong>Acknowledgment:</strong> I confirm that the information provided is correct, and I agree to the terms, conditions, and payment obligations of this stay.
            </p>
          </div>

          {/* Section 5: Signature Blocks */}
          <div className="grid grid-cols-2 gap-12 pt-4">
            <div>
              <div className="border-b border-zinc-400 h-14 mb-2"></div>
              <p className="text-xs font-bold text-zinc-900">Guest Signature</p>
              <p className="text-[11px] text-zinc-500">Date: ________________________</p>
            </div>
            <div>
              <div className="border-b border-zinc-400 h-14 mb-2"></div>
              <p className="text-xs font-bold text-zinc-900">Front Desk Receptionist</p>
              <p className="text-[11px] text-zinc-500">Date: ________________________</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationCardModal;
