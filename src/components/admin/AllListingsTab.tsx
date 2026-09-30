import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  SlidersHorizontal,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Trash2,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { PropertyListing, ListingStatus } from '../../types';
import { NIGERIAN_STATES } from '../../data/nigerianData';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

interface AllListingsTabProps {
  listings: PropertyListing[];
  onToggleBookingStatus?: (id: string) => void;
  onDeleteListing: (id: string) => void;
  onUpdateListingStatus: (id: string, status: ListingStatus) => void;
}

export const AllListingsTab: React.FC<AllListingsTabProps> = ({
  listings,
}) => {
  const { refreshListings, setListings } = useApp();
  const [selectedState, setSelectedState] = useState<string>('all');
  const [citySearch, setCitySearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDetailsListing, setSelectedDetailsListing] = useState<PropertyListing | null>(null);

  // Delist state & processing
  const [listingToDelete, setListingToDelete] = useState<PropertyListing | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [delistError, setDelistError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // 2. Client-Side Filter (Fallback):
  // Explicitly filter out delisted items from the All Listings directory view
  const nonDelistedListings = listings.filter((listing) => listing && listing.status !== 'delisted');

  // Filter listings by State, City Area/Title, and Status
  const filteredListings = nonDelistedListings.filter((item) => {
    // 1. State filter
    if (selectedState !== 'all' && item.state.toLowerCase() !== selectedState.toLowerCase()) {
      return false;
    }

    // 2. City / Area / Title text search
    if (citySearch.trim()) {
      const search = citySearch.toLowerCase();
      const matchCity = item.cityArea.toLowerCase().includes(search);
      const matchStreet = item.streetAddress.toLowerCase().includes(search);
      const matchTitle = item.title.toLowerCase().includes(search);
      if (!matchCity && !matchStreet && !matchTitle) return false;
    }

    // 3. Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'approved_live' || statusFilter === 'approved') {
        if (item.status !== 'approved_live' && item.status !== 'approved') return false;
      } else if (statusFilter === 'pending_verification' || statusFilter === 'pending') {
        if (item.status !== 'pending_verification' && item.status !== 'pending') return false;
      } else if (statusFilter === 'rejected') {
        if (item.status !== 'rejected') return false;
      } else if (item.status !== statusFilter) {
        return false;
      }
    }

    return true;
  });

  const handlePromptDelete = (listing: PropertyListing, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setDelistError(null);
    setListingToDelete(listing);
  };

  // 1. Optimistic Delist Handler with Immediate React State Update and Supabase Persistence
  const handleConfirmDelete = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!listingToDelete) return;
    const listingId = listingToDelete.id;
    const listingTitle = listingToDelete.title;
    setIsProcessing(true);
    setDelistError(null);

    // Optimistic UI state update: immediately remove delisted property from view
    setListings((prev) => prev.filter((item) => item.id !== listingId));

    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'delisted',
        })
        .eq('id', listingId);

      if (error) {
        // Revert local state if database update fails
        await refreshListings();
        throw error;
      }

      setSuccessToast(`Successfully delisted "${listingTitle}". Property has been removed.`);
      setTimeout(() => setSuccessToast(null), 4000);
      setListingToDelete(null);

      if (selectedDetailsListing?.id === listingId) {
        setSelectedDetailsListing(null);
      }
    } catch (err: any) {
      console.error('Delist failed:', err);
      const errMsg = err?.message || 'Failed to delist property. Check Supabase database permissions.';
      setDelistError(errMsg);
      alert(`Delist Failed: ${errMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-[#1B4332] text-white shadow-xl flex items-center justify-between gap-3 border border-[#E8A33D]/40 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E8A33D] text-[#14231C] flex items-center justify-center shrink-0 font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#E8A33D]">Action Completed Successfully</p>
              <p className="text-xs text-white/90">{successToast}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setSuccessToast(null);
            }}
            className="text-white/60 hover:text-white p-1 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header with Search and Geographical Filters */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#1B4332]/10 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1B4332]">
              National Property Directory
            </h2>
            <p className="text-xs text-[#6B756F] mt-0.5">
              Filter, oversee verification status, and manage active/delisted properties across Nigeria.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6B756F]">Total in View:</span>
            <span className="px-3 py-1 rounded-xl bg-[#FBF6EC] border border-[#1B4332]/10 text-xs font-bold text-[#1B4332] font-mono">
              {filteredListings.length} / {listings.length}
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#1B4332]/10 items-end">
          {/* Nigerian State Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B756F] mb-1">
              Filter by State
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B756F]">
                <MapPin className="w-3.5 h-3.5 text-[#2D6A4F]" />
              </div>
              <select
                id="filter-state-select"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#FBF6EC] rounded-xl border border-[#1B4332]/15 text-[#14231C] font-medium focus:outline-none focus:ring-2 focus:ring-[#1B4332] cursor-pointer"
              >
                <option value="all">All States ({nonDelistedListings.length})</option>
                {NIGERIAN_STATES.map((st) => {
                  const count = nonDelistedListings.filter((l) => l.state.toLowerCase() === st.toLowerCase()).length;
                  return (
                    <option key={st} value={st}>
                      {st} {count > 0 ? `(${count})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* City / Area / Title Keyword Search */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B756F] mb-1">
              Search City, Area, or Title
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B756F]">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                id="search-city-input"
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="e.g. Ikoyi, Lekki, Maitama, Wuse..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#FBF6EC] rounded-xl border border-[#1B4332]/15 text-[#14231C] font-medium focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>
          </div>

          {/* Verification Status Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B756F] mb-1">
              Verification Status
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B756F]">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
              <select
                id="filter-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#FBF6EC] rounded-xl border border-[#1B4332]/15 text-[#14231C] font-medium focus:outline-none focus:ring-2 focus:ring-[#1B4332] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="approved_live">Approved & Live</option>
                <option value="pending_verification">Pending Physical Inspection</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Grid / Empty States */}
      {nonDelistedListings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 sm:p-16 text-center border border-[#1B4332]/10 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#1B4332]/5 text-[#1B4332] flex items-center justify-center mx-auto mb-4 border border-[#1B4332]/10">
            <Building2 className="w-8 h-8 text-[#2D6A4F]" />
          </div>
          <h3 className="text-xl font-bold text-[#14231C] font-serif">
            No Properties on Platform Yet
          </h3>
          <p className="text-xs text-[#6B756F] max-w-md mx-auto mt-2 leading-relaxed">
            There are currently no listings in the platform directory. When property hosts register and submit apartments, they will populate here.
          </p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#1B4332]/10 shadow-xs">
          <Building2 className="w-10 h-10 text-[#6B756F]/40 mx-auto mb-2" />
          <h4 className="text-base font-bold text-[#14231C]">
            No Listings Match Your Filters
          </h4>
          <p className="text-xs text-[#6B756F] max-w-sm mx-auto mt-1">
            Try adjusting your state selection, search keywords, or verification status filter.
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => {
                setSelectedState('all');
                setCitySearch('');
                setStatusFilter('all');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1B4332] bg-[#FBF6EC] hover:bg-[#1B4332]/10 transition-all cursor-pointer border border-[#1B4332]/10"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => {
            const isVerified =
              listing.verification_status === 'verified' ||
              listing.verificationStatus === 'verified' ||
              listing.status === 'approved' ||
              listing.status === 'approved_live';
            const isPending =
              listing.verification_status === 'pending' ||
              listing.verificationStatus === 'pending' ||
              listing.status === 'pending_verification' ||
              listing.status === 'pending';

            return (
              <div
                key={listing.id}
                className="bg-white rounded-2xl border border-[#1B4332]/15 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Top Section: Photo & Status Badges */}
                <div>
                  <div className="relative h-44 w-full bg-[#1B4332]/5 overflow-hidden">
                    {(listing.photos && listing.photos[0]) || (listing.images && listing.images[0]) ? (
                      <img
                        src={listing.photos?.[0] || listing.images?.[0]}
                        alt={listing.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#6B756F]">
                        <Building2 className="w-10 h-10 opacity-40" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      {isVerified ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-700 text-white flex items-center gap-1 shadow-sm border border-emerald-600">
                          <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                          <span>Verified</span>
                        </span>
                      ) : isPending ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500 text-stone-950 flex items-center gap-1 shadow-sm border border-amber-400 font-bold">
                          <Clock className="w-3 h-3 text-stone-950" />
                          <span>Pending Verification</span>
                        </span>
                      ) : listing.status === 'rejected' ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-700 text-white flex items-center gap-1 shadow-sm border border-rose-600">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-stone-600 text-white flex items-center gap-1 shadow-sm">
                          <span>{listing.status}</span>
                        </span>
                      )}
                    </div>

                    {/* Price tag */}
                    <div className="absolute bottom-3 left-3 bg-[#14231C]/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-xs font-bold font-mono border border-white/10">
                      ₦{listing.pricePerDay.toLocaleString()} / night
                    </div>

                    {/* Property type */}
                    <div className="absolute top-3 right-3 bg-white/90 text-[#1B4332] px-2 py-0.5 rounded text-[10px] font-semibold">
                      {listing.propertyType}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-[#14231C] line-clamp-1">
                        {listing.title}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-[#6B756F] mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0" />
                        <span className="truncate">
                          {listing.cityArea}, <strong>{listing.state}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Booking Availability Info */}
                    <div className="p-3 bg-[#FBF6EC] rounded-xl border border-[#1B4332]/10 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B756F] block">
                          Status & Availability
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
                          <span className="text-xs font-bold text-[#2D6A4F]">Calendar-Managed</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-[#1B4332] bg-white px-2.5 py-1 rounded-lg border border-[#1B4332]/10 shadow-2xs font-mono">
                        Date-based
                      </span>
                    </div>

                    {/* Host quick summary */}
                    <div className="text-[11px] text-[#6B756F] flex items-center justify-between border-t border-[#1B4332]/10 pt-2">
                      <span>
                        Host: <strong className="text-[#14231C]">{listing.hostFullName || 'Host Partner'}</strong>
                      </span>
                      <span className="font-mono text-[#1B4332]">{listing.hostWhatsApp}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 pt-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedDetailsListing(listing);
                    }}
                    id={`view-admin-details-${listing.id}`}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-[#FBF6EC] hover:bg-[#1B4332]/10 text-[#1B4332] transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-[#1B4332]/10"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={(e) => handlePromptDelete(listing, e)}
                    id={`delist-btn-${listing.id}`}
                    title="Delist Property"
                    className="py-2 px-3.5 rounded-xl text-xs font-semibold text-rose-800 hover:text-white hover:bg-rose-700 bg-rose-50 border border-rose-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-current" />
                    <span>Delist</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delist Confirmation Modal */}
      {listingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14231C]/65 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#14231C] font-serif">Delist Property?</h3>
                <p className="text-xs text-[#6B756F]">Update property status to 'delisted' in Supabase</p>
              </div>
            </div>

            <div className="bg-[#FBF6EC] p-3 rounded-xl border border-[#1B4332]/10 mb-4 flex items-center gap-3">
              <img
                src={
                  listingToDelete.photos?.[0] ||
                  listingToDelete.images?.[0] ||
                  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&auto=format&fit=crop&q=80'
                }
                alt={listingToDelete.title}
                className="w-12 h-12 rounded-lg object-cover border border-[#1B4332]/10 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-[#14231C] truncate">{listingToDelete.title}</h4>
                <p className="text-[11px] text-[#2D6A4F] mt-0.5">
                  {listingToDelete.cityArea}, {listingToDelete.state}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#6B756F] leading-relaxed mb-5">
              Are you sure you want to delist <strong>{listingToDelete.title}</strong>? The listing record will be updated with status <strong>'delisted'</strong> in Supabase and hidden from guest discovery.
            </p>

            {delistError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {delistError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={(e) => {
                  e.preventDefault();
                  setListingToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B756F] hover:bg-[#1B4332]/5 hover:text-[#14231C] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={(e) => handleConfirmDelete(e)}
                id="confirm-delist-btn"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Delisting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Delist</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Details Modal (No Approve & Add Evidence) */}
      {selectedDetailsListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14231C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-[#1B4332]/10 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#1B4332]/10 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F]">
                    Property Specification • ID: {selectedDetailsListing.id}
                  </span>
                  {selectedDetailsListing.verification_status === 'verified' ||
                  selectedDetailsListing.status === 'approved' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white">
                      Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-bold">
                      Pending Verification
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-[#14231C]">
                  {selectedDetailsListing.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailsListing(null)}
                className="p-1 rounded-lg text-[#6B756F] hover:text-[#14231C] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Photos Strip */}
            {selectedDetailsListing.photos && selectedDetailsListing.photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedDetailsListing.photos.map((p, i) => (
                  <img
                    key={i}
                    src={p}
                    alt={`Photo ${i + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-28 object-cover rounded-xl border border-[#1B4332]/10"
                  />
                ))}
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#FBF6EC] p-3.5 rounded-xl space-y-1.5 border border-[#1B4332]/10">
                <span className="font-bold text-[#1B4332] block">Location & Pricing</span>
                <div>State: <strong>{selectedDetailsListing.state}</strong></div>
                <div>Area: <strong>{selectedDetailsListing.cityArea}</strong></div>
                <div>Address: <strong>{selectedDetailsListing.streetAddress}</strong></div>
                <div>
                  Rate:{' '}
                  <strong className="font-mono text-[#1B4332]">
                    ₦{selectedDetailsListing.pricePerDay.toLocaleString()} / night
                  </strong>
                </div>
              </div>

              <div className="bg-[#FBF6EC] p-3.5 rounded-xl space-y-1.5 border border-[#1B4332]/10">
                <span className="font-bold text-[#1B4332] block">Host & Settlement NUBAN</span>
                <div>Host: <strong>{selectedDetailsListing.hostFullName || 'Host Partner'}</strong></div>
                <div>WhatsApp: <strong className="font-mono">{selectedDetailsListing.hostWhatsApp}</strong></div>
                <div>Bank: <strong>{selectedDetailsListing.hostBankDetails?.bankName || 'GTBank'}</strong></div>
                <div>
                  Account:{' '}
                  <strong className="font-mono text-[#1B4332]">
                    {selectedDetailsListing.hostBankDetails?.accountNumber || '0123456789'}
                  </strong>
                </div>
                {selectedDetailsListing.hostBankDetails?.accountName && (
                  <div>Name: <strong className="text-[#14231C] uppercase text-[11px]">{selectedDetailsListing.hostBankDetails.accountName}</strong></div>
                )}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <span className="text-xs font-bold text-[#14231C] block mb-1.5">Amenities:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedDetailsListing.amenities.map((am, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FBF6EC] border border-[#1B4332]/10 text-[#14231C]"
                  >
                    {am}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-xs font-bold text-[#14231C] block mb-1">Description:</span>
              <p className="text-xs text-[#6B756F] leading-relaxed bg-[#FBF6EC] p-3 rounded-xl border border-[#1B4332]/10">
                {selectedDetailsListing.description}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#1B4332]/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePromptDelete(selectedDetailsListing, e);
                  }}
                  id={`delist-modal-btn-${selectedDetailsListing.id}`}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-700 hover:text-white border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delist Property</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDetailsListing(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1B4332] text-white hover:bg-[#2D6A4F] transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
