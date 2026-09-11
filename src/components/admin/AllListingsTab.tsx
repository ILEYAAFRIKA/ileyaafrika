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
  Phone,
  CreditCard,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { PropertyListing, ListingStatus } from '../../types';
import { NIGERIAN_STATES } from '../../data/nigerianData';

interface AllListingsTabProps {
  listings: PropertyListing[];
  onToggleBookingStatus: (id: string) => void;
  onDeleteListing: (id: string) => void;
  onUpdateListingStatus: (id: string, status: ListingStatus) => void;
}

export const AllListingsTab: React.FC<AllListingsTabProps> = ({
  listings,
  onToggleBookingStatus,
  onDeleteListing,
  onUpdateListingStatus,
}) => {
  const [selectedState, setSelectedState] = useState<string>('all');
  const [citySearch, setCitySearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDetailsListing, setSelectedDetailsListing] = useState<PropertyListing | null>(null);
  const [listingToDelete, setListingToDelete] = useState<PropertyListing | null>(null);

  // Filter listings by State, City Area, and Status
  const filteredListings = listings.filter((item) => {
    // State filter
    if (selectedState !== 'all' && item.state.toLowerCase() !== selectedState.toLowerCase()) {
      return false;
    }
    // City / Area text filter
    if (citySearch.trim()) {
      const search = citySearch.toLowerCase();
      const matchCity = item.cityArea.toLowerCase().includes(search);
      const matchStreet = item.streetAddress.toLowerCase().includes(search);
      const matchTitle = item.title.toLowerCase().includes(search);
      if (!matchCity && !matchStreet && !matchTitle) return false;
    }
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'approved_live' || statusFilter === 'approved') {
        if (item.status !== 'approved_live' && item.status !== 'approved') return false;
      } else if (statusFilter === 'pending_verification' || statusFilter === 'pending') {
        if (item.status !== 'pending_verification' && item.status !== 'pending') return false;
      } else if (item.status !== statusFilter) {
        return false;
      }
    }
    return true;
  });

  const handlePromptDelete = (listing: PropertyListing, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setListingToDelete(listing);
  };

  const handleConfirmDelete = () => {
    if (!listingToDelete) return;
    const id = listingToDelete.id;
    onDeleteListing(id);
    if (selectedDetailsListing?.id === id) {
      setSelectedDetailsListing(null);
    }
    setListingToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Geographical Filters */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#1B4332]/10 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1B4332]">
              National Property Directory
            </h2>
            <p className="text-xs text-[#6B756F] mt-0.5">
              Filter, oversee verification status, and toggle real-time booking availability across Nigeria.
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#1B4332]/10">
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
                <option value="all">All States ({listings.length})</option>
                {NIGERIAN_STATES.map((st) => {
                  const count = listings.filter((l) => l.state.toLowerCase() === st.toLowerCase()).length;
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
      {listings.length === 0 ? (
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
            Try adjusting your state selection, search keywords, or status filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedState('all');
              setCitySearch('');
              setStatusFilter('all');
            }}
            className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1B4332] bg-[#FBF6EC] hover:bg-[#1B4332]/10 transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => {
            const isBooked = !!listing.isBooked;

            return (
              <div
                key={listing.id}
                className="bg-white rounded-2xl border border-[#1B4332]/15 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
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

                    {/* Verification Status Badge */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      {listing.status === 'approved_live' || listing.status === 'approved' ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#2D6A4F] text-white flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Live & Verified</span>
                        </span>
                      ) : listing.status === 'pending_verification' || listing.status === 'pending' ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#E8A33D] text-[#14231C] flex items-center gap-1 shadow-sm">
                          <Clock className="w-3 h-3" />
                          <span>Pending Inspection</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-600 text-white flex items-center gap-1 shadow-sm">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
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

                    {/* Booking Status Interactive Toggle Switch */}
                    <div className="p-3 bg-[#FBF6EC] rounded-xl border border-[#1B4332]/10 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B756F] block">
                          Booking Status
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isBooked ? 'bg-[#E8A33D]' : 'bg-[#2D6A4F]'
                            }`}
                          />
                          <span
                            className={`text-xs font-bold ${
                              isBooked ? 'text-[#E8A33D]' : 'text-[#2D6A4F]'
                            }`}
                          >
                            {isBooked ? 'Booked' : 'Available'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleBookingStatus(listing.id)}
                        id={`toggle-booking-${listing.id}`}
                        title={`Click to mark as ${isBooked ? 'Available' : 'Booked'}`}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isBooked
                            ? 'bg-[#E8A33D] text-[#14231C] hover:bg-[#d99530]'
                            : 'bg-[#2D6A4F] text-white hover:bg-[#1B4332]'
                        }`}
                      >
                        {isBooked ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            <span>Set Available</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            <span>Set Booked</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Host quick summary */}
                    <div className="text-[11px] text-[#6B756F] flex items-center justify-between border-t border-[#1B4332]/10 pt-2">
                      <span>Host: <strong className="text-[#14231C]">{listing.hostFullName || 'Adewale'}</strong></span>
                      <span className="font-mono text-[#1B4332]">{listing.hostWhatsApp}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 pt-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDetailsListing(listing)}
                    id={`view-admin-details-${listing.id}`}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-[#FBF6EC] hover:bg-[#1B4332]/10 text-[#1B4332] transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-[#1B4332]/10"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Full Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handlePromptDelete(listing, e)}
                    id={`delist-btn-${listing.id}`}
                    title="Delist / Delete Property"
                    className="py-2 px-3 rounded-xl text-xs font-semibold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#14231C] font-serif">Delist Property?</h3>
                <p className="text-xs text-[#6B756F]">Permanently remove from national directory</p>
              </div>
            </div>

            <div className="bg-[#FBF6EC] p-3 rounded-xl border border-[#1B4332]/10 mb-4 flex items-center gap-3">
              <img
                src={listingToDelete.photos?.[0] || listingToDelete.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&auto=format&fit=crop&q=80'}
                alt={listingToDelete.title}
                className="w-12 h-12 rounded-lg object-cover border border-[#1B4332]/10 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-[#14231C] truncate">{listingToDelete.title}</h4>
                <p className="text-[11px] text-[#2D6A4F] mt-0.5">{listingToDelete.cityArea}, {listingToDelete.state}</p>
              </div>
            </div>

            <p className="text-xs text-[#6B756F] leading-relaxed mb-5">
              Are you sure you want to permanently delete <strong>{listingToDelete.title}</strong> from the Ileya platform? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setListingToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B756F] hover:bg-[#1B4332]/5 hover:text-[#14231C] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                id="confirm-delist-btn"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delist</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Details Modal */}
      {selectedDetailsListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14231C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-[#1B4332]/10 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#1B4332]/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F]">
                  Property Specification • ID: {selectedDetailsListing.id}
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-[#14231C] mt-0.5">
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
                <div>Rate: <strong className="font-mono text-[#1B4332]">₦{selectedDetailsListing.pricePerDay.toLocaleString()} / night</strong></div>
              </div>

              <div className="bg-[#FBF6EC] p-3.5 rounded-xl space-y-1.5 border border-[#1B4332]/10">
                <span className="font-bold text-[#1B4332] block">Host & Settlement NUBAN</span>
                <div>Host: <strong>{selectedDetailsListing.hostFullName || 'Adewale'}</strong></div>
                <div>WhatsApp: <strong className="font-mono">{selectedDetailsListing.hostWhatsApp}</strong></div>
                <div>Bank: <strong>{selectedDetailsListing.hostBankDetails?.bankName || 'GTBank'}</strong></div>
                <div>Account: <strong className="font-mono text-[#1B4332]">{selectedDetailsListing.hostBankDetails?.accountNumber || '0123456789'}</strong></div>
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
            <div className="flex items-center justify-between pt-3 border-t border-[#1B4332]/10">
              <button
                type="button"
                onClick={() => handlePromptDelete(selectedDetailsListing)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Listing</span>
              </button>

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
