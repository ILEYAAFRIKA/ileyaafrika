import React, { useState } from 'react';
import {
  Star,
  X,
  ShieldCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Send,
  Loader2,
  Building2
} from 'lucide-react';
import { GuestBooking, Review } from '../../types';
import { isCheckoutDateStrictlyPast, insertReviewToSupabase } from '../../lib/supabaseService';

interface ReviewModalProps {
  booking: GuestBooking;
  guestName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (review: Review) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: '1 Star — Unsatisfactory stay',
  2: '2 Stars — Below expectations',
  3: '3 Stars — Average / Satisfactory',
  4: '4 Stars — Very good short-let',
  5: '5 Stars — Exceptional! Highly recommended',
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  booking,
  guestName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const checkoutDateStr = booking.checkOutDate || (booking as any).check_out_date || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Submission Guard: Before calling Supabase .insert(), re-verify that the check-out date is in the past.
    // If the user somehow bypasses the UI to submit early, block the insert and show an error toast.
    if (!isCheckoutDateStrictlyPast(checkoutDateStr)) {
      setErrorMessage('Reviews can only be submitted after your stay is fully completed.');
      return;
    }

    if (!comment.trim()) {
      setErrorMessage('Please share a brief comment about your experience.');
      return;
    }

    if (rating < 1 || rating > 5) {
      setErrorMessage('Please select a rating between 1 and 5 stars.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await insertReviewToSupabase({
        listingId: booking.listingId,
        bookingId: booking.id,
        guestName: guestName || booking.guestFullName || 'Verified Guest',
        rating,
        comment: comment.trim(),
        checkOutDate: checkoutDateStr,
      });

      if (error) {
        setErrorMessage(
          error.message || 'Unable to submit review at this time. Please try again.'
        );
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Thank you! Your verified review has been submitted successfully.');
      setIsSubmitting(false);

      if (data) {
        setTimeout(() => {
          onSuccess(data);
          onClose();
        }, 1200);
      } else {
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'An unexpected error occurred while saving your review.'
      );
      setIsSubmitting(false);
    }
  };

  const activeDisplayRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#1B4332]/10 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1B4332]/10 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1B4332] text-[#E8A33D] flex items-center justify-center shadow-xs">
              <Star className="w-4 h-4 fill-[#E8A33D]" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-[#1B4332]">
                Leave a Verified Review
              </h3>
              <p className="text-[11px] text-[#6B756F]">
                Share your stay experience with future guests
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close review modal"
            className="w-8 h-8 rounded-full bg-[#FBF6EC] hover:bg-[#1B4332]/10 text-[#14231C] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Booking Summary Card */}
          <div className="p-3.5 rounded-2xl bg-[#FBF6EC] border border-[#1B4332]/10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#14231C] overflow-hidden shrink-0 border border-[#1B4332]/20">
              <img
                src={
                  booking.listingPhoto ||
                  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'
                }
                alt={booking.listingTitle}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#2D6A4F] uppercase tracking-wide">
                <ShieldCheck className="w-3 h-3 text-[#2D6A4F]" />
                <span>Completed Verified Stay</span>
              </div>
              <h4 className="text-sm font-bold text-[#14231C] truncate">
                {booking.listingTitle}
              </h4>
              <div className="flex items-center gap-2 text-[11px] text-[#6B756F] mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#2D6A4F]" />
                  Checked out {checkoutDateStr}
                </span>
                <span>•</span>
                <span className="font-mono text-[10px]">Ref: #ILE-{booking.id.slice(0, 6)}</span>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-start gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold leading-relaxed">
                {successMessage}
              </div>
            </div>
          )}

          {/* Error Banner / Toast */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-950 flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold leading-relaxed">
                {errorMessage}
              </div>
            </div>
          )}

          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-bold text-[#14231C] mb-1.5">
                  Your Overall Rating
                </label>
                <div className="flex items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = starValue <= activeDisplayRating;
                    return (
                      <button
                        type="button"
                        key={starValue}
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`Rate ${starValue} out of 5 stars`}
                        className="p-1 rounded-lg hover:scale-110 active:scale-95 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E8A33D]"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            isFilled
                              ? 'text-[#E8A33D] fill-[#E8A33D] drop-shadow-xs'
                              : 'text-gray-300 hover:text-[#E8A33D]/60'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs font-medium text-[#2D6A4F] mt-1 h-5 flex items-center">
                  {RATING_LABELS[activeDisplayRating] || `${rating} Stars`}
                </div>
              </div>

              {/* Review Comment Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="review-comment" className="block text-xs font-bold text-[#14231C]">
                    Detailed Review & Feedback
                  </label>
                  <span className="text-[10px] text-[#6B756F]">
                    {comment.length} / 500 characters
                  </span>
                </div>
                <textarea
                  id="review-comment"
                  rows={4}
                  maxLength={500}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was your stay? How reliable was the 24/7 power, water pressure, cleanliness, and communication with the host?"
                  className="w-full p-3 text-xs bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all leading-relaxed"
                />
                <span className="text-[10px] text-[#6B756F] mt-1 block">
                  Reviews are public and help other guests book verified stays with confidence.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#1B4332]/10">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#6B756F] hover:text-[#14231C] hover:bg-[#FBF6EC] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  id="submit-review-btn"
                  disabled={isSubmitting || !comment.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#E8A33D] hover:bg-[#d99530] text-[#14231C] transition-all shadow-md shadow-[#E8A33D]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#14231C]" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
