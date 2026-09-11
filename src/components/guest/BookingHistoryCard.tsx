import React from 'react';
import {
  MapPin,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle2,
  Users,
  Building2
} from 'lucide-react';
import { GuestBooking } from '../../types';

interface BookingHistoryCardProps {
  booking: GuestBooking;
  isPast?: boolean;
}

export const BookingHistoryCard: React.FC<BookingHistoryCardProps> = ({
  booking,
  isPast = false,
}) => {
  const encodedAddress = encodeURIComponent(
    `${booking.streetAddress}, ${booking.cityArea}, ${booking.state}, Nigeria`
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  const supportWhatsAppUrl = `https://wa.me/2348000000000?text=${encodeURIComponent(
    `Hello Ileya Concierge, I need assistance regarding my reservation for "${booking.listingTitle}" (#ILE-${booking.id.slice(0, 6)}).`
  )}`;

  const photo =
    booking.listingPhoto ||
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="bg-white rounded-2xl border border-[#1B4332]/10 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col md:flex-row">
      {/* Image thumbnail on left for desktop */}
      <div className="relative md:w-72 h-48 md:h-auto shrink-0 bg-[#14231C] overflow-hidden">
        <img
          src={photo}
          alt={booking.listingTitle}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />

        {/* Verification badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#1B4332]/90 backdrop-blur-xs text-[#E8A33D] text-[10px] font-bold flex items-center gap-1 shadow-sm border border-[#E8A33D]/30">
          <ShieldCheck className="w-3.5 h-3.5 text-[#E8A33D]" />
          <span>Verified Apartment</span>
        </div>

        {/* Status indicator */}
        <div className="absolute top-3 right-3">
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-xs ${
              isPast
                ? 'bg-gray-800/80 text-gray-200 border border-gray-600'
                : 'bg-emerald-600/90 text-white border border-emerald-400'
            }`}
          >
            {isPast ? 'Completed Stay' : 'Upcoming Trip'}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px]">
          {booking.propertyType || 'Apartment'}
        </div>
      </div>

      {/* Booking Details on right */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Header Row: Title & Booking Reference */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <h3 className="text-base sm:text-lg font-bold font-serif text-[#1B4332]">
              {booking.listingTitle}
            </h3>
            <span className="text-[11px] font-mono text-[#6B756F]">
              Ref: #ILE-{booking.id.slice(0, 6)}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-[#2D6A4F] font-medium">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#2D6A4F]" />
            <span className="truncate">
              {booking.streetAddress}, {booking.cityArea}, {booking.state} State
            </span>
          </div>

          {/* Booking Data Grid: Dates, Guests, Price */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-[#FBF6EC] border border-[#1B4332]/10 mt-3 text-xs">
            <div>
              <span className="text-[10px] text-[#6B756F] uppercase font-bold block">Check-In</span>
              <span className="font-semibold text-[#14231C] flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-[#2D6A4F]" />
                {booking.checkInDate}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#6B756F] uppercase font-bold block">Check-Out</span>
              <span className="font-semibold text-[#14231C] flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-[#2D6A4F]" />
                {booking.checkOutDate}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#6B756F] uppercase font-bold block">Duration</span>
              <span className="font-semibold text-[#14231C] mt-0.5 block">
                {booking.nights} {booking.nights === 1 ? 'Night' : 'Nights'} • {booking.guestsCount} {booking.guestsCount === 1 ? 'Guest' : 'Guests'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#6B756F] uppercase font-bold block">Total Paid</span>
              <span className="font-extrabold font-serif text-[#1B4332] text-sm mt-0.5 block">
                ₦{booking.totalPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Get Directions, WhatsApp Contact */}
        <div className="pt-3 border-t border-[#1B4332]/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-[#2D6A4F]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>Escrow Guaranteed & Verified</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Get Directions Button */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              id={`directions-btn-${booking.id}`}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#E8A33D] hover:bg-[#d99530] text-[#14231C] transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Get Directions</span>
            </a>

            {/* 24/7 Concierge Support */}
            <a
              href={supportWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              id={`concierge-${booking.id}`}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#2D6A4F]/10 hover:bg-[#2D6A4F]/20 text-[#2D6A4F] transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>24/7 Support</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
