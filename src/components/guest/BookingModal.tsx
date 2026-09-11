import React, { useState } from 'react';
import {
  ShieldCheck,
  MapPin,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PropertyListing, GuestBooking } from '../../types';
import { BookNow } from './BookNow';

interface BookingModalProps {
  listing: PropertyListing;
  guestFullName: string;
  guestEmail: string;
  onClose: () => void;
  onConfirmBooking: (bookingData: GuestBooking | {
    listingId: string;
    checkInDate: string;
    checkOutDate: string;
    guestsCount: number;
    totalPrice: number;
    nights: number;
    id?: string;
    [key: string]: any;
  }) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  listing,
  guestFullName,
  guestEmail,
  onClose,
  onConfirmBooking,
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);

  const photos =
    listing.photos && listing.photos.length > 0
      ? listing.photos
      : listing.images && listing.images.length > 0
      ? listing.images
      : [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
        ];

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#1B4332]/10 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1B4332]/10 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-full bg-[#1B4332] text-[#E8A33D] text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Physically Verified by Ileya</span>
            </div>
            <span className="text-xs font-bold text-[#6B756F]">
              • {listing.propertyType}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            id="close-booking-modal-btn"
            className="w-8 h-8 rounded-full bg-[#FBF6EC] hover:bg-[#1B4332]/10 text-[#14231C] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Photos & Verification Info */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden bg-[#14231C] shadow-inner">
                <img
                  src={photos[currentPhotoIndex]}
                  alt={listing.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />

                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevPhoto}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#14231C] flex items-center justify-center backdrop-blur-xs shadow-md transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextPhoto}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#14231C] flex items-center justify-center backdrop-blur-xs shadow-md transition-all cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-mono">
                      {currentPhotoIndex + 1} / {photos.length}
                    </div>
                  </>
                )}

                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#1B4332]/90 text-white text-[11px] font-semibold backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#E8A33D]" />
                  <span>Physical Audit Passed</span>
                </div>
              </div>

              {/* Title & Verified Address */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1B4332]">
                  {listing.title}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-[#6B756F] mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0" />
                  <span>
                    {listing.streetAddress}, {listing.cityArea}, {listing.state}{' '}
                    State, Nigeria
                  </span>
                </div>
              </div>

              {/* Physical Audit Report Note */}
              <div className="p-3.5 rounded-xl bg-[#FBF6EC] border border-[#1B4332]/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B4332]">
                  <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
                  <span>Quality Assurance Inspection Report</span>
                </div>
                <p className="text-xs text-[#6B756F] leading-relaxed">
                  {listing.verificationNotes ||
                    'Inspected by Ileya Quality Assurance Inspector. 24/7 power backup schedule, borehole treated water, high-speed WiFi, and gated security physical presence verified.'}
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#14231C]">
                  About This Space
                </h4>
                <p className="text-xs text-[#6B756F] leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </div>

              {/* Amenities Badges */}
              {listing.amenities && listing.amenities.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#14231C]">
                    Included Verified Amenities
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 text-[#2D6A4F] text-xs font-medium flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#2D6A4F]" />
                        <span>{amenity}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Paystack "Book Now" Component */}
            <div className="lg:col-span-5 flex flex-col justify-start h-full">
              <BookNow
                listing={listing}
                guestFullName={guestFullName}
                guestEmail={guestEmail}
                onClose={onClose}
                onSuccessBooking={(booking: GuestBooking) => {
                  onConfirmBooking(booking);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
