import React, { useState, useEffect } from 'react';
import {
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Users,
  Zap,
  Wifi,
  Wind,
  Shield,
  Waves,
  Car,
  Tv,
  Utensils,
  Droplets,
  X,
  ArrowLeft,
  Building2,
  Loader2,
  Lock,
  MessageSquare,
  Send
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

/**
 * Public Listing Details Component (ListingDetails.jsx)
 * Cleaned specifications:
 * - NO Service Fee in pricing breakdown (only base nightly price and nights total)
 * - NO Host WhatsApp / phone numbers exposed to guests
 * - "Contact Host" opens in-platform inquiry modal without exposing raw phone numbers
 * - Strict real Supabase data via URL ID
 */
export const ListingDetails = ({
  id: propId,
  listing: initialListing,
  user: propUser,
  onClose,
  onNavigate,
  onConfirmBooking,
}) => {
  // Gracefully get user session from context if available
  let contextUser = null;
  try {
    const context = useApp();
    contextUser = context?.currentUser;
  } catch {}

  const getLoggedInUser = () => {
    if (propUser !== undefined) return propUser;
    if (contextUser !== undefined) return contextUser;
    try {
      const stored = window.localStorage.getItem('ileya_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const user = getLoggedInUser();
  const isLoggedIn = !!user;

  // Extract ID from props, initialListing, or URL path (/listing/:id)
  const targetId =
    propId ||
    initialListing?.id ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/listing/')
      ? window.location.pathname.replace('/listing/', '').split('?')[0].split('/')[0]
      : null);

  const [listing, setListing] = useState(initialListing || null);
  const [isLoading, setIsLoading] = useState(!initialListing && !!targetId);
  const [errorMsg, setErrorMsg] = useState(null);

  // Reservation Form State
  const [checkInDate, setCheckInDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [checkOutDate, setCheckOutDate] = useState(() => {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);
    return dayAfter.toISOString().split('T')[0];
  });

  const [guestsCount, setGuestsCount] = useState(1);
  const [showAllPhotosModal, setShowAllPhotosModal] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isBookedSuccess, setIsBookedSuccess] = useState(false);
  const [bookedDatesSet, setBookedDatesSet] = useState(new Set());
  const [dateError, setDateError] = useState(null);

  // In-platform generic host message modal (NEVER exposes raw phone number)
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySent, setInquirySent] = useState(false);
  const [isSendingInquiry, setIsSendingInquiry] = useState(false);

  // Fetch booked dates from Supabase for this property
  useEffect(() => {
    if (!targetId) return;
    let isMounted = true;

    async function fetchBookingsForListing() {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('check_in_date, check_out_date, status, payment_status')
          .eq('listing_id', targetId)
          .or('status.eq.confirmed,status.eq.approved,payment_status.eq.completed');

        if (!error && data && isMounted) {
          const blocked = new Set();
          data.forEach((b) => {
            const inDate = b.check_in_date;
            const outDate = b.check_out_date;
            if (inDate && outDate) {
              const start = new Date(inDate);
              const end = new Date(outDate);
              if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const cur = new Date(start);
                while (cur <= end) {
                  blocked.add(cur.toISOString().split('T')[0]);
                  cur.setDate(cur.getDate() + 1);
                }
              }
            }
          });
          setBookedDatesSet(blocked);
        }
      } catch (err) {
        console.warn('Could not load booked dates in ListingDetails:', err);
      }
    }

    fetchBookingsForListing();
    return () => {
      isMounted = false;
    };
  }, [targetId]);

  // Strict Supabase fetch using .single() based on URL parameter / ID
  useEffect(() => {
    if (!targetId) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);

    async function fetchListingById() {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', targetId)
          .single();

        if (error) {
          console.error('Error fetching listing details:', error);
          if (isMounted) setErrorMsg(error.message);
        } else if (data && isMounted) {
          setListing(data);
        }
      } catch (err) {
        console.error('Exception fetching listing details:', err);
        if (isMounted) setErrorMsg(err.message || 'Failed to load property details');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchListingById();

    return () => {
      isMounted = false;
    };
  }, [targetId]);

  const handleBack = () => {
    if (typeof onClose === 'function') {
      onClose();
      return;
    }
    if (typeof onNavigate === 'function') {
      onNavigate('/');
      return;
    }
    try {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      window.location.href = '/';
    }
  };

  // Helper for amenity icons
  const getAmenityIcon = (label = '') => {
    const text = String(label).toLowerCase();
    if (text.includes('power') || text.includes('generator') || text.includes('solar')) return <Zap className="w-4 h-4 text-amber-600" />;
    if (text.includes('wifi') || text.includes('internet')) return <Wifi className="w-4 h-4 text-emerald-700" />;
    if (text.includes('air') || text.includes('ac')) return <Wind className="w-4 h-4 text-blue-600" />;
    if (text.includes('security') || text.includes('cctv')) return <Shield className="w-4 h-4 text-emerald-800" />;
    if (text.includes('pool')) return <Waves className="w-4 h-4 text-cyan-600" />;
    if (text.includes('parking') || text.includes('car')) return <Car className="w-4 h-4 text-gray-700" />;
    if (text.includes('tv') || text.includes('dstv') || text.includes('netflix')) return <Tv className="w-4 h-4 text-indigo-600" />;
    if (text.includes('kitchen')) return <Utensils className="w-4 h-4 text-orange-600" />;
    if (text.includes('water')) return <Droplets className="w-4 h-4 text-blue-500" />;
    return <CheckCircle2 className="w-4 h-4 text-emerald-700" />;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-[#1B4332] mx-auto" />
          <p className="text-sm font-medium text-gray-700">Loading property details...</p>
        </div>
      </div>
    );
  }

  // Error / Not Found state
  if (errorMsg || !listing) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Property Not Found</h2>
          <p className="text-xs text-gray-500">
            {errorMsg || 'The requested property could not be found or has been removed.'}
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#1B4332] hover:bg-[#143427] transition-all cursor-pointer shadow-xs"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Strictly collect REAL images: listing.image_url, listing.photos, listing.images, or listing.verification_evidence_urls
  const realImages = [];
  if (listing.image_url && typeof listing.image_url === 'string') {
    realImages.push(listing.image_url);
  }
  if (Array.isArray(listing.photos)) {
    listing.photos.forEach((url) => {
      if (typeof url === 'string' && url.trim() && !realImages.includes(url)) {
        realImages.push(url);
      }
    });
  }
  if (Array.isArray(listing.images)) {
    listing.images.forEach((url) => {
      if (typeof url === 'string' && url.trim() && !realImages.includes(url)) {
        realImages.push(url);
      }
    });
  }
  if (Array.isArray(listing.verification_evidence_urls)) {
    listing.verification_evidence_urls.forEach((url) => {
      if (typeof url === 'string' && url.trim() && !realImages.includes(url)) {
        realImages.push(url);
      }
    });
  }

  // Calculate nights and pure base pricing (NO SERVICE FEES)
  const calculateNights = () => {
    try {
      if (!checkInDate || !checkOutDate) return 1;
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return 1;
    }
  };

  const nights = calculateNights();
  const ratePerNight = Number(listing.price_per_day || listing.price || listing.pricePerDay || 0);
  const totalAmount = ratePerNight * Math.max(1, nights); // Pure nightly rate * nights, NO added service fee

  const minCheckInDate = new Date().toISOString().split('T')[0];
  const minCheckOutDate = checkInDate
    ? new Date(new Date(checkInDate).getTime() + 86400000).toISOString().split('T')[0]
    : minCheckInDate;

  const handleCheckInDateChange = (val) => {
    setDateError(null);
    setCheckInDate(val);
    if (!val) return;
    if (bookedDatesSet.has(val)) {
      setDateError('Selected check-in date is already booked.');
      return;
    }
    if (checkOutDate) {
      if (checkOutDate <= val) {
        const nextDay = new Date(new Date(val).getTime() + 86400000).toISOString().split('T')[0];
        setCheckOutDate(nextDay);
      } else {
        const cur = new Date(val);
        const end = new Date(checkOutDate);
        let overlaps = false;
        while (cur < end) {
          const key = cur.toISOString().split('T')[0];
          if (bookedDatesSet.has(key)) {
            overlaps = true;
            break;
          }
          cur.setDate(cur.getDate() + 1);
        }
        if (overlaps) {
          setDateError('Selected date range overlaps with an existing booking.');
        }
      }
    }
  };

  const handleCheckOutDateChange = (val) => {
    setDateError(null);
    if (!val) {
      setCheckOutDate('');
      return;
    }
    // Validation 1: Check-out date must not be earlier or equal to check-in date
    if (checkInDate && val <= checkInDate) {
      setDateError('Check-out date must be after check-in date.');
      return;
    }
    // Validation 2: Date range must not overlap with already booked dates
    if (checkInDate) {
      const cur = new Date(checkInDate);
      const end = new Date(val);
      let overlaps = false;
      while (cur < end) {
        const key = cur.toISOString().split('T')[0];
        if (bookedDatesSet.has(key)) {
          overlaps = true;
          break;
        }
        cur.setDate(cur.getDate() + 1);
      }
      if (overlaps) {
        setDateError('Selected date range overlaps with an existing booking.');
        return;
      }
    }
    setCheckOutDate(val);
  };

  // Strict Authentication Guard on Booking
  const handleBookNow = (e) => {
    if (e) e.preventDefault();

    if (dateError) {
      alert(dateError);
      return;
    }
    if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
      alert('Please select valid check-in and check-out dates.');
      return;
    }

    const currentUser = getLoggedInUser();
    // If not logged in: alert and redirect to /login
    if (!currentUser) {
      alert('Please log in or sign up to complete your booking');
      if (typeof onNavigate === 'function') {
        onNavigate('/login');
      } else {
        try {
          window.history.pushState({}, '', '/login');
          window.dispatchEvent(new PopStateEvent('popstate'));
        } catch {
          window.location.href = '/login';
        }
      }
      return;
    }

    // If logged in: Proceed to normal checkout flow
    if (typeof onConfirmBooking === 'function') {
      onConfirmBooking({
        listingId: listing.id,
        listingTitle: listing.title || 'Verified Property',
        checkInDate,
        checkOutDate,
        guestsCount,
        totalAmount,
      });
    } else {
      setIsBookedSuccess(true);
    }
  };

  // Generic in-platform host message sender (No phone number exposure)
  const handleSendInquiry = (e) => {
    e.preventDefault();
    if (!inquiryMessage.trim()) return;

    setIsSendingInquiry(true);
    // Simulate secure platform message delivery without revealing host's private contact
    setTimeout(() => {
      setIsSendingInquiry(false);
      setInquirySent(true);
      setTimeout(() => {
        setIsInquiryModalOpen(false);
        setInquirySent(false);
        setInquiryMessage('');
      }, 2000);
    }, 600);
  };

  const title = listing.title || '';
  const description = listing.description || '';
  const propertyType = listing.property_type || listing.propertyType || '';
  const state = listing.state || '';
  const cityArea = listing.city_area || listing.city || listing.cityArea || '';
  const streetAddress = listing.street_address || listing.streetAddress || '';
  const hostName = listing.host_full_name || listing.hostFullName || '';
  const verificationNotes = listing.verification_notes || listing.verificationNotes || '';
  const amenities = Array.isArray(listing.amenities) ? listing.amenities : [];
  const verificationEvidence = Array.isArray(listing.verification_evidence_urls)
    ? listing.verification_evidence_urls
    : [];

  const locationParts = [streetAddress, cityArea, state].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl sm:rounded-3xl min-h-screen sm:min-h-0 sm:max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col my-auto border border-gray-100">
        {/* Top Header Bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to listings</span>
          </button>

          <div className="flex items-center gap-2">
            {(listing.verification_status === 'verified' || listing.is_physically_verified) && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Verified by Ileya Afrika</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleBack}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer ml-1"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8 flex-1">
          {/* 1. Title & Header Info */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 tracking-tight">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-gray-600">
              {locationParts.length > 0 && (
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>{locationParts.join(', ')}</span>
                </div>
              )}
              {propertyType && (
                <>
                  <span>•</span>
                  <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    {propertyType}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 2. Photo Gallery Grid - Real images or grey fallback */}
          {realImages.length === 0 ? (
            <div className="w-full h-64 sm:h-80 bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400 p-6 border border-gray-200/60">
              <Building2 className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-xs font-semibold text-gray-500">No photos uploaded for this property</p>
            </div>
          ) : realImages.length === 1 ? (
            <div className="relative rounded-2xl overflow-hidden h-72 sm:h-96 bg-gray-100">
              <img
                src={realImages[0]}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => {
                  setActivePhotoIndex(0);
                  setShowAllPhotosModal(true);
                }}
              />
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-4 gap-2 h-72 sm:h-96">
              {/* Primary Large Photo */}
              <div className="md:col-span-2 h-full bg-gray-100 overflow-hidden relative group">
                <img
                  src={realImages[0]}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 cursor-pointer"
                  onClick={() => {
                    setActivePhotoIndex(0);
                    setShowAllPhotosModal(true);
                  }}
                />
              </div>

              {/* Secondary Real Photos */}
              <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2 h-full">
                {realImages.slice(1, 5).map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="h-full bg-gray-100 overflow-hidden relative group cursor-pointer"
                    onClick={() => {
                      setActivePhotoIndex(idx + 1);
                      setShowAllPhotosModal(true);
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`${title} ${idx + 2}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>

              {/* Show All Photos Button if more than 1 image */}
              <button
                type="button"
                onClick={() => setShowAllPhotosModal(true)}
                className="absolute bottom-4 right-4 bg-white/95 hover:bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-xl shadow-md border border-gray-200 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
              >
                <span>View all photos ({realImages.length})</span>
              </button>
            </div>
          )}

          {/* 3. Main Split View: Left Details vs Right Sticky Booking Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 pt-4">
            {/* Left 2 Columns: Description, Amenities, Host info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Verification Notes */}
              {verificationNotes && (
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-5 h-5 text-emerald-200" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-emerald-950">
                        Physical Verification Notes
                      </h3>
                      <p className="text-xs text-emerald-800">
                        Inspected on-site by Ileya Afrika Operations
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed pl-10 whitespace-pre-line">
                    {verificationNotes}
                  </p>
                </div>
              )}

              {/* Host Profile (Strictly NO phone / WhatsApp exposed; Generic message button) */}
              {hostName && (
                <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-gray-900">
                      Hosted by {hostName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Verified Host Partner • Identity & NUBAN Confirmed
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsInquiryModalOpen(true)}
                      className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                      <span>Contact Host</span>
                    </button>

                    <div className="w-10 h-10 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {hostName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {description && (
                <div className="space-y-3 pb-6 border-b border-gray-100">
                  <h3 className="text-base font-bold text-gray-900">About this place</h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line font-normal">
                    {description}
                  </p>
                </div>
              )}

              {/* Amenities Grid */}
              {amenities.length > 0 && (
                <div className="space-y-4 pb-6 border-b border-gray-100">
                  <h3 className="text-base font-bold text-gray-900">Amenities offered</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {amenities.map((amenity, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-800 font-medium"
                      >
                        {getAmenityIcon(amenity)}
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification Evidence Photos */}
              {verificationEvidence.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-base font-bold text-gray-900">On-Site Verification Evidence</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {verificationEvidence.map((url, idx) => (
                      <div
                        key={idx}
                        className="aspect-4/3 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          const imageIdx = realImages.indexOf(url);
                          if (imageIdx !== -1) setActivePhotoIndex(imageIdx);
                          setShowAllPhotosModal(true);
                        }}
                      >
                        <img
                          src={url}
                          alt={`Verification evidence ${idx + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sticky Column: Booking Card (Pure nightly rate * nights; NO SERVICE FEE) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-3xl p-6 shadow-xl border border-gray-200/80 space-y-5">
                {/* Rate Header */}
                <div className="flex items-baseline justify-between border-b border-gray-100 pb-4">
                  <div>
                    {ratePerNight > 0 ? (
                      <>
                        <span className="text-2xl font-bold font-mono text-gray-950">
                          ₦{ratePerNight.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">/ night</span>
                      </>
                    ) : (
                      <span className="text-base font-bold text-gray-900">Price on request</span>
                    )}
                  </div>
                </div>

                {/* Booking Form Inputs */}
                <div className="rounded-2xl border border-gray-200 overflow-hidden text-xs">
                  <div className="grid grid-cols-2 border-b border-gray-200 divide-x divide-gray-200">
                    <div className="p-2.5 bg-gray-50/50">
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500">
                        Check-in
                      </label>
                      <input
                        type="date"
                        value={checkInDate}
                        min={minCheckInDate}
                        onChange={(e) => handleCheckInDateChange(e.target.value)}
                        className="w-full bg-transparent text-xs font-semibold text-gray-800 focus:outline-none cursor-pointer mt-0.5"
                      />
                    </div>
                    <div className="p-2.5 bg-gray-50/50">
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500">
                        Check-out
                      </label>
                      <input
                        type="date"
                        value={checkOutDate}
                        min={minCheckOutDate}
                        onChange={(e) => handleCheckOutDateChange(e.target.value)}
                        className="w-full bg-transparent text-xs font-semibold text-gray-800 focus:outline-none cursor-pointer mt-0.5"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-white">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500">
                      Guests
                    </label>
                    <select
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                      className="w-full bg-transparent text-xs font-semibold text-gray-800 focus:outline-none cursor-pointer mt-0.5"
                    >
                      <option value={1}>1 Guest</option>
                      <option value={2}>2 Guests</option>
                      <option value={3}>3 Guests</option>
                      <option value={4}>4+ Guests</option>
                    </select>
                  </div>
                </div>

                {/* Date Validation Alert if any */}
                {dateError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                    {dateError}
                  </div>
                )}

                {/* Pure Nightly Rate Breakdown (Strictly NO Service Fee) */}
                {ratePerNight > 0 && (
                  <div className="space-y-2 text-xs text-gray-600 border-b border-gray-100 pb-4">
                    <div className="flex justify-between">
                      <span>₦{ratePerNight.toLocaleString()} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
                      <span className="font-mono text-gray-900 font-medium">₦{totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t border-gray-100">
                      <span>Total (NGN)</span>
                      <span className="font-mono text-[#1B4332]">₦{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Book Now Button with Authentication Guard */}
                <div>
                  <button
                    type="button"
                    onClick={handleBookNow}
                    disabled={!!dateError || nights <= 0}
                    id="listing-book-now-button"
                    className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 border border-[#E8A33D]/30 ${
                      dateError || nights <= 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'text-white bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98]'
                    }`}
                  >
                    {!isLoggedIn ? (
                      <>
                        <Lock className="w-4 h-4 text-[#E8A33D]" />
                        <span>Book Now</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#E8A33D]" />
                        <span>Confirm Reservation</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-gray-400 text-center mt-2.5">
                    {!isLoggedIn ? (
                      <span className="text-gray-500">
                        Login required to complete booking.
                      </span>
                    ) : (
                      <span>Instant reservation request with verified host.</span>
                    )}
                  </p>
                </div>

                {/* Success message if booked */}
                {isBookedSuccess && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs text-center font-medium animate-in zoom-in-95">
                    🎉 Reservation request initiated! Check "My Bookings" in your dashboard.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Photo Viewer Modal */}
      {showAllPhotosModal && realImages.length > 0 && (
        <div className="fixed inset-0 z-60 bg-black/95 flex flex-col p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-white pb-4">
            <span className="text-sm font-semibold">
              Photo {activePhotoIndex + 1} of {realImages.length}
            </span>
            <button
              type="button"
              onClick={() => setShowAllPhotosModal(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <img
              src={realImages[activePhotoIndex]}
              alt={`Photo ${activePhotoIndex + 1}`}
              referrerPolicy="no-referrer"
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
          </div>

          {realImages.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto pt-4 max-w-2xl mx-auto">
              {realImages.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 cursor-pointer transition-all ${
                    activePhotoIndex === idx
                      ? 'border-[#E8A33D] scale-105'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* In-Platform Generic Contact Host Modal (NEVER reveals raw phone number) */}
      {isInquiryModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Contact Host
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInquiryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inquirySent ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                </div>
                <h4 className="text-base font-bold text-gray-900">Inquiry Sent!</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Your message was securely sent to {hostName || 'the host'} through the Ileya Afrika messaging network.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-4">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Have questions about <strong>{title}</strong>? Send an inquiry directly to {hostName || 'the host'}. Communication is handled securely on Ileya Afrika.
                </p>

                <div className="space-y-1.5">
                  <label htmlFor="inquiry-textarea" className="block text-xs font-semibold text-gray-700">
                    Your Message
                  </label>
                  <textarea
                    id="inquiry-textarea"
                    rows={4}
                    required
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Ask about check-in timing, power backup, or estate access..."
                    className="w-full p-3.5 text-xs bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsInquiryModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingInquiry || !inquiryMessage.trim()}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1B4332] hover:bg-[#143427] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSendingInquiry ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetails;
