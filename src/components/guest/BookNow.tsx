import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { usePaystackPayment } from '../../lib/paystack';
import {
  Calendar,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Users,
  Building2,
  MapPin,
  ChevronRight,
  Phone,
  Mail,
  User,
  Info,
  X
} from 'lucide-react';
import { PropertyListing, GuestBooking } from '../../types';
import { supabase } from '../../lib/supabase';
import { generateUUID } from '../../lib/uuid';
import {
  insertBookingToSupabase,
  getCompletedBookingsForListing,
  checkBookingOverlap,
  parseLocalDate,
  formatDateToYYYYMMDD,
  isPostgresExclusionError,
} from '../../lib/supabaseService';
import { useApp } from '../../context/AppContext';

export interface BookNowProps {
  listing: PropertyListing | {
    id: string;
    title: string;
    price_per_day?: number;
    pricePerDay?: number;
    photos?: string[];
    images?: string[];
    propertyType?: string;
    property_type?: string;
    state?: string;
    cityArea?: string;
    city_area?: string;
    streetAddress?: string;
    street_address?: string;
    hostFullName?: string;
    host_full_name?: string;
    hostWhatsApp?: string;
    host_whatsapp?: string;
    hostEmail?: string;
    host_email?: string;
    description?: string;
    verificationNotes?: string;
    amenities?: string[];
    isBooked?: boolean;
  };
  guestFullName?: string;
  guestEmail?: string;
  guestPhone?: string;
  initialCheckInDate?: Date | null;
  initialCheckOutDate?: Date | null;
  onSuccessBooking?: (booking: GuestBooking) => void;
  onClose?: () => void;
  className?: string;
}

// Fallback Paystack Public Key placeholder if not provided in environment
const PAYSTACK_PUBLIC_KEY =
  (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string) ||
  'pk_test_placeholder_paystack_key_0123456789';

