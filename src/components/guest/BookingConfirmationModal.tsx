import React from 'react';
import {
  CheckCircle2,
  MapPin,
  Calendar,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  Share2,
  Phone,
  Mail,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { PropertyListing } from '../../types';

interface BookingConfirmationModalProps {
  listing: PropertyListing;
  bookingDetails: {
    checkInDate: string;
    checkOutDate: string;
    guestsCount: number;
    totalPrice: number;
    nights: number;
  };
  guestFullName: string;
  guestEmail: string;
  onClose: () => void;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  listing,
  bookingDetails,
  guestFullName,
  guestEmail,
  onClose,
}) => {
  // Format Maps directions URL with full street address and state
  const encodedAddress = encodeURIComponent(
    `${listing.streetAddress}, ${listing.cityArea}, ${listing.state}, Nigeria`
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  // 24/7 Ileya WhatsApp Support Link
  const supportWhatsAppUrl = `https://wa.me/2348000000000?text=${encodeURIComponent(
    `Hello Ileya Support, I just confirmed my booking for "${listing.title}" in ${listing.cityArea}, ${listing.state}. My reservation code is #ILE-${listing.id.slice(0, 6)}.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#1B4332]/10 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Header Banner */}
        <div className="bg-[#1B4332] text-white p-6 text-center relative overflow-hidden">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E8A33D] text-[#14231C] flex items-center justify-center mb-3 shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E8A33D] px-2.5 py-0.5 rounded-full bg-white/10">
            Reservation Secured
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-serif mt-2">
            Booking Confirmed & Escrow Funded!
          </h2>
          <p className="text-xs text-white/80 max-w-md mx-auto mt-1">
            Thank you, <strong className="text-white">{guestFullName || 'Guest'}</strong>. Your stay at {listing.title} has been booked.
          </p>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Reservation Summary Card */}
          <div className="p-4 rounded-2xl bg-[#FBF6EC] border border-[#1B4332]/10 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1B4332]/10 pb-2">
              <span className="text-xs font-bold text-[#14231C]">{listing.title}</span>
              <span className="text-xs font-mono font-bold text-[#2D6A4F]">
                ₦{bookingDetails.totalPrice.toLocaleString()} ({bookingDetails.nights} {bookingDetails.nights === 1 ? 'Night' : 'Nights'})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[#6B756F] block text-[11px]">Check-In</span>
                <span className="font-bold text-[#14231C] flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  {bookingDetails.checkInDate}
                </span>
              </div>

              <div>
                <span className="text-[#6B756F] block text-[11px]">Check-Out</span>
                <span className="font-bold text-[#14231C] flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  {bookingDetails.checkOutDate}
                </span>
              </div>

              <div>
                <span className="text-[#6B756F] block text-[11px]">Guests</span>
                <span className="font-bold text-[#14231C] mt-0.5 block">
                  {bookingDetails.guestsCount} {bookingDetails.guestsCount === 1 ? 'Guest' : 'Guests'}
                </span>
              </div>
            </div>
          </div>

          {/* Exact Street Address & Google Maps link */}
          <div className="p-4 rounded-2xl bg-white border border-[#1B4332]/10 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B4332]">
              <MapPin className="w-4 h-4 text-[#2D6A4F]" />
              <span>Exact Physical Address & Navigation</span>
            </div>

            <div className="p-3 rounded-xl bg-[#FBF6EC] border border-[#1B4332]/10">
              <p className="text-xs font-bold text-[#14231C]">
                {listing.streetAddress}
              </p>
              <p className="text-xs text-[#6B756F] mt-0.5">
                {listing.cityArea}, {listing.state} State, Nigeria
              </p>
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="google-maps-directions-link"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#1B4332] bg-[#E8A33D]/20 hover:bg-[#E8A33D]/30 border border-[#E8A33D]/40 px-3.5 py-2 rounded-xl transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#E8A33D]" />
              <span>Open in Google Maps for Turn-by-Turn Directions</span>
            </a>
          </div>

          {/* 24/7 Ileya Concierge Support Notification & Quality Assurance */}
          <div>
            <a
              href={supportWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="whatsapp-support-btn"
              className="p-4 rounded-2xl bg-[#2D6A4F]/10 hover:bg-[#2D6A4F]/20 border border-[#2D6A4F]/30 transition-all flex items-center gap-3.5 text-left group w-full"
            >
              <div className="w-11 h-11 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center shrink-0 shadow-sm">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-[#1B4332] block group-hover:text-[#2D6A4F]">
                  24/7 Ileya Concierge & Arrival Support
                </span>
                <span className="text-[11px] text-[#6B756F] block mt-0.5">
                  Direct WhatsApp concierge for arrival coordination, property directions, and key handoff assistance
                </span>
              </div>
            </a>
          </div>

          {/* Host Simulated Email Dispatch Notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              Automated reservation dispatch sent to Host (<strong>{listing.hostEmail || 'host@ileya.ng'}</strong>) and Guest (<strong>{guestEmail}</strong>).
            </span>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 border-t border-[#1B4332]/10 bg-[#FBF6EC] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#2D6A4F] font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
            <span>Check-in Escrow Guaranteed</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            id="done-booking-btn"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#E8A33D] hover:bg-[#d99530] text-[#14231C] transition-all cursor-pointer shadow-sm"
          >
            Back to Apartment Directory
          </button>
        </div>
      </div>
    </div>
  );
};
