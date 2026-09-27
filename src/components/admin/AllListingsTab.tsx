import React, { useState, useRef } from 'react';
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
  ExternalLink,
  UploadCloud,
  Video,
  X,
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
  onDeleteListing,
  onUpdateListingStatus,
}) => {
  const { refreshListings } = useApp();
  const [selectedState, setSelectedState] = useState<string>('all');
  const [citySearch, setCitySearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDetailsListing, setSelectedDetailsListing] = useState<PropertyListing | null>(null);
  
  // Delist state (Prompt Requirement #3)
  const [listingToDelete, setListingToDelete] = useState<PropertyListing | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [delistError, setDelistError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Evidence / Verification Modal State (Prompt Requirement #1 & #2)
  const [verifyingListing, setVerifyingListing] = useState<PropertyListing | null>(null);
  const [verificationNotesInput, setVerificationNotesInput] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; size: string; type: string; previewUrl: string }[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      } else if (statusFilter === 'delisted') {
        if (item.status !== 'delisted') return false;
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

  // Delisting Handler (Prompt Requirement #3)
  const handleConfirmDelete = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!listingToDelete) return;
    const listingId = listingToDelete.id;
    setIsProcessing(true);
    setDelistError(null);

    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'delisted',
          // or is_active: false
        })
        .eq('id', listingId);

      if (error) throw error;

      // Automatically refresh the local listings state after a successful delist action so the UI updates immediately
      await refreshListings();

      setSuccessToast(`Successfully delisted "${listingToDelete.title}". Property status is now 'delisted'.`);
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

  // Open Verification & Evidence Modal
  const handleOpenVerifyModal = (listing: PropertyListing, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setVerifyingListing(listing);
    setVerificationNotesInput(
      listing.verification_notes ||
      listing.verificationNotes ||
      `Physical on-site audit completed by Ileya Afrika operations team. Verified 24/7 power backup, inspected running water and plumbing, and validated security.`
    );
    setSelectedFiles([]);
    setFilePreviews([]);
    setUploadError(null);
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    if (newFiles.length === 0) return;

    const combined = [...selectedFiles, ...newFiles];
    setSelectedFiles(combined);

    const previews = combined.map((f) => {
      const isVideo = f.type.startsWith('video');
      const sizeKB = (f.size / 1024).toFixed(1);
      const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
      const formattedSize = f.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
      return {
        name: f.name,
        size: formattedSize,
        type: isVideo ? 'video' : 'image',
        previewUrl: URL.createObjectURL(f),
      };
    });
    setFilePreviews(previews);
  };

  const handleRemoveSelectedFile = (index: number, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    const updatedPreviews = filePreviews.filter((_, i) => i !== index);
    setFilePreviews(updatedPreviews);
  };

  // Evidence Upload & Approve Logic (Prompt Requirement #1 & #2)
  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingListing) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgressText('Starting verification processing...');

    try {
      const listingId = verifyingListing.id;
      let uploadedUrls: string[] = [];

      // Loop through attached files and upload to 'verifications' bucket
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileExt = file.name.split('.').pop() || (file.type.startsWith('video') ? 'mp4' : 'jpg');
          const cleanFileName = `evidence_${listingId}_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
          const filePath = `${listingId}/${cleanFileName}`;

          setUploadProgressText(`Uploading file ${i + 1} of ${selectedFiles.length} (${file.name})...`);

          const { error: uploadError } = await supabase.storage
            .from('verifications')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true,
            });

          if (uploadError) {
            console.error(`Upload error for ${file.name}:`, uploadError);
            throw new Error(`Failed to upload ${file.name} to 'verifications' bucket: ${uploadError.message}`);
          }

          // Generate public URL via supabase.storage.from('verifications').getPublicUrl(path).data.publicUrl
          const { data: publicUrlData } = supabase.storage
            .from('verifications')
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }

      setUploadProgressText('Updating listing verification status in Supabase...');

      const existingUrls = verifyingListing.verification_evidence_urls || verifyingListing.verificationEvidenceUrls || [];
      const notes = verificationNotesInput.trim() || 'Physical inspection confirmed on-site by Ileya Afrika operations team.';

      // Database Update
      const { data, error } = await supabase
        .from('listings')
        .update({
          verification_status: 'verified',
          verification_notes: notes || null,
          verification_evidence_urls: uploadedUrls.length > 0 ? uploadedUrls : existingUrls,
          status: 'approved' // or is_active: true depending on schema
        })
        .eq('id', listingId)
        .select();

      if (error) throw error;

      // Check that data actually returned an updated row. If data is empty, notify the admin that permissions blocked the update.
      if (!data || data.length === 0) {
        const permError = 'Permissions blocked the update or listing was not found. Please verify your Supabase Row Level Security (RLS) policies for admin accounts.';
        alert(permError);
        throw new Error(permError);
      }

      // Automatically refresh the local listings state after a successful approve action so the UI updates immediately
      await refreshListings();

      setSuccessToast(`Successfully verified "${verifyingListing.title}". Status updated to approved and evidence persisted!`);
      setTimeout(() => setSuccessToast(null), 5000);

      setVerifyingListing(null);
      setSelectedFiles([]);
      setFilePreviews([]);
    } catch (err: any) {
      console.error('Verification submission failed:', err);
      const errMsg = err?.message || 'Verification upload / update failed. Please try again.';
      setUploadError(errMsg);
      alert(`Approval & Evidence Upload Error: ${errMsg}`);
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
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
              Filter, oversee verification status, and manage booking availability across Nigeria.
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
                <option value="delisted">Delisted</option>
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
                      ) : listing.status === 'delisted' ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-stone-700 text-white flex items-center gap-1 shadow-sm">
                          <XCircle className="w-3 h-3" />
                          <span>Delisted</span>
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

                    {/* Booking Availability Info */}
                    <div className="p-3 bg-[#FBF6EC] rounded-xl border border-[#1B4332]/10 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B756F] block">
                          Availability Model
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
                          <span className="text-xs font-bold text-[#2D6A4F]">
                            Calendar-Managed
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-[#1B4332] bg-white px-2.5 py-1 rounded-lg border border-[#1B4332]/10 shadow-2xs">
                        Date-based
                      </span>
                    </div>

                    {/* Host quick summary */}
                    <div className="text-[11px] text-[#6B756F] flex items-center justify-between border-t border-[#1B4332]/10 pt-2">
                      <span>Host: <strong className="text-[#14231C]">{listing.hostFullName || 'Adewale'}</strong></span>
                      <span className="font-mono text-[#1B4332]">{listing.hostWhatsApp}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons (Prompt Requirement #1, #2, #3) */}
                <div className="p-4 pt-0 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedDetailsListing(listing);
                    }}
                    id={`view-admin-details-${listing.id}`}
                    className="flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs font-bold bg-[#FBF6EC] hover:bg-[#1B4332]/10 text-[#1B4332] transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-[#1B4332]/10"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleOpenVerifyModal(listing, e)}
                    id={`verify-btn-all-${listing.id}`}
                    title="Approve & Add Verification Evidence"
                    className="py-2 px-3 rounded-xl text-xs font-bold text-[#1B4332] bg-[#E8A33D]/20 hover:bg-[#E8A33D]/30 border border-[#E8A33D]/40 transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1B4332]" />
                    <span>Approve & Evidence</span>
                  </button>

                  {listing.status !== 'delisted' ? (
                    <button
                      type="button"
                      onClick={(e) => handlePromptDelete(listing, e)}
                      id={`delist-btn-${listing.id}`}
                      title="Delist Property"
                      className="py-2 px-3 rounded-xl text-xs font-semibold text-amber-800 hover:text-white hover:bg-amber-700 bg-amber-50 border border-amber-200 transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-current" />
                      <span>Delist</span>
                    </button>
                  ) : (
                    <span className="py-2 px-2.5 rounded-xl text-[11px] font-semibold text-stone-500 bg-stone-100 border border-stone-200">
                      Delisted
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delist Confirmation Modal (Prompt Requirement #3) */}
      {listingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14231C]/65 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#14231C] font-serif">Delist Property?</h3>
                <p className="text-xs text-[#6B756F]">Update property status to 'delisted' in Supabase</p>
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
              Are you sure you want to delist <strong>{listingToDelete.title}</strong>? The listing record will be updated with status 'delisted' in Supabase and hidden from public search.
            </p>

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
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
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
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#1B4332]/10">
              <div className="flex items-center gap-2">
                {selectedDetailsListing.status !== 'delisted' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePromptDelete(selectedDetailsListing, e);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delist Property</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleOpenVerifyModal(selectedDetailsListing, e);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#1B4332] bg-[#E8A33D]/20 hover:bg-[#E8A33D]/30 border border-[#E8A33D]/40 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1B4332]" />
                  <span>Approve & Add Evidence</span>
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

      {/* Verification Evidence Upload Modal (All Listings Tab) */}
      {verifyingListing && (
        <div
          id="all-listings-verification-modal"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#1B4332]/15 overflow-hidden flex flex-col my-auto max-h-[92vh]">
            <div className="px-6 py-4.5 border-b border-[#1B4332]/10 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B4332] text-[#E8A33D] flex items-center justify-center shrink-0 border border-[#E8A33D]/30 shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-[#E8A33D]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-serif text-[#1B4332]">
                    Property Verification & Evidence Upload
                  </h3>
                  <p className="text-xs text-[#6B756F] truncate max-w-md">
                    {verifyingListing.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (!isUploading) {
                    setVerifyingListing(null);
                    setSelectedFiles([]);
                    setFilePreviews([]);
                  }
                }}
                disabled={isUploading}
                className="w-9 h-9 rounded-full bg-[#FBF6EC] hover:bg-[#1B4332]/10 text-[#14231C] flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmVerification} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-[#FBF6EC] rounded-2xl p-4 border border-[#1B4332]/10 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1B4332]">{verifyingListing.title}</span>
                  <span className="font-mono text-[#6B756F]">ID: {verifyingListing.id}</span>
                </div>
                <p className="text-[#6B756F]">
                  {verifyingListing.streetAddress}, {verifyingListing.cityArea}, {verifyingListing.state}
                </p>
              </div>

              {uploadError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{uploadError}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#14231C] flex items-center justify-between">
                  <span>Verification Notes</span>
                  <span className="text-[11px] font-normal text-[#6B756F]">On-site inspector notes</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={verificationNotesInput}
                  onChange={(e) => setVerificationNotesInput(e.target.value)}
                  placeholder="e.g. On-site physical audit completed. 24/7 generator backup verified. Clean water pressure confirmed."
                  className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#14231C] flex items-center justify-between">
                  <span>Select Verification Photos / Videos</span>
                  <span className="text-[11px] font-normal text-[#2D6A4F]">Bucket: 'verifications'</span>
                </label>

                <div
                  onClick={(e) => {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }}
                  className="border-2 border-dashed border-[#1B4332]/25 hover:border-[#1B4332] bg-[#FBF6EC]/50 hover:bg-[#FBF6EC] rounded-2xl p-6 text-center cursor-pointer transition-colors group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFilesSelected}
                    className="hidden"
                    id="all-listings-verification-file-input"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-6 h-6 text-[#1B4332]" />
                  </div>
                  <p className="text-xs font-bold text-[#14231C]">
                    Click to select multiple inspection files
                  </p>
                  <p className="text-[11px] text-[#6B756F] mt-1">
                    Upload inspection photos or videos (<input type="file" multiple />)
                  </p>
                </div>
              </div>

              {filePreviews.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#6B756F]">
                    <span className="font-bold text-[#14231C]">
                      Selected Files ({filePreviews.length}):
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedFiles([]);
                        setFilePreviews([]);
                      }}
                      className="text-red-600 hover:underline cursor-pointer text-[11px]"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto p-1">
                    {filePreviews.map((item, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl border border-[#1B4332]/15 bg-[#FBF6EC] overflow-hidden p-2 flex flex-col group"
                      >
                        <div className="relative aspect-4/3 w-full rounded-lg overflow-hidden bg-black/5 mb-1.5">
                          {item.type === 'video' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 text-white">
                              <Video className="w-6 h-6 text-[#E8A33D] mb-1" />
                              <span className="text-[10px] font-mono">Video file</span>
                            </div>
                          ) : (
                            <img
                              src={item.previewUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleRemoveSelectedFile(idx, e)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer shadow-xs hover:bg-red-700 transition-colors"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[10px] truncate font-medium text-[#14231C]">
                          {item.name}
                        </div>
                        <div className="text-[9px] text-[#6B756F]">
                          {item.size}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="p-4 rounded-2xl bg-[#FBF6EC] border border-[#1B4332]/20 flex items-center gap-3 text-xs text-[#1B4332]">
                  <Loader2 className="w-5 h-5 animate-spin text-[#E8A33D] shrink-0" />
                  <div className="space-y-0.5 flex-1">
                    <p className="font-bold">Uploading & Approving Property...</p>
                    <p className="text-[11px] text-[#6B756F]">{uploadProgressText}</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#1B4332]/10 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={(e) => {
                    e.preventDefault();
                    setVerifyingListing(null);
                    setSelectedFiles([]);
                    setFilePreviews([]);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-[#6B756F] hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUploading}
                  id="all-listings-submit-verification-btn"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-[#1B4332] hover:bg-[#143427] text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 border border-[#E8A33D]/40"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#E8A33D]" />
                      <span>Processing Approval & Upload...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-[#E8A33D]" />
                      <span>
                        Approve & Add Evidence {selectedFiles.length > 0 ? `(${selectedFiles.length} files)` : ''}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
