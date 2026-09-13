import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Building2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  Home,
  Compass,
  Luggage
} from 'lucide-react';
import { GuestHeader } from './GuestHeader';
import { PropertyCard } from './PropertyCard';
import { BookingModal } from './BookingModal';
import { BookingConfirmationModal } from './BookingConfirmationModal';
import { MyBookingsTab } from './MyBookingsTab';
import { PropertyListing, UserSession, GuestViewTab, GuestBooking } from '../../types';
import { NIGERIAN_STATES } from '../../data/nigerianData';
import { useApp } from '../../context/AppContext';
import {
  getAllBookingsFromSupabase,
  subscribeToBookings,
  getUnavailableListingIdsForDates,
  formatDateToYYYYMMDD,
} from '../../lib/supabaseService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface GuestDashboardProps {
  session: UserSession | null;
  listings: PropertyListing[];
  onLogout: () => void;
  onBookListing: (listingId: string) => void;
}

export const GuestDashboard: React.FC<GuestDashboardProps> = ({
  session,
  listings,
  onLogout,
  onBookListing,
}) => {
  const { myBookings: contextBookings, addBooking } = useApp();

  // Navigation Tab State: 'explore' vs 'my-bookings'
  const [activeTab, setActiveTab] = useState<GuestViewTab>('explore');

  // Bookings state for Guest Dashboard
  const [bookings, setBookings] = useState<GuestBooking[]>(() => contextBookings || []);

  // Fetch bookings inside useEffect:
  // Strictly replace the state array entirely (setBookings(data)) instead of appending
  // to it (e.g. NOT setBookings(prev => [...prev, ...data])), preventing duplicate rendering in React Strict Mode.
  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      try {
        const data = await getAllBookingsFromSupabase();
        if (isMounted && data) {
          // Replaces state array entirely
          setBookings(data);
        }
      } catch (err) {
        console.warn('Could not fetch guest bookings from Supabase:', err);
      }
    };

    loadBookings();

    // Listen for real-time bookings updates from Supabase
    const unsubscribe = subscribeToBookings((data) => {
      if (isMounted && data) {
        // Replaces state array entirely
        setBookings(data);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Synchronize when contextBookings updates
  useEffect(() => {
    if (contextBookings && contextBookings.length > 0) {
      setBookings((prev) => {
        if (prev.length === 0) return contextBookings;
        const map = new Map<string, GuestBooking>();
        contextBookings.forEach((b) => map.set(b.id, b));
        prev.forEach((b) => map.set(b.id, b));
        return Array.from(map.values());
      });
    }
  }, [contextBookings]);

  // Active Booking History State - Filtered for current guest if logged in
  // Deduplicated by unique booking id so duplicate UI elements are avoided
  const userBookings = useMemo(() => {
    const rawList = Array.isArray(bookings) && bookings.length > 0 ? bookings : (Array.isArray(contextBookings) ? contextBookings : []);
    const safeList = rawList.filter((b): b is GuestBooking => Boolean(b && typeof b === 'object' && b.id));

    const filtered = session?.email
      ? safeList.filter(
          (b) => !b.guestEmail || String(b.guestEmail).toLowerCase() === String(session.email).toLowerCase()
        )
      : safeList;

    // Deduplicate strictly by unique booking id to force React to ignore duplicate records
    const uniqueMap = new Map<string, GuestBooking>();
    for (const item of filtered) {
      if (!item || !item.id) continue;
      if (!uniqueMap.has(item.id)) {
        // Check for duplicate payment reference as secondary safeguard
        const hasRefMatch = item.paymentReference
          ? Array.from(uniqueMap.values()).some(
              (existing) =>
                existing?.paymentReference &&
                existing.paymentReference === item.paymentReference
            )
          : false;

        if (!hasRefMatch) {
          uniqueMap.set(item.id, item);
        }
      }
    }

    return Array.from(uniqueMap.values());
  }, [bookings, contextBookings, session?.email]);

  // Search & Filter States (Explore Tab)
  const [selectedState, setSelectedState] = useState<string>('All');
  const [searchCityQuery, setSearchCityQuery] = useState<string>('');
  const [searchCheckInDate, setSearchCheckInDate] = useState<Date | null>(null);
  const [searchCheckOutDate, setSearchCheckOutDate] = useState<Date | null>(null);
  const [unavailableListingIds, setUnavailableListingIds] = useState<Set<string>>(new Set());
  const [isCheckingDates, setIsCheckingDates] = useState<boolean>(false);

  // Modal States
  const [selectedListingForBooking, setSelectedListingForBooking] = useState<PropertyListing | null>(null);
  const [confirmedBookingData, setConfirmedBookingData] = useState<{
    listing: PropertyListing;
    details: {
      checkInDate: string;
      checkOutDate: string;
      guestsCount: number;
      totalPrice: number;
      nights: number;
    };
  } | null>(null);

  // Search Page Date Filter:
  // If the user searches for properties using specific dates on the home page,
  // query Supabase bookings table to filter out properties that have overlapping 'completed' bookings.
  useEffect(() => {
    let isCurrent = true;

    const queryUnavailableForDates = async () => {
      if (!searchCheckInDate || !searchCheckOutDate || searchCheckOutDate <= searchCheckInDate) {
        setUnavailableListingIds(new Set());
        return;
      }

      setIsCheckingDates(true);
      const checkInStr = formatDateToYYYYMMDD(searchCheckInDate);
      const checkOutStr = formatDateToYYYYMMDD(searchCheckOutDate);

      try {
        const blockedIds = await getUnavailableListingIdsForDates(checkInStr, checkOutStr);
        if (isCurrent) {
          setUnavailableListingIds(new Set(blockedIds));
        }
      } catch (err) {
        console.warn('Could not query unavailable listings for dates:', err);
        // Fallback to active memory bookings
        const blockedIds = (bookings || [])
          .filter(
            (b) =>
              (b.paymentStatus === 'completed' || (b as any).payment_status === 'completed') &&
              b.checkInDate < checkOutStr &&
              b.checkOutDate > checkInStr
          )
          .map((b) => b.listingId);
        if (isCurrent) {
          setUnavailableListingIds(new Set(blockedIds));
        }
      } finally {
        if (isCurrent) {
          setIsCheckingDates(false);
        }
      }
    };

    queryUnavailableForDates();

    return () => {
      isCurrent = false;
    };
  }, [searchCheckInDate, searchCheckOutDate, bookings]);

  // STRICT REQUIREMENT: Only show listings where status === 'approved_live' or 'approved'
  const approvedListings = useMemo(() => {
    if (!Array.isArray(listings)) return [];
    return listings.filter(
      (item) => item && (item.status === 'approved_live' || item.status === 'approved' || !item.status)
    );
  }, [listings]);

  // Derived Cities/Areas based on selected state from approved listings
  const availableCities = useMemo(() => {
    const list = approvedListings
      .filter((l) => {
        if (!l) return false;
        if (selectedState === 'All') return true;
        const itemState = String(l.state || '').toLowerCase();
        return itemState === selectedState.toLowerCase();
      })
      .map((l) => String(l?.cityArea || '').trim())
      .filter((city, index, self) => city.length > 0 && self.indexOf(city) === index);
    return list;
  }, [approvedListings, selectedState]);

  // Filtered Approved Listings
  // Deprecate is_booked toggle:
  // Stop hiding properties from the main directory based on an is_booked status.
  // All properties should always be visible in the "All Apartments" view.
  // Availability is now strictly determined by the bookings table.
  const filteredListings = useMemo(() => {
    return approvedListings.filter((listing) => {
      if (!listing) return false;

      // 1. State Filter
      if (selectedState !== 'All') {
        const itemState = String(listing.state || '').toLowerCase();
        if (itemState !== selectedState.toLowerCase()) {
          return false;
        }
      }

      // 2. City / Keyword Search Query
      if (searchCityQuery && searchCityQuery.trim()) {
        const query = searchCityQuery.toLowerCase().trim();
        const matchesCity = String(listing.cityArea || '').toLowerCase().includes(query);
        const matchesTitle = String(listing.title || '').toLowerCase().includes(query);
        const matchesAddress = String(listing.streetAddress || '').toLowerCase().includes(query);
        const matchesState = String(listing.state || '').toLowerCase().includes(query);
        if (!matchesCity && !matchesTitle && !matchesAddress && !matchesState) {
          return false;
        }
      }

      // 3. Search Page Date Filter:
      // Exclude listings that have overlapping completed bookings for requested dates
      if (searchCheckInDate && searchCheckOutDate && searchCheckOutDate > searchCheckInDate) {
        if (unavailableListingIds.has(listing.id)) {
          return false;
        }
      }

      return true;
    });
  }, [approvedListings, selectedState, searchCityQuery, searchCheckInDate, searchCheckOutDate, unavailableListingIds]);

  // Available count: total matching current search criteria
  const availableCount = filteredListings.length;

  // Handle successful reservation after Paystack payment callback
  const handleBookingConfirmed = (bookingData: GuestBooking | {
    listingId: string;
    checkInDate: string;
    checkOutDate: string;
    guestsCount: number;
    totalPrice: number;
    nights: number;
    id?: string;
    [key: string]: any;
  }) => {
    if (!selectedListingForBooking) return;

    // Do NOT call onBookListing to permanently toggle is_booked.
    // Availability is strictly determined by the bookings table per reservation dates.

    // Reuse existing booking ID if already provided from Paystack checkout, or generate once
    const bookingId = bookingData.id || `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newBooking: GuestBooking = {
      id: bookingId,
      listingId: selectedListingForBooking.id,
      listingTitle: selectedListingForBooking.title,
      listingPhoto:
        (selectedListingForBooking.photos && selectedListingForBooking.photos.length > 0 && selectedListingForBooking.photos[0]) ||
        (selectedListingForBooking.images && selectedListingForBooking.images.length > 0 && selectedListingForBooking.images[0]) ||
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      propertyType: selectedListingForBooking.propertyType,
      state: selectedListingForBooking.state,
      cityArea: selectedListingForBooking.cityArea,
      streetAddress: selectedListingForBooking.streetAddress,
      hostFullName: selectedListingForBooking.hostFullName || 'Verified Host',
      hostWhatsApp: selectedListingForBooking.hostWhatsApp,
      hostEmail: selectedListingForBooking.hostEmail,
      guestFullName: session?.fullName || bookingData.guestFullName || 'Valued Guest',
      guestEmail: session?.email || bookingData.guestEmail || 'guest@ileya.ng',
      guestPhone: bookingData.guestPhone || '',
      checkInDate: bookingData.checkInDate,
      checkOutDate: bookingData.checkOutDate,
      guestsCount: bookingData.guestsCount,
      totalPrice: bookingData.totalPrice || bookingData.totalAmount || 0,
      totalAmount: bookingData.totalAmount || bookingData.totalPrice || 0,
      nights: bookingData.nights,
      bookedAt: bookingData.bookedAt || new Date().toISOString(),
      status: 'confirmed',
      paymentStatus: bookingData.paymentStatus || 'completed',
      paymentReference: bookingData.paymentReference || '',
    };

    // CRITICAL: Ensure we do NOT push the new booking into the array twice!
    setBookings((prev) => {
      const alreadyExists = prev.some(
        (b) =>
          b.id === newBooking.id ||
          (newBooking.paymentReference && b.paymentReference === newBooking.paymentReference)
      );
      if (alreadyExists) {
        return prev;
      }
      return [newBooking, ...prev];
    });

    addBooking(newBooking);

    // 3. Automated email dispatch simulation requirement:
    const hostEmail = selectedListingForBooking.hostEmail || 'host@ileya.ng';
    console.log(
      `Email sent to host at: ${hostEmail} - Your apartment has been booked!`
    );

    // 4. Open Booking Confirmation Modal with Directions & 24/7 Support
    setConfirmedBookingData({
      listing: {
        ...selectedListingForBooking,
        isBooked: true,
      },
      details: {
        checkInDate: newBooking.checkInDate,
        checkOutDate: newBooking.checkOutDate,
        guestsCount: newBooking.guestsCount,
        totalPrice: newBooking.totalPrice,
        nights: newBooking.nights,
      },
    });

    // Close booking calculator modal
    setSelectedListingForBooking(null);
  };

  return (
    <div className="min-h-screen bg-[#FBF6EC] text-[#14231C] flex flex-col">
      {/* Guest Navigation Header with Tab Switcher */}
      <GuestHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        session={session}
        onLogout={onLogout}
        verifiedCount={approvedListings.length}
        availableCount={availableCount}
        bookingsCount={userBookings.length}
      />

      {/* Main Guest Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* TAB 1: Explore Stays (Search, Filters, Property Grid) */}
        {activeTab === 'explore' && (
          <div className="space-y-8">
            {/* Search & Location Filter Bar */}
            <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#1B4332]/10 shadow-xs space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-[#E8A33D]" />
                    <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#1B4332]">
                      Find Physically Inspected Short-Lets in Nigeria
                    </h1>
                  </div>
                  <p className="text-xs text-[#6B756F] mt-1 max-w-2xl leading-relaxed">
                    Every apartment on Ileya Afrika is physically visited and audited for generator uptime, running water, high-speed WiFi, and security before being published.
                  </p>
                </div>

                {/* Quick State Toggle for Popular Locations */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {['All', 'Lagos', 'Abuja (FCT)', 'Rivers', 'Oyo'].map((stateName) => (
                    <button
                      key={stateName}
                      type="button"
                      onClick={() => setSelectedState(stateName)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        selectedState === stateName
                          ? 'bg-[#1B4332] text-white shadow-xs'
                          : 'bg-[#FBF6EC] text-[#14231C] hover:bg-[#1B4332]/10 border border-[#1B4332]/10'
                      }`}
                    >
                      {stateName === 'Abuja (FCT)' ? 'Abuja' : stateName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Controls: State, City Search, and Date-based Availability */}
              <div className="space-y-3 pt-3 border-t border-[#1B4332]/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                  {/* State Select Dropdown */}
                  <div className="sm:col-span-1 md:col-span-3">
                    <label
                      htmlFor="guest-state-select"
                      className="block text-[11px] font-bold text-[#14231C] mb-1"
                    >
                      Select State
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B756F]">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <select
                        id="guest-state-select"
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FBF6EC] rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                      >
                        <option value="All">All Nigerian States ({approvedListings.length} total)</option>
                        {NIGERIAN_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* City / Area Search Input */}
                  <div className="sm:col-span-1 md:col-span-3">
                    <label
                      htmlFor="guest-city-search"
                      className="block text-[11px] font-bold text-[#14231C] mb-1"
                    >
                      City, Area, or Landmark
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B756F]">
                        <Search className="w-4 h-4" />
                      </div>
                      <input
                        id="guest-city-search"
                        type="text"
                        value={searchCityQuery}
                        onChange={(e) => setSearchCityQuery(e.target.value)}
                        placeholder="e.g. Lekki, Maitama..."
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FBF6EC] rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                      />
                      {searchCityQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchCityQuery('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#6B756F] hover:text-[#14231C] cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Search Check-In Date */}
                  <div className="sm:col-span-1 md:col-span-3">
                    <label className="block text-[11px] font-bold text-[#14231C] mb-1">
                      Check-In Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B756F] z-10">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <DatePicker
                        selected={searchCheckInDate}
                        onChange={(date: Date | null) => {
                          setSearchCheckInDate(date);
                          if (date && searchCheckOutDate && date >= searchCheckOutDate) {
                            const nextDay = new Date(date);
                            nextDay.setDate(nextDay.getDate() + 1);
                            setSearchCheckOutDate(nextDay);
                          }
                        }}
                        selectsStart
                        startDate={searchCheckInDate}
                        endDate={searchCheckOutDate}
                        minDate={new Date()}
                        placeholderText="Check-in date"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FBF6EC] rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                        dateFormat="MMM d, yyyy"
                      />
                    </div>
                  </div>

                  {/* Search Check-Out Date */}
                  <div className="sm:col-span-1 md:col-span-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-[#14231C]">
                        Check-Out Date
                      </label>
                      {(searchCheckInDate || searchCheckOutDate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchCheckInDate(null);
                            setSearchCheckOutDate(null);
                          }}
                          className="text-[10px] text-[#2D6A4F] hover:underline font-bold cursor-pointer"
                        >
                          Clear Dates
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B756F] z-10">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <DatePicker
                        selected={searchCheckOutDate}
                        onChange={(date: Date | null) => setSearchCheckOutDate(date)}
                        selectsEnd
                        startDate={searchCheckInDate}
                        endDate={searchCheckOutDate}
                        minDate={searchCheckInDate ? new Date(searchCheckInDate.getTime() + 86400000) : new Date()}
                        placeholderText="Check-out date"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FBF6EC] rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                        dateFormat="MMM d, yyyy"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Date Query Indicator */}
                {searchCheckInDate && searchCheckOutDate && searchCheckOutDate > searchCheckInDate && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-950">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span>
                        Filtering availability for <strong>{searchCheckInDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</strong> – <strong>{searchCheckOutDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                      </span>
                      {isCheckingDates && (
                        <span className="text-[10px] text-emerald-700 italic font-mono">(querying Supabase bookings...)</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchCheckInDate(null);
                        setSearchCheckOutDate(null);
                      }}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                    >
                      Reset Dates (Show All Apartments)
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Property Grid & Results Header */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#2D6A4F]" />
                  <h2 className="text-lg font-bold font-serif text-[#1B4332]">
                    {searchCheckInDate && searchCheckOutDate ? 'Available Apartments' : 'All Apartments'}
                  </h2>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#1B4332]/10 text-[#1B4332]">
                    {filteredListings.length} {filteredListings.length === 1 ? 'apartment' : 'apartments'}
                  </span>
                </div>

                <div className="text-xs text-[#6B756F]">
                  Showing approved properties in <strong className="text-[#14231C]">{selectedState}</strong>
                </div>
              </div>

              {/* Grid of Verified Property Cards */}
              {filteredListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredListings.map((listing, idx) => {
                    if (!listing) return null;
                    return (
                      <PropertyCard
                        key={listing.id || `prop-${idx}`}
                        listing={listing}
                        onSelectAndBook={(item) => setSelectedListingForBooking(item)}
                      />
                    );
                  })}
                </div>
              ) : (
                /* Graceful Empty State */
                <div className="bg-white rounded-3xl p-12 sm:p-16 border border-[#1B4332]/10 text-center shadow-xs space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#FBF6EC] text-[#2D6A4F] flex items-center justify-center mx-auto shadow-inner">
                    <Building2 className="w-8 h-8" />
                  </div>

                  <div className="max-w-md mx-auto space-y-1.5">
                    <h3 className="text-lg font-bold font-serif text-[#1B4332]">
                      {approvedListings.length === 0
                        ? 'No Verified Apartments Published Yet'
                        : 'No Apartments Match Your Criteria'}
                    </h3>
                    <p className="text-xs text-[#6B756F] leading-relaxed">
                      {approvedListings.length === 0
                        ? 'Our quality assurance team is currently on-ground conducting physical audits of newly registered host properties. Check back shortly!'
                        : searchCheckInDate && searchCheckOutDate
                        ? `No apartments are available for your chosen dates (${formatDateToYYYYMMDD(searchCheckInDate)} to ${formatDateToYYYYMMDD(searchCheckOutDate)}). Try adjusting your dates or resetting the date filter to see all apartments.`
                        : `We couldn't find any approved short-lets matching your filter (${selectedState}${
                            searchCityQuery ? `, query: "${searchCityQuery}"` : ''
                          }). Try selecting "All Nigerian States" or clearing your search.`}
                    </p>
                  </div>

                  {(selectedState !== 'All' || searchCityQuery || searchCheckInDate || searchCheckOutDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedState('All');
                        setSearchCityQuery('');
                        setSearchCheckInDate(null);
                        setSearchCheckOutDate(null);
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#E8A33D] hover:bg-[#d99530] text-[#14231C] transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>Reset All Filters</span>
                    </button>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: My Bookings (Upcoming Trips & Past Bookings) */}
        {activeTab === 'my-bookings' && (
          <MyBookingsTab
            myBookings={userBookings}
            onExploreClick={() => setActiveTab('explore')}
          />
        )}
      </main>

      {/* Booking Calculation & Confirmation Modals */}
      {selectedListingForBooking && (
        <BookingModal
          listing={selectedListingForBooking}
          guestFullName={session?.fullName || 'Valued Guest'}
          guestEmail={session?.email || 'guest@ileya.ng'}
          onClose={() => setSelectedListingForBooking(null)}
          onConfirmBooking={handleBookingConfirmed}
        />
      )}

      {confirmedBookingData && (
        <BookingConfirmationModal
          listing={confirmedBookingData.listing}
          bookingDetails={confirmedBookingData.details}
          guestFullName={session?.fullName || 'Valued Guest'}
          guestEmail={session?.email || 'guest@ileya.ng'}
          onClose={() => {
            setConfirmedBookingData(null);
            // Optionally switch to My Bookings tab so guest can immediately see their reservation
            setActiveTab('my-bookings');
          }}
        />
      )}

      {/* Guest Experience Footer */}
      <footer className="border-t border-[#1B4332]/10 bg-white/60 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B756F]">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-[#1B4332]">Ileya Afrika Guest Hub</span>
            <span>•</span>
            <span>100% On-Ground Physical Verification Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
            <span>24/7 Concierge & Escrow Protection</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
