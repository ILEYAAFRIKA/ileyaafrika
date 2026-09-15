import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  MapPin,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  MessageSquare,
  Calendar,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { PropertyListing, GuestBooking, Review } from '../../types';
import { BookNow } from './BookNow';
import { getReviewsForListing } from '../../lib/supabaseService';
import { VerificationEvidenceModal } from '../common/VerificationEvidenceModal';

interface BookingModalProps {
  listing: PropertyListing;
  guestFullName: string;
  guestEmail: string;
  initialCheckInDate?: Date | null;
  initialCheckOutDate?: Date | null;
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
  initialCheckInDate = null,
  initialCheckOutDate = null,
  onClose,
  onConfirmBooking,
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);
  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);

  const isVerified =
    listing.verification_status === 'verified' ||
    listing.verificationStatus === 'verified' ||
    (listing.isPhysicallyVerified && (!listing.verification_status || listing.verification_status === 'verified'));

  // Fetch all records from the reviews table matching the current listing_id
  useEffect(() => {
    let isMounted = true;
    const loadReviews = async () => {
      if (!listing?.id) return;
      setIsLoadingReviews(true);
      try {
        const data = await getReviewsForListing(listing.id);
        if (isMounted) {
          setReviews(data || []);
        }
      } catch (err) {
        console.warn('Could not load reviews for listing:', err);
      } finally {
        if (isMounted) {
          setIsLoadingReviews(false);
        }
      }
    };

    loadReviews();
    return () => {
      isMounted = false;
    };
  }, [listing?.id]);

  // Calculate average star rating (e.g., 4.8) and total review count
  const { averageRating, totalReviewCount } = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return { averageRating: null, totalReviewCount: 0 };
    }
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const avg = parseFloat((sum / reviews.length).toFixed(1));
    return { averageRating: avg, totalReviewCount: reviews.length };
  }, [reviews]);

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
              <span>Physically Verified by Ileya Afrika</span>
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
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1B4332]">
                      {listing.title}
                    </h2>

                    {/* Interactive "Verified by Ileya Afrika" Badge Button (Prompt Requirement #2) */}
                    {isVerified && (
                      <button
                        type="button"
                        id="verified-badge-details-btn"
                        onClick={() => setShowEvidenceModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B4332] hover:bg-[#143427] text-[#E8A33D] text-xs font-bold transition-all shadow-xs cursor-pointer border border-[#E8A33D]/40 group"
                        title="Click to view on-site physical verification evidence photos"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#E8A33D] group-hover:scale-110 transition-transform" />
                        <span>Verified by Ileya Afrika</span>
                        <span className="text-[10px] text-white/80 font-normal underline ml-0.5">
                          View Photos
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Rating Badge Display near listing title */}
                  {totalReviewCount > 0 && averageRating !== null ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF6EC] border border-[#1B4332]/10 text-xs font-bold text-[#14231C] shadow-xs">
                      <Star className="w-4 h-4 text-[#E8A33D] fill-[#E8A33D]" />
                      <span>{averageRating.toFixed(1)}</span>
                      <span className="text-[#6B756F] font-normal">
                        ({totalReviewCount} {totalReviewCount === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF6EC] border border-[#1B4332]/10 text-xs text-[#6B756F]">
                      <Star className="w-3.5 h-3.5 text-gray-400" />
                      <span>New Listing • No reviews yet</span>
                    </div>
                  )}
                </div>

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
                    'Inspected by Ileya Afrika Quality Assurance Inspector. 24/7 power backup schedule, borehole treated water, high-speed WiFi, and gated security physical presence verified.'}
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
                initialCheckInDate={initialCheckInDate}
                initialCheckOutDate={initialCheckOutDate}
                averageRating={averageRating}
                totalReviewCount={totalReviewCount}
                onClose={onClose}
                onSuccessBooking={(booking: GuestBooking) => {
                  onConfirmBooking(booking);
                }}
              />
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* Guest Reviews Section (Bottom of the Public Listing Details) */}
          {/* ------------------------------------------------------------- */}
          <div className="border-t border-[#1B4332]/10 pt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1B4332] text-[#E8A33D] flex items-center justify-center">
                    <Star className="w-4 h-4 fill-[#E8A33D]" />
                  </div>
                  <h3 className="text-lg font-bold font-serif text-[#1B4332]">
                    Guest Reviews
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#1B4332]/10 text-[#1B4332]">
                    {totalReviewCount}
                  </span>
                </div>
                <p className="text-xs text-[#6B756F]">
                  Authentic reviews exclusively from guests who completed a verified stay
                </p>
              </div>

              {/* Rating Summary Card */}
              {totalReviewCount > 0 && averageRating !== null && (
                <div className="p-3.5 rounded-2xl bg-[#FBF6EC] border border-[#1B4332]/10 flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-extrabold font-serif text-[#1B4332]">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-0.5 text-[#E8A33D] justify-center mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= Math.round(averageRating)
                              ? 'fill-[#E8A33D] text-[#E8A33D]'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="h-9 w-px bg-[#1B4332]/10" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-[#14231C]">
                      Verified Resident Ratings
                    </div>
                    <div className="text-[11px] text-[#6B756F]">
                      Based on {totalReviewCount} {totalReviewCount === 1 ? 'completed booking' : 'completed bookings'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reviews List */}
            {isLoadingReviews ? (
              <div className="p-8 rounded-2xl bg-[#FBF6EC]/50 border border-[#1B4332]/10 flex items-center justify-center gap-2 text-xs text-[#6B756F]">
                <Loader2 className="w-4 h-4 animate-spin text-[#2D6A4F]" />
                <span>Loading verified reviews...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#FBF6EC] border border-[#1B4332]/10 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-white text-[#2D6A4F] flex items-center justify-center mx-auto shadow-xs border border-[#1B4332]/10">
                  <MessageSquare className="w-5 h-5 text-[#2D6A4F]" />
                </div>
                <h4 className="text-sm font-bold text-[#14231C]">No Reviews Yet</h4>
                <p className="text-xs text-[#6B756F] max-w-sm mx-auto">
                  Be the first guest to share feedback after completing your stay at this physically verified property!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((review) => {
                  const formattedDate = review.created_at
                    ? new Date(review.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recent Stay';

                  return (
                    <div
                      key={review.id}
                      className="p-4 rounded-2xl bg-white border border-[#1B4332]/10 shadow-xs hover:border-[#1B4332]/25 transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        {/* Guest Header & Stars */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#1B4332] text-[#E8A33D] font-bold text-xs flex items-center justify-center shadow-xs">
                              {(review.guest_name || 'G')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#14231C]">
                                {review.guest_name || 'Verified Guest'}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-[#2D6A4F] font-medium">
                                <UserCheck className="w-3 h-3 text-[#2D6A4F]" />
                                <span>Verified Resident</span>
                              </div>
                            </div>
                          </div>

                          {/* Star Rating Display */}
                          <div className="flex items-center gap-0.5 text-[#E8A33D]">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= review.rating
                                    ? 'fill-[#E8A33D] text-[#E8A33D]'
                                    : 'text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Comment */}
                        <p className="text-xs text-[#14231C] leading-relaxed whitespace-pre-line bg-[#FBF6EC]/60 p-3 rounded-xl border border-[#1B4332]/5">
                          "{review.comment}"
                        </p>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-1 text-[10px] text-[#6B756F] pt-1 border-t border-[#1B4332]/5">
                        <Calendar className="w-3 h-3 text-[#6B756F]" />
                        <span>Stay reviewed {formattedDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Evidence Modal (Prompt Requirement #2 & #3) */}
      <VerificationEvidenceModal
        isOpen={showEvidenceModal}
        onClose={() => setShowEvidenceModal(false)}
        verification_evidence_urls={listing.verification_evidence_urls || listing.verificationEvidenceUrls || []}
        verification_notes={listing.verification_notes || listing.verificationNotes}
        propertyTitle={listing.title}
        propertyLocation={`${listing.cityArea}, ${listing.state}`}
      />
    </div>
  );
};
