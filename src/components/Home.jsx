import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  Building2,
  Loader2,
  ArrowRight,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { NIGERIAN_STATES } from '../data/nigerianData';
import { ListingDetails } from './ListingDetails';

/**
 * Public Homepage Component (Home.jsx)
 * Connected strictly to real Supabase database.
 * No hardcoded listings, mock arrays, or invented text/ratings.
 */
export const Home = ({
  onSelectListing: propOnSelectListing,
  onNavigate,
}) => {
  // Search inputs localized for Nigeria
  const [selectedState, setSelectedState] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guestsCount, setGuestsCount] = useState('1');

  // Active filter state applied to grid
  const [activeFilters, setActiveFilters] = useState({
    state: '',
    city: '',
    guests: '1',
  });

  // Real Database Listings State
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Selected Listing for Modal Details View (if used as modal)
  const [activeModalListing, setActiveModalListing] = useState(null);

  // Strictly fetch real verified listings from Supabase
  useEffect(() => {
    let isMounted = true;

    async function fetchVerifiedListings() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('verification_status', 'verified')
          .neq('status', 'delisted')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching verified listings:', error);
          if (isMounted) {
            setErrorMsg(error.message);
            setListings([]);
          }
        } else if (isMounted) {
          setListings(data || []);
        }
      } catch (err) {
        console.error('Fetch exception in Home.jsx:', err);
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to load properties');
          setListings([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchVerifiedListings();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Search Submission
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setActiveFilters({
      state: selectedState,
      city: cityInput.trim(),
      guests: guestsCount,
    });
  };

  // Client-Side Fallback: guarantee only non-delisted and verified listings
  const displayListings = listings.filter(
    (item) => item && item.status !== 'delisted' && (item.verification_status === 'verified' || item.verificationStatus === 'verified')
  );

  // Filter real listings based on active search criteria
  const filteredListings = displayListings.filter((item) => {
    const itemState = item.state || '';
    if (activeFilters.state && activeFilters.state !== 'all') {
      if (itemState.toLowerCase() !== activeFilters.state.toLowerCase()) {
        return false;
      }
    }
    if (activeFilters.city) {
      const q = activeFilters.city.toLowerCase();
      const cityArea = (item.city_area || item.city || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      const street = (item.street_address || '').toLowerCase();
      const st = itemState.toLowerCase();
      if (!cityArea.includes(q) && !st.includes(q) && !title.includes(q) && !street.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleCardClick = (listing) => {
    if (typeof propOnSelectListing === 'function') {
      propOnSelectListing(listing);
    } else {
      setActiveModalListing(listing);
    }
  };

  return (
    <div className="bg-white min-h-screen text-gray-900 font-sans">
      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-b from-gray-50 via-white to-white py-12 sm:py-16 md:py-20 px-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Physically Audited Homes in Nigeria</span>
          </div>

          {/* Headline */}
          <div className="space-y-3 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 tracking-tight leading-[1.15]">
              Feel at home, <br className="hidden sm:inline" />
              anywhere in <span className="text-[#1B4332]">Nigeria</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-normal max-w-2xl mx-auto">
              Every short-let is physically verified for standby generator power, running water, and gated security before you book.
            </p>
          </div>

          {/* Search Bar Localized for Nigeria */}
          <div className="pt-4 max-w-5xl mx-auto">
            <form
              onSubmit={handleSearch}
              className="bg-white rounded-3xl sm:rounded-full shadow-lg border border-gray-200/80 p-2 sm:p-2.5 flex flex-col sm:flex-row items-center divide-y sm:divide-y-0 sm:divide-x divide-gray-100 transition-all hover:shadow-xl"
            >
              {/* State Input */}
              <div className="w-full sm:flex-1 px-4 py-2.5 text-left group">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-700">
                  State
                </label>
                <div className="flex items-center gap-2 mt-0.5">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-gray-800 focus:outline-none cursor-pointer truncate"
                  >
                    <option value="">All States in Nigeria</option>
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* City / Area Input */}
              <div className="w-full sm:flex-1 px-4 py-2.5 text-left group">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-700">
                  City or Area
                </label>
                <div className="flex items-center gap-2 mt-0.5">
                  <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder="e.g. Lekki, Ikoyi, Maitama..."
                    className="w-full bg-transparent text-sm font-medium text-gray-800 focus:outline-none placeholder-gray-400 truncate"
                  />
                </div>
              </div>

              {/* Check-in / Check-out Dates */}
              <div className="w-full sm:flex-1 px-4 py-2.5 text-left group">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-700">
                  Dates
                </label>
                <div className="flex items-center gap-2 mt-0.5">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex items-center gap-1.5 w-full text-xs">
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="bg-transparent text-xs font-medium text-gray-800 focus:outline-none cursor-pointer w-24 sm:w-auto"
                      title="Check-in date"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="bg-transparent text-xs font-medium text-gray-800 focus:outline-none cursor-pointer w-24 sm:w-auto"
                      title="Check-out date"
                    />
                  </div>
                </div>
              </div>

              {/* Guests Selector */}
              <div className="w-full sm:w-40 px-4 py-2.5 text-left group">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-700">
                  Guests
                </label>
                <div className="flex items-center gap-2 mt-0.5">
                  <Users className="w-4 h-4 text-gray-400 shrink-0" />
                  <select
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-gray-800 focus:outline-none cursor-pointer"
                  >
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3">3 Guests</option>
                    <option value="4">4+ Guests</option>
                  </select>
                </div>
              </div>

              {/* Search CTA Button */}
              <div className="w-full sm:w-auto p-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98] text-white flex items-center justify-center gap-2 font-semibold text-sm shadow-md transition-all cursor-pointer border border-[#E8A33D]/30"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 2. PROPERTY GRID SECTION */}
      <section className="py-12 sm:py-16 px-6 max-w-7xl mx-auto">
        {/* Section Heading & Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
              Verified Properties in Nigeria
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Physically audited apartments ready for immediate short-let booking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(activeFilters.state || activeFilters.city) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedState('');
                  setCityInput('');
                  setActiveFilters({ state: '', city: '', guests: '1' });
                }}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Clear Filters</span>
              </button>
            )}

            {!isLoading && (
              <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-3.5 py-1.5 rounded-full border border-gray-200">
                Showing <strong>{filteredListings.length}</strong> {filteredListings.length === 1 ? 'place' : 'places'}
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#1B4332]" />
            <p className="text-sm font-medium">Loading properties...</p>
          </div>
        ) : errorMsg ? (
          <div className="py-16 px-6 text-center bg-gray-50 rounded-3xl border border-gray-100 max-w-xl mx-auto space-y-3">
            <p className="text-sm text-rose-600 font-medium">{errorMsg}</p>
            <p className="text-xs text-gray-500">No properties available right now</p>
          </div>
        ) : filteredListings.length === 0 ? (
          /* Empty State: Strict Requirement: Show "No properties available right now" message if fetched array is empty */
          <div className="py-16 px-6 text-center bg-gray-50 rounded-3xl border border-gray-100 max-w-xl mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white text-gray-400 flex items-center justify-center mx-auto mb-2 border border-gray-200 shadow-xs">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No properties available right now</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              There are currently no verified properties available matching your criteria. Please check back later.
            </p>
            {(activeFilters.state || activeFilters.city) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedState('');
                  setCityInput('');
                  setActiveFilters({ state: '', city: '', guests: '1' });
                }}
                className="mt-3 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1B4332] hover:bg-[#143427] transition-all cursor-pointer shadow-xs"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          /* Map strictly over real Supabase data */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {filteredListings.map((listing) => {
              // Extract real image without inventing URLs
              const primaryImage =
                (Array.isArray(listing.photos) && listing.photos[0]) ||
                listing.image_url ||
                (Array.isArray(listing.images) && listing.images[0]) ||
                (Array.isArray(listing.verification_evidence_urls) && listing.verification_evidence_urls[0]) ||
                null;

              const price = listing.price_per_day || listing.price || listing.pricePerDay || null;
              const propertyType = listing.property_type || listing.propertyType || null;
              const locationParts = [listing.city_area || listing.city, listing.state].filter(Boolean);

              return (
                <article
                  key={listing.id}
                  onClick={() => handleCardClick(listing)}
                  className="group cursor-pointer rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Property Image Container with Fallback Block */}
                    <div className="relative aspect-4/3 w-full bg-gray-100 overflow-hidden">
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={listing.title || 'Property'}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        /* Grey Fallback Block for missing images (strictly no invented photos) */
                        <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400 p-4">
                          <Building2 className="w-8 h-8 text-gray-300 mb-1" />
                          <span className="text-[11px] text-gray-400 font-medium">No photo available</span>
                        </div>
                      )}

                      {/* Verified Badge Overlay */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-700/95 text-white text-[11px] font-bold shadow-sm backdrop-blur-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                          <span>Verified</span>
                        </span>
                      </div>

                      {/* Property Type Tag (only rendered if present) */}
                      {propertyType && (
                        <div className="absolute top-3 right-3 bg-white/95 text-gray-800 text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-xs">
                          {propertyType}
                        </div>
                      )}
                    </div>

                    {/* Card Content - strictly real data, no invented ratings */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 group-hover:text-[#1B4332] transition-colors">
                        {listing.title || ''}
                      </h3>

                      {locationParts.length > 0 && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>{locationParts.join(', ')}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price Footer */}
                  <div className="p-4 pt-0 border-t border-gray-50 flex items-baseline justify-between mt-2">
                    <div>
                      {price !== null ? (
                        <>
                          <span className="text-base font-bold font-mono text-gray-950">
                            ₦{Number(price).toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">/ night</span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Price on request</span>
                      )}
                    </div>

                    <span className="text-xs font-semibold text-[#1B4332] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal View for Listing Details if active */}
      {activeModalListing && (
        <ListingDetails
          listing={activeModalListing}
          onClose={() => setActiveModalListing(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};

export default Home;
