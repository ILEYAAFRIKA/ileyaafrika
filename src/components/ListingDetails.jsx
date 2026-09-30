import React, { useState } from 'react';
import {
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Users,
  Star,
  Zap,
  Wifi,
  Wind,
  Shield,
  Waves,
  Car,
  Tv,
  Utensils,
  Droplets,
  Share2,
  Heart,
  X,
  ArrowLeft,
  ChevronRight,
  Phone,
  MessageSquare,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';

/**
 * Public Listing Details Component (ListingDetails.jsx)
 * Fully viewable by unauthenticated guests.
 * Features:
 * - Property title, location, image gallery
 * - "Verified by Ileya Afrika" trust badge
 * - Full description & host details
 * - Structured amenities grid
 * - Customer reviews section
 * - Authentication Guard on Booking:
 *   If not logged in: alert("Please log in or sign up to complete your booking") & redirects to /login.
 *   If logged in: proceeds to checkout flow.
 */
export const ListingDetails = ({
  listing,
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

  // Determine user login status (props > context > localStorage)
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

  // Reservation Form State
  const [checkInDate, setCheckInDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [checkOutDate, setCheckOutDate] = useState(() => {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 4);
    return dayAfter.toISOString().split('T')[0];
  });

  const [guestsCount, setGuestsCount] = useState(2);
  const [showAllPhotosModal, setShowAllPhotosModal] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isBookedSuccess, setIsBookedSuccess] = useState(false);

  if (!listing) return null;

  const photos =
    Array.isArray(listing.photos) && listing.photos.length > 0
      ? listing.photos
      : Array.isArray(listing.images) && listing.images.length > 0
      ? listing.images
      : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'];

  // Calculate nights and pricing
  const calculateNights = () => {
    try {
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  };

  const nights = calculateNights();
  const ratePerNight = Number(listing.pricePerDay || listing.price || 0);
  const subtotal = ratePerNight * nights;
  const serviceFee = Math.round(subtotal * 0.05); // 5% platform verification fee
  const totalAmount = subtotal + serviceFee;

  // Authentication Guard on Booking
  const handleBookNow = (e) => {
    if (e) e.preventDefault();

    // Check if user is logged in
    const currentUser = getLoggedInUser();
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

    // User is logged in: Proceed to normal checkout flow
    if (typeof onConfirmBooking === 'function') {
      onConfirmBooking({
        listingId: listing.id,
        listingTitle: listing.title,
        checkInDate,
        checkOutDate,
        guestsCount,
        totalAmount,
      });
    } else {
      setIsBookedSuccess(true);
    }
  };

  // Pre-configured icon mapping for amenities
  const getAmenityIcon = (label = '') => {
    const text = label.toLowerCase();
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

  // Sample guest reviews for verified property
  const sampleReviews = [
    {
      id: 1,
      author: 'Emeka Nwosu',
      location: 'Lagos, Nigeria',
      rating: 5,
      date: 'February 2025',
      comment:
        'The physical verification on Ileya Afrika is 100% accurate. The 24/7 generator kicked in immediately when the national grid had an outage. Super fast WiFi and very clean borehole water.',
    },
    {
      id: 2,
      author: 'Folashade Adeleke',
      location: 'London, UK',
      rating: 5,
      date: 'January 2025',
      comment:
        'Traveling home for vacation can be stressful with power and security issues, but this apartment exceeded expectations. Gated security was polite and professional.',
    },
    {
      id: 3,
      author: 'Tariq Al-Mansoor',
      location: 'Dubai, UAE',
      rating: 4.9,
      date: 'December 2024',
      comment:
        'Exactly as advertised. Spacious, luxury finishes, and the host was very responsive via WhatsApp. Will definitely book through Ileya Afrika again.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl sm:rounded-3xl min-h-screen sm:min-h-0 sm:max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col my-auto border border-gray-100">
        {/* Top Header Bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to listings</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Verified by Ileya Afrika</span>
            </span>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer ml-1"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8 flex-1">
          {/* 1. Title & Header Info */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 tracking-tight">
              {listing.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-gray-600">
              <div className="flex items-center gap-1 font-bold text-gray-900">
                <Star className="w-3.5 h-3.5 fill-[#E8A33D] text-[#E8A33D]" />
                <span>4.96</span>
                <span className="font-normal text-gray-500 underline ml-0.5">
                  (28 reviews)
                </span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {listing.streetAddress ? `${listing.streetAddress}, ` : ''}
                  {listing.cityArea}, <strong>{listing.state}</strong>
                </span>
              </div>
              <span>•</span>
              <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                {listing.propertyType || 'Entire Serviced Apartment'}
              </span>
            </div>
          </div>

          {/* 2. Photo Gallery Grid */}
          <div className="relative rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-4 gap-2 h-72 sm:h-96">
            {/* Primary Large Photo */}
            <div className="md:col-span-2 h-full bg-gray-100 overflow-hidden relative group">
              <img
                src={photos[0]}
                alt={listing.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 cursor-pointer"
                onClick={() => {
                  setActivePhotoIndex(0);
                  setShowAllPhotosModal(true);
                }}
              />
            </div>

            {/* Smaller Secondary Photos */}
            <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2 h-full">
              {[1, 2, 3, 4].map((idx) => {
                const imgUrl = photos[idx] || photos[0];
                return (
                  <div
                    key={idx}
                    className="h-full bg-gray-100 overflow-hidden relative group cursor-pointer"
                    onClick={() => {
                      setActivePhotoIndex(idx < photos.length ? idx : 0);
                      setShowAllPhotosModal(true);
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`${listing.title} ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                );
              })}
            </div>

            {/* "Show all photos" Button */}
            <button
              type="button"
              onClick={() => setShowAllPhotosModal(true)}
              className="absolute bottom-4 right-4 bg-white/95 hover:bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-xl shadow-md border border-gray-200 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
            >
              <span>Show all photos ({photos.length})</span>
            </button>
          </div>

          {/* 3. Main Split View: Left Details vs Right Sticky Booking Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 pt-4">
            {/* Left 2 Columns: Description, Verification Notes, Amenities, Reviews */}
            <div className="lg:col-span-2 space-y-8">
              {/* Physical Verification Trust Card */}
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5 text-emerald-200" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">
                      Physically Inspected by Ileya Afrika
                    </h3>
                    <p className="text-xs text-emerald-800">
                      Standard Quality Audit Verified on Site
                    </p>
                  </div>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed pl-10">
                  {listing.verificationNotes ||
                    'Physical on-site inspection completed. 24/7 standby industrial generator with automatic changeover verified, borehole water treatment tested, and security perimeter confirmed.'}
                </p>
              </div>

              {/* Host Quick Profile */}
              <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-gray-900">
                    Hosted by {listing.hostFullName || 'Registered Host Partner'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Verified Host Partner • Identity & NUBAN Confirmed
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {(listing.hostFullName || 'H').charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3 pb-6 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">About this place</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line font-normal">
                  {listing.description ||
                    'Welcome to this physically verified short-let apartment. Located in a secure gated estate with 24/7 power, steady treated water, high-speed WiFi, and premium furnishings designed for comfortable vacation or remote work living.'}
                </p>
              </div>

              {/* Amenities Grid */}
              <div className="space-y-4 pb-6 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">What this place offers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {(Array.isArray(listing.amenities) && listing.amenities.length > 0
                    ? listing.amenities
                    : [
                        '24/7 Power / Generator / Solar',
                        'High-Speed WiFi',
                        'Air Conditioning (AC)',
                        'Gated Security & CCTV',
                        'Treated Running Water',
                        'Smart TV & DSTV / Netflix',
                        'Free Secured Parking',
                        'Fully Equipped Kitchen',
                      ]
                  ).map((amenity, idx) => (
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

              {/* Reviews Section */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-[#E8A33D] text-[#E8A33D]" />
                  <h3 className="text-lg font-bold text-gray-900">
                    4.96 • 28 Verified Guest Reviews
                  </h3>
                </div>

                <div className="space-y-4">
                  {sampleReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{rev.author}</p>
                          <p className="text-[11px] text-gray-500">{rev.location} • {rev.date}</p>
                        </div>
                        <div className="flex items-center gap-0.5 text-xs text-[#E8A33D] font-bold">
                          {'★'.repeat(5)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed font-normal">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sticky Column: Booking Card with Authentication Guard */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-3xl p-6 shadow-xl border border-gray-200/80 space-y-5">
                {/* Rate Header */}
                <div className="flex items-baseline justify-between border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-2xl font-bold font-mono text-gray-950">
                      ₦{ratePerNight.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">/ night</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
                    <Star className="w-3.5 h-3.5 fill-[#E8A33D] text-[#E8A33D]" />
                    <span>4.96</span>
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
                        onChange={(e) => setCheckInDate(e.target.value)}
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
                        onChange={(e) => setCheckOutDate(e.target.value)}
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

                {/* Pricing Calculation Breakdown */}
                <div className="space-y-2 text-xs text-gray-600 border-b border-gray-100 pb-4">
                  <div className="flex justify-between">
                    <span>₦{ratePerNight.toLocaleString()} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
                    <span className="font-mono text-gray-900 font-medium">₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Physical Verification & Service fee</span>
                    <span className="font-mono text-gray-900 font-medium">₦{serviceFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t border-gray-100">
                    <span>Total (NGN)</span>
                    <span className="font-mono text-[#1B4332]">₦{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Book Now Button with Authentication Guard */}
                <div>
                  <button
                    type="button"
                    onClick={handleBookNow}
                    id="listing-book-now-button"
                    className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98] transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 border border-[#E8A33D]/30"
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
                        Login required to complete booking. Instant escrow settlement.
                      </span>
                    ) : (
                      <span>You won't be charged until host confirms availability.</span>
                    )}
                  </p>
                </div>

                {/* Success message if booked */}
                {isBookedSuccess && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs text-center font-medium animate-in zoom-in-95">
                    🎉 Reservation request initiated! Check "My Bookings" in your profile.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Photo Viewer Modal */}
      {showAllPhotosModal && (
        <div className="fixed inset-0 z-60 bg-black/95 flex flex-col p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-white pb-4">
            <span className="text-sm font-semibold">
              Photo {activePhotoIndex + 1} of {photos.length}
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
              src={photos[activePhotoIndex]}
              alt={`Photo ${activePhotoIndex + 1}`}
              referrerPolicy="no-referrer"
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
          </div>

          <div className="flex items-center justify-center gap-2 overflow-x-auto pt-4 max-w-2xl mx-auto">
            {photos.map((p, idx) => (
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
        </div>
      )}
    </div>
  );
};

export default ListingDetails;