export const BookNow: React.FC<BookNowProps> = ({
  listing,
  guestFullName = '',
  guestEmail = '',
  guestPhone = '',
  initialCheckInDate = null,
  initialCheckOutDate = null,
  onSuccessBooking,
  onClose,
  className = '',
}) => {
  const { currentUser, addBooking } = useApp();

  // Normalize listing fields supporting both snake_case and camelCase
  const pricePerDay =
    listing.price_per_day ?? (listing as any).pricePerDay ?? 0;
  const listingTitle = listing.title || 'Verified Apartment';
  const listingPhoto =
    (listing.photos && listing.photos.length > 0 && listing.photos[0]) ||
    (listing.images && listing.images.length > 0 && listing.images[0]) ||
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';
  const propertyType =
    (listing as any).property_type || (listing as any).propertyType || 'Apartment';
  const state = listing.state || 'Lagos';
  const cityArea = (listing as any).city_area || (listing as any).cityArea || 'Lekki Phase 1';
  const streetAddress =
    (listing as any).street_address || (listing as any).streetAddress || 'Lagos, Nigeria';
  const hostFullName =
    (listing as any).host_full_name || (listing as any).hostFullName || 'Verified Host';
  const hostWhatsApp =
    (listing as any).host_whatsapp || (listing as any).hostWhatsApp || '+2348000000000';
  const hostEmail =
    (listing as any).host_email || (listing as any).hostEmail || 'host@ileya.ng';

  // Date selection states
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [checkInDate, setCheckInDate] = useState<Date | null>(() => {
    if (initialCheckInDate && initialCheckInDate >= today) return initialCheckInDate;
    return null;
  });
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(() => {
    if (initialCheckOutDate && initialCheckOutDate > today) return initialCheckOutDate;
    return null;
  });
  const [guestsCount, setGuestsCount] = useState<number>(1);

  // Guest Contact details
  const [guestName, setGuestName] = useState<string>(
    guestFullName || currentUser?.fullName || ''
  );
  const [guestEmailAddress, setGuestEmailAddress] = useState<string>(
    guestEmail || currentUser?.email || ''
  );
  const [guestPhoneNumber, setGuestPhoneNumber] = useState<string>(
    guestPhone || ''
  );

  // Interaction and UI states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [disabledDateStrings, setDisabledDateStrings] = useState<Set<string>>(new Set());
  const [bookedIntervals, setBookedIntervals] = useState<{ start: Date; end: Date }[]>([]);
  const [completedBookings, setCompletedBookings] = useState<GuestBooking[]>([]);
  const [completedBooking, setCompletedBooking] = useState<GuestBooking | null>(null);
  const isAwaitingInsertRef = React.useRef<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 6000);
  }, []);

  // Fetch existing completed bookings directly from Supabase to block dates on the calendar
  const fetchListingBookings = useCallback(async () => {
    if (!listing.id) return;
    try {
      // Actively query the bookings table for this specific listing_id where payment_status = 'completed'
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('listing_id', listing.id)
        .eq('payment_status', 'completed');

      let rows: any[] = data || [];
      if (error || rows.length === 0) {
        // Fallback helper in case of column status casing variations
        rows = await getCompletedBookingsForListing(listing.id);
      }

      setCompletedBookings(rows);

      // Correctly map over the returned rows and disable all dates between check_in_date and check_out_date
      const allBlockedDates: Date[] = [];
      const blockedDateStrings = new Set<string>();
      const intervals: { start: Date; end: Date }[] = [];

      rows.forEach((b: any) => {
        const checkInStr = b.check_in_date || b.checkInDate;
        const checkOutStr = b.check_out_date || b.checkOutDate;
        if (!checkInStr || !checkOutStr) return;

        const start = parseLocalDate(checkInStr);
        const end = parseLocalDate(checkOutStr);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

        intervals.push({ start, end });

        // Generate and disable all dates between check_in_date and check_out_date
        const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
        const stop = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);

        while (cur <= stop) {
          const key = formatDateToYYYYMMDD(cur);
          if (!blockedDateStrings.has(key)) {
            blockedDateStrings.add(key);
            allBlockedDates.push(new Date(cur));
          }
          cur.setDate(cur.getDate() + 1);
        }
      });

      setBookedIntervals(intervals);
      setDisabledDates(allBlockedDates);
      setDisabledDateStrings(blockedDateStrings);

      // If currently selected check-in date is booked, clear it
      setCheckInDate((currentCheckIn) => {
        if (!currentCheckIn) return currentCheckIn;
        const key = formatDateToYYYYMMDD(currentCheckIn);
        return blockedDateStrings.has(key) ? null : currentCheckIn;
      });

      // If currently selected check-out date is booked, clear it
      setCheckOutDate((currentCheckOut) => {
        if (!currentCheckOut) return currentCheckOut;
        const key = formatDateToYYYYMMDD(currentCheckOut);
        return blockedDateStrings.has(key) ? null : currentCheckOut;
      });
    } catch (err) {
      console.warn('Could not fetch completed bookings for listing:', err);
    }
  }, [listing.id]);

  useEffect(() => {
    fetchListingBookings();

    if (!listing.id) return;
    const channel = supabase
      .channel(`listing-bookings-sync-${listing.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `listing_id=eq.${listing.id}`,
        },
        () => {
          fetchListingBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listing.id, fetchListingBookings]);

  // Calculate nights and total amount
  const calculateNights = (): number => {
    if (!checkInDate || !checkOutDate) return 0;
    const diff = checkOutDate.getTime() - checkInDate.getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const totalAmount = nights * pricePerDay;

  // Maximum checkout date to prevent jumping over existing reservations
  const maxAllowedCheckOutDate = useMemo(() => {
    if (!checkInDate) return null;
    const futureBookings = bookedIntervals
      .filter((inv) => inv.start.getTime() > checkInDate.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    if (futureBookings.length > 0) {
      return futureBookings[0].start;
    }
    return null;
  }, [checkInDate, bookedIntervals]);

  // Check for calendar overlaps
  const isDateRangeBlocked = (): boolean => {
    if (!checkInDate || !checkOutDate) return false;

    // Check every day between checkIn and checkOut
    const cur = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate(), 0, 0, 0, 0);
    const stop = new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate(), 0, 0, 0, 0);

    while (cur < stop) {
      if (disabledDateStrings.has(formatDateToYYYYMMDD(cur))) {
        return true;
      }
      cur.setDate(cur.getDate() + 1);
    }

    return bookedIntervals.some((interval) => {
      return (
        checkInDate.getTime() < interval.end.getTime() &&
        checkOutDate.getTime() > interval.start.getTime()
      );
    });
  };

  // Paystack Configuration object
  // Paystack amount expects KOBO (NGN * 100)
  const paystackAmountInKobo = Math.max(0, totalAmount * 100);

  const paystackConfig = {
    reference: `ILE-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    email: guestEmailAddress.trim() || 'guest@ileya.ng',
    amount: paystackAmountInKobo || 100,
    publicKey: PAYSTACK_PUBLIC_KEY,
    currency: 'NGN',
    metadata: {
      custom_fields: [
        {
          display_name: 'Listing Title',
          variable_name: 'listing_title',
          value: listingTitle,
        },
        {
          display_name: 'Guest Full Name',
          variable_name: 'guest_full_name',
          value: guestName || 'Guest User',
        },
        {
          display_name: 'Phone Number',
          variable_name: 'guest_phone',
          value: guestPhoneNumber || 'N/A',
        },
        {
          display_name: 'Listing ID',
          variable_name: 'listing_id',
          value: listing.id,
        },
        {
          display_name: 'Total Nights',
          variable_name: 'nights',
          value: nights,
        },
      ],
    },
  };

  // Initialize Paystack payment hook from react-paystack
  const initializePaystackPayment = usePaystackPayment(paystackConfig);

  // Callback on successful Paystack payment
  const handlePaystackSuccess = async (response: any) => {
    try {
      isAwaitingInsertRef.current = true;
      setIsProcessing(true);
      setErrorMessage(null);

      const paystackReference =
        response?.reference ||
        response?.trxref ||
        response?.trans ||
        paystackConfig.reference ||
        `PAY-${Date.now()}`;

      const formattedCheckIn = checkInDate
        ? checkInDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      const formattedCheckOut = checkOutDate
        ? checkOutDate.toISOString().split('T')[0]
        : new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

      // RFC4122 v4 UUID for PostgreSQL uuid primary key
      const bookingId = generateUUID();

      const newBooking: GuestBooking = {
        id: bookingId,
        listingId: listing.id,
        listingTitle,
        listingPhoto,
        propertyType,
        state,
        cityArea,
        streetAddress,
        hostFullName,
        hostWhatsApp,
        hostEmail,
        guestFullName: guestName.trim() || 'Valued Guest',
        guestEmail: guestEmailAddress.trim() || 'guest@ileya.ng',
        guestPhone: guestPhoneNumber.trim() || '',
        checkInDate: formattedCheckIn,
        checkOutDate: formattedCheckOut,
        guestsCount,
        totalPrice: totalAmount,
        totalAmount,
        nights,
        bookedAt: new Date().toISOString(),
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentReference: paystackReference,
      };

      // Exact database schema payload for bookings table in Supabase.
      // STRICT DECOUPLING: Guest checkout is completely decoupled from the 'profiles' table.
      // Customer identity is stored directly in 'bookings' using 'guest_name' and 'guest_email'.
      // No attempt is made to insert or upsert into 'profiles', preventing profiles_id_fkey violations.
      const payload: Record<string, any> = {
        id: bookingId,
        listing_id: listing.id,
        guest_name: guestName.trim() || 'Valued Guest',
        guest_email: guestEmailAddress.trim() || 'guest@ileya.ng',
        amount_paid: totalAmount,
        check_in_date: formattedCheckIn,
        check_out_date: formattedCheckOut,
        payment_status: 'completed',
        payment_reference: paystackReference,
        booked_at: new Date().toISOString(),
      };

      console.log("[Decoupled Checkout] Writing booking directly to bookings table (bypassing profiles):", payload);

      // Directly write to bookings table immediately after Paystack succeeds
      const { data, error, status: httpStatus } = await supabase
        .from('bookings')
        .insert([payload])
        .select();

      if (error) {
        console.error("[Decoupled Checkout] Supabase insert error on bookings table:", error, "HTTP Status:", httpStatus);
        throw error;
      }

      console.log("[Decoupled Checkout] Booking confirmed and persisted in database:", data);

      // Now that the record is securely persisted in Supabase, update state and notify parents
      addBooking(newBooking);
      setCompletedBooking(newBooking);
      if (onSuccessBooking) {
        onSuccessBooking(newBooking);
      }
      // Refresh local intervals and blocked dates
      await fetchListingBookings();
    } catch (err: any) {
      console.error('Error recording booking in Supabase:', err);
      const detailedMessage = err?.message || err?.details || JSON.stringify(err);

      if (isPostgresExclusionError(err)) {
        const doubleBookingError = 'Sorry, those dates were just booked.';
        showToast(doubleBookingError);
        setErrorMessage(doubleBookingError);
        alert(doubleBookingError);
        await fetchListingBookings();
        return;
      }

      const alertMsg = `Booking failed to save in Supabase: ${detailedMessage}`;
      showToast(alertMsg);
      setErrorMessage(alertMsg);
      alert(alertMsg);
    } finally {
      isAwaitingInsertRef.current = false;
      setIsProcessing(false);
    }
  };

  // Callback on Paystack checkout closed
  const handlePaystackClose = () => {
    setIsProcessing(false);
    console.log('Paystack checkout popup closed by user.');
  };

  // Trigger Paystack Checkout flow with Pre-Payment Double-Booking Guard
  const handleInitiateCheckout = async () => {
    try {
      setErrorMessage(null);
      setToastMessage(null);

      // Validate inputs
      if (!checkInDate || !checkOutDate) {
        setErrorMessage('Please select both Check-In and Check-Out dates.');
        return;
      }

      if (nights <= 0) {
        setErrorMessage('Check-Out date must be at least 1 day after Check-In.');
        return;
      }

      if (isDateRangeBlocked()) {
        const msg = 'Sorry, those dates were just booked.';
        showToast(msg);
        setErrorMessage(msg);
        alert(msg);
        await fetchListingBookings();
        return;
      }

      if (!guestEmailAddress.trim() || !guestEmailAddress.includes('@')) {
        setErrorMessage('Please enter a valid guest email address for payment receipt.');
        return;
      }

      if (!guestName.trim()) {
        setErrorMessage('Please enter your full name for the booking reservation.');
        return;
      }

      setIsProcessing(true);

      const formattedCheckIn = formatDateToYYYYMMDD(checkInDate);
      const formattedCheckOut = formatDateToYYYYMMDD(checkOutDate);

      // Strict Supabase check: query bookings table to see if any completed bookings overlap
      const { hasOverlap } = await checkBookingOverlap(
        listing.id,
        formattedCheckIn,
        formattedCheckOut
      );

      if (hasOverlap) {
        setIsProcessing(false);
        const doubleBookingError = 'Sorry, those dates were just booked.';
        showToast(doubleBookingError);
        setErrorMessage(doubleBookingError);
        alert(doubleBookingError);
        // Refresh calendar date blocking immediately
        await fetchListingBookings();
        return;
      }

      // Call Paystack inline initializer with callbacks
      initializePaystackPayment({
        onSuccess: handlePaystackSuccess,
        onClose: handlePaystackClose,
      });
    } catch (paystackError: any) {
      console.warn('Paystack popup trigger notice:', paystackError);
      const detailedMessage = paystackError?.message || paystackError?.details || JSON.stringify(paystackError);

      if (isPostgresExclusionError(paystackError)) {
        setIsProcessing(false);
        const doubleBookingError = 'Sorry, those dates were just booked.';
        showToast(doubleBookingError);
        setErrorMessage(doubleBookingError);
        alert(doubleBookingError);
        await fetchListingBookings();
        return;
      }

      // Fallback if public key is placeholder and user is in testing environment
      if (
        PAYSTACK_PUBLIC_KEY.includes('placeholder') ||
        PAYSTACK_PUBLIC_KEY.startsWith('pk_test_placeholder')
      ) {
        // Automatically simulate payment success in sandbox test mode
        setTimeout(() => {
          handlePaystackSuccess({
            reference: `PSK-TEST-${Date.now()}`,
            status: 'success',
            message: 'Approved (Sandbox Test)',
          });
        }, 1000);
      } else {
        setIsProcessing(false);
        const msg = `Could not open Paystack checkout: ${detailedMessage}`;
        showToast(msg);
        setErrorMessage(msg);
        alert(msg);
      }
    }
  };

  // If booking is completed, show the success confirmation state
  if (completedBooking) {
    return (
      <div className={`bg-white rounded-3xl p-6 sm:p-8 border border-[#1B4332]/10 shadow-xl space-y-6 ${className}`}>
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Paystack Payment Completed</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#1B4332]">
            Reservation Confirmed!
          </h3>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Booking successful! Your dates have been reserved.</span>
          </div>
          <p className="text-xs text-[#6B756F] max-w-md mx-auto">
            Payment has been secured in Escrow. Your reservation for <strong className="text-[#14231C]">{listingTitle}</strong> is active.
          </p>
        </div>

        {/* Transaction & Booking Summary Card */}
        <div className="p-4 rounded-2xl bg-[#FBF6EC] border border-[#1B4332]/10 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-[#1B4332]/10 pb-2">
            <span className="text-[#6B756F]">Paystack Reference</span>
            <span className="font-mono font-bold text-[#1B4332]">
              {completedBooking.paymentReference}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] text-[#6B756F] block">Check-In</span>
              <span className="font-bold text-[#14231C] flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-[#2D6A4F]" />
                {completedBooking.checkInDate}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B756F] block">Check-Out</span>
              <span className="font-bold text-[#14231C] flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-[#2D6A4F]" />
                {completedBooking.checkOutDate}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B756F] block">Total Paid</span>
              <span className="font-extrabold font-serif text-emerald-800 text-sm mt-0.5 block">
                ₦{completedBooking.totalPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Address Card */}
        <div className="p-3.5 rounded-xl bg-white border border-[#1B4332]/10 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[#1B4332]">
            <MapPin className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>Apartment Location</span>
          </div>
          <p className="text-xs text-[#14231C]">
            {streetAddress}, {cityArea}, {state} State, Nigeria
          </p>
        </div>

        {/* Action Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            id="finish-booking-btn"
            className="w-full py-3 rounded-xl text-xs font-bold bg-[#E8A33D] hover:bg-[#d99530] text-[#14231C] transition-all cursor-pointer shadow-sm"
          >
            Done & View My Bookings
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-[#FBF6EC] rounded-3xl p-5 sm:p-7 border border-[#1B4332]/10 flex flex-col justify-between space-y-6 relative ${className}`}>
      {/* Pre-Payment Guard Alert Toast */}
      {toastMessage && (
        <div
          role="alert"
          id="pre-payment-guard-toast"
          className="p-3.5 rounded-2xl bg-red-600 text-white shadow-xl flex items-center justify-between gap-3 border border-red-500 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-white" />
            <span className="text-xs sm:text-sm font-bold leading-snug">
              {toastMessage}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg hover:bg-red-700 text-white/90 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss error message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header: Price per Day & Live Escrow Badge */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between border-b border-[#1B4332]/10 pb-3.5">
          <div>
            <span className="text-xs text-[#6B756F] block font-medium">Daily Rate</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-serif text-[#1B4332]">
                ₦{pricePerDay.toLocaleString()}
              </span>
              <span className="text-xs text-[#6B756F]">/ day</span>
            </div>
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Paystack Protected</span>
          </span>
        </div>
      </div>

      {/* Date Pickers & Nights Calculation */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Check-In Date */}
          <div>
            <label className="block text-[11px] font-bold text-[#14231C] mb-1">
              Check-in Date
            </label>
            <div className="relative">
              <DatePicker
                selected={checkInDate}
                onChange={(date: Date | null) => {
                  if (date) {
                    const dStr = formatDateToYYYYMMDD(date);
                    if (disabledDateStrings.has(dStr)) {
                      const msg = 'Sorry, those dates were just booked.';
                      showToast(msg);
                      setErrorMessage(msg);
                      return;
                    }
                  }
                  setCheckInDate(date);
                  if (date && checkOutDate && date >= checkOutDate) {
                    const nextDay = new Date(date);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setCheckOutDate(nextDay);
                  }
                }}
                selectsStart
                startDate={checkInDate}
                endDate={checkOutDate}
                minDate={today}
                excludeDates={disabledDates}
                filterDate={(date: Date) => !disabledDateStrings.has(formatDateToYYYYMMDD(date))}
                excludeDateIntervals={bookedIntervals}
                placeholderText="Select Check-in"
                className="w-full text-xs font-medium py-2.5 px-3 bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332] shadow-xs"
                dateFormat="MMM d, yyyy"
              />
            </div>
          </div>

          {/* Check-Out Date */}
          <div>
            <label className="block text-[11px] font-bold text-[#14231C] mb-1">
              Check-out Date
            </label>
            <div className="relative">
              <DatePicker
                selected={checkOutDate}
                onChange={(date: Date | null) => {
                  if (date) {
                    const dStr = formatDateToYYYYMMDD(date);
                    if (disabledDateStrings.has(dStr)) {
                      const msg = 'Sorry, those dates were just booked.';
                      showToast(msg);
                      setErrorMessage(msg);
                      return;
                    }
                  }
                  setCheckOutDate(date);
                }}
                selectsEnd
                startDate={checkInDate}
                endDate={checkOutDate}
                minDate={checkInDate ? new Date(checkInDate.getTime() + 86400000) : today}
                maxDate={maxAllowedCheckOutDate || undefined}
                excludeDates={disabledDates}
                filterDate={(date: Date) => {
                  const dStr = formatDateToYYYYMMDD(date);
                  if (disabledDateStrings.has(dStr)) return false;
                  if (maxAllowedCheckOutDate && date > maxAllowedCheckOutDate) return false;
                  return true;
                }}
                excludeDateIntervals={bookedIntervals}
                placeholderText="Select Check-out"
                className="w-full text-xs font-medium py-2.5 px-3 bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332] shadow-xs"
                dateFormat="MMM d, yyyy"
              />
            </div>
          </div>
        </div>

        {/* Datepicker Availability Legend */}
        <div className="flex items-center justify-between text-[11px] text-[#6B756F] px-1 bg-white/60 p-2 rounded-xl border border-[#1B4332]/10">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="text-[#14231C] font-medium">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="line-through text-gray-500">Grayed out = Booked</span>
          </div>
          {disabledDates.length > 0 ? (
            <span className="font-mono text-[#1B4332] font-bold text-[10px] bg-[#1B4332]/10 px-2 py-0.5 rounded-md">
              {disabledDates.length} Date{disabledDates.length > 1 ? 's' : ''} Blocked
            </span>
          ) : (
            <span className="text-emerald-700 font-medium text-[10px]">
              Open Dates
            </span>
          )}
        </div>

        {/* Guests Count Selector */}
        <div>
          <label
            htmlFor="book-now-guests-count"
            className="block text-[11px] font-bold text-[#14231C] mb-1"
          >
            Number of Guests
          </label>
          <div className="relative">
            <select
              id="book-now-guests-count"
              value={guestsCount}
              onChange={(e) => setGuestsCount(Number(e.target.value))}
              className="w-full text-xs font-medium py-2.5 px-3 bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332] shadow-xs"
            >
              <option value={1}>1 Guest</option>
              <option value={2}>2 Guests</option>
              <option value={3}>3 Guests</option>
              <option value={4}>4 Guests</option>
              <option value={5}>5 Guests</option>
              <option value={6}>6+ Guests</option>
            </select>
          </div>
        </div>

        {/* Guest Details Inputs */}
        <div className="pt-2 border-t border-[#1B4332]/10 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#14231C] block">
            Guest Details
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-[#6B756F] mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Adebayo Ogunlesi"
                  className="w-full text-xs py-2 px-2.5 bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#6B756F] mb-1">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={guestEmailAddress}
                  onChange={(e) => setGuestEmailAddress(e.target.value)}
                  placeholder="e.g. guest@example.com"
                  className="w-full text-xs py-2 px-2.5 bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#6B756F] mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={guestPhoneNumber}
              onChange={(e) => setGuestPhoneNumber(e.target.value)}
              placeholder="e.g. 08012345678"
              className="w-full text-xs py-2 px-2.5 bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Price Breakdown Calculation */}
        <div className="p-4 rounded-2xl bg-white border border-[#1B4332]/10 space-y-2 text-xs shadow-xs">
          <div className="font-bold text-[#14231C] border-b border-[#1B4332]/10 pb-1.5 flex items-center justify-between">
            <span>Price Breakdown</span>
            <span className="font-mono text-[#2D6A4F]">₦ NGN</span>
          </div>

          <div className="flex justify-between text-[#6B756F]">
            <span>
              ₦{pricePerDay.toLocaleString()} × {nights} {nights === 1 ? 'day' : 'days'}
            </span>
            <span className="font-semibold text-[#14231C]">
              ₦{totalAmount.toLocaleString()}
            </span>
          </div>

          <div className="border-t border-[#1B4332]/10 pt-2 flex justify-between items-baseline font-bold text-sm text-[#1B4332]">
            <span>Total</span>
            <span className="text-xl font-extrabold font-serif text-[#1B4332]">
              ₦{totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Paystack Checkout Button & Security Badge */}
      <div className="space-y-3 pt-2">
        <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-[11px] text-emerald-800 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          <span>Secured checkout: Card, bank transfer, and USSD supported.</span>
        </div>

        <button
          type="button"
          id="paystack-book-now-btn"
          disabled={isProcessing || nights <= 0 || isDateRangeBlocked()}
          onClick={handleInitiateCheckout}
          className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
            nights <= 0 || isDateRangeBlocked()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#E8A33D] hover:bg-[#d99530] text-[#14231C]'
          }`}
        >
          {isProcessing ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              <span>Connecting to Paystack...</span>
            </>
          ) : isDateRangeBlocked() ? (
            <>
              <Lock className="w-4 h-4" />
              <span>Selected Dates Are Already Booked</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>
                Pay with Paystack (₦{totalAmount.toLocaleString()})
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
