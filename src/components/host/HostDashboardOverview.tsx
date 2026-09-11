import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  PlusCircle,
  MapPin,
  ShieldCheck,
  Phone,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Trash2,
  AlertTriangle,
  Landmark,
  CreditCard,
  Edit3,
  Check,
  Loader2,
  Sparkles
} from 'lucide-react';
import { PropertyListing, ListingStatus, UserSession, BankPayoutDetails } from '../../types';
import { supabase } from '../../lib/supabase';
import { getUserFromSupabase, savePayoutDetailsToSupabase, getPayoutDetailsFromSupabase } from '../../lib/supabaseService';
import { NIGERIAN_BANKS, INITIAL_BANK_SETTINGS } from '../../data/nigerianData';

interface HostDashboardOverviewProps {
  session?: UserSession | null;
  listings: PropertyListing[];
  bankDetails?: BankPayoutDetails;
  onCreateListing: () => void;
  onNavigateToPayout: () => void;
  onDeleteListing: (id: string) => void;
  onDeleteAccount: () => void;
  onSaveBankDetails?: (details: BankPayoutDetails) => void;
}

export const HostDashboardOverview: React.FC<HostDashboardOverviewProps> = ({
  session,
  listings,
  bankDetails: initialBankDetails,
  onCreateListing,
  onNavigateToPayout,
  onDeleteListing,
  onDeleteAccount,
  onSaveBankDetails,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | ListingStatus>('all');
  const [selectedListing, setSelectedListing] = useState<PropertyListing | null>(null);
  const [listingToDelete, setListingToDelete] = useState<PropertyListing | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Host Display Name state fetched from Supabase / Session
  const [hostDisplayName, setHostDisplayName] = useState<string>(
    session?.fullName || 'Valued Host'
  );

  // Live Bank Details state
  const [activeBankDetails, setActiveBankDetails] = useState<BankPayoutDetails>(
    initialBankDetails || INITIAL_BANK_SETTINGS
  );
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [editBankName, setEditBankName] = useState(activeBankDetails.bankName);
  const [editAccountNumber, setEditAccountNumber] = useState(activeBankDetails.accountNumber);
  const [editAccountName, setEditAccountName] = useState(activeBankDetails.accountName);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankSaveSuccess, setBankSaveSuccess] = useState(false);
  const [bankErrorMsg, setBankErrorMsg] = useState<string | null>(null);

  // Fetch host's actual name and payout details directly from Supabase on mount/session change
  useEffect(() => {
    if (session?.fullName) {
      setHostDisplayName(session.fullName);
    }

    const fetchHostData = async () => {
      try {
        // 1. Get current auth user
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        
        if (user) {
          const metaName = user.user_metadata?.fullName || user.user_metadata?.full_name;
          if (metaName) {
            setHostDisplayName(metaName);
          }

          // 2. Query 'users' database table
          const identifier = user.id || user.email || session?.email || '';
          if (identifier) {
            const dbUser = await getUserFromSupabase(identifier);
            if (dbUser?.fullName) {
              setHostDisplayName(dbUser.fullName);
            }
          }

          // 3. Fetch latest bank payout details from Supabase
          const email = user.email || session?.email;
          if (email) {
            const dbBank = await getPayoutDetailsFromSupabase(email);
            if (dbBank) {
              setActiveBankDetails(dbBank);
              setEditBankName(dbBank.bankName);
              setEditAccountNumber(dbBank.accountNumber);
              setEditAccountName(dbBank.accountName);
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching host session details from Supabase:', err);
      }
    };

    fetchHostData();
  }, [session]);

  // Sync when initialBankDetails changes
  useEffect(() => {
    if (initialBankDetails) {
      setActiveBankDetails(initialBankDetails);
      setEditBankName(initialBankDetails.bankName);
      setEditAccountNumber(initialBankDetails.accountNumber);
      setEditAccountName(initialBankDetails.accountName);
    }
  }, [initialBankDetails]);

  // Save bank details to Supabase and update state
  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankErrorMsg(null);

    if (!editBankName) {
      setBankErrorMsg('Please select a Nigerian bank.');
      return;
    }
    if (editAccountNumber.length !== 10) {
      setBankErrorMsg('Nigerian NUBAN account number must be exactly 10 digits.');
      return;
    }
    if (!editAccountName.trim()) {
      setBankErrorMsg('Please provide the account holder name.');
      return;
    }

    setIsSavingBank(true);
    const updated: BankPayoutDetails = {
      bankName: editBankName,
      accountNumber: editAccountNumber,
      accountName: editAccountName.trim().toUpperCase(),
      isVerified: true,
    };

    try {
      const email = session?.email;
      await savePayoutDetailsToSupabase(updated, email);
      setActiveBankDetails(updated);
      if (onSaveBankDetails) {
        onSaveBankDetails(updated);
      }
      setBankSaveSuccess(true);
      setTimeout(() => {
        setBankSaveSuccess(false);
        setShowEditBankModal(false);
      }, 1200);
    } catch (err: any) {
      setBankErrorMsg(err?.message || 'Failed to save bank details to database.');
    } finally {
      setIsSavingBank(false);
    }
  };

  // Trigger 'Delete Listing' Confirmation Modal
  const handlePromptDeleteListing = (listing: PropertyListing, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setListingToDelete(listing);
  };

  const handleConfirmDelete = () => {
    if (!listingToDelete) return;
    setIsDeleting(true);
    try {
      const idToDelete = listingToDelete.id;
      onDeleteListing(idToDelete);
      if (selectedListing?.id === idToDelete) {
        setSelectedListing(null);
      }
      setListingToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Trigger 'Delete Account' (Danger Zone)
  const handlePromptDeleteAccount = () => {
    setShowDeleteAccountModal(true);
  };

  const handleConfirmDeleteAccount = () => {
    setShowDeleteAccountModal(false);
    onDeleteAccount();
  };

  // Metrics calculation
  const totalListings = listings.length;
  const activeListings = listings.filter((l) => l.status === 'approved_live' || l.status === 'approved').length;
  const pendingListings = listings.filter((l) => l.status === 'pending_verification' || l.status === 'pending').length;
  const rejectedListings = listings.filter((l) => l.status === 'rejected').length;

  const filteredListings = listings.filter((listing) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'approved_live' || filterStatus === 'approved') {
      return listing.status === 'approved_live' || listing.status === 'approved';
    }
    if (filterStatus === 'pending_verification' || filterStatus === 'pending') {
      return listing.status === 'pending_verification' || listing.status === 'pending';
    }
    if (filterStatus === 'rejected') {
      return listing.status === 'rejected';
    }
    return listing.status === filterStatus;
  });

  return (
    <div className="space-y-8">
      {/* Welcome Banner Greeting Host by Name */}
      <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-sm mb-3">
            <ShieldCheck className="w-4 h-4 text-[#E8A33D]" />
            <span>Verified Host Partner • 100% Physical Inspection</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-white">
            Welcome back, {hostDisplayName}!
          </h2>
          
          <p className="mt-2 text-white/80 text-sm leading-relaxed">
            Manage your verified apartments, track physical inspection schedules, and ensure your NUBAN settlement details are synchronized for automatic guest booking disbursements.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onCreateListing}
              id="dashboard-hero-cta"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#E8A33D] hover:bg-[#d99530] text-[#14231C] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Create New Listing</span>
            </button>
            <button
              onClick={() => setShowEditBankModal(true)}
              id="host-edit-payment-btn"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Landmark className="w-3.5 h-3.5 text-[#E8A33D]" />
              <span>Edit Payment Details</span>
            </button>
            <button
              onClick={onNavigateToPayout}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Full Payout Settings</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-72 h-72 rounded-full bg-white/5 pointer-events-none blur-2xl" />
      </div>

      {/* Host Bank & Payout Details Sync Section */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#1B4332]/10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B4332]/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center">
              <Landmark className="w-5 h-5 text-[#2D6A4F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#14231C] font-serif">Host Payment & Settlement Details</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2D6A4F]/10 text-[#2D6A4F]">
                  <CheckCircle2 className="w-3 h-3" />
                  Synced to Supabase
                </span>
              </div>
              <p className="text-xs text-[#6B756F]">
                Changes saved here reflect in real-time on the Master Admin dashboard for automated payout processing.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEditBankModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#1B4332] bg-[#1B4332]/5 hover:bg-[#1B4332]/10 border border-[#1B4332]/15 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>Update Bank Account</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-1">
          <div className="p-3.5 rounded-xl bg-[#FBF6EC] border border-[#1B4332]/10">
            <span className="text-[11px] font-bold text-[#6B756F] uppercase tracking-wider block">Bank Name</span>
            <p className="text-sm font-bold text-[#14231C] mt-0.5">{activeBankDetails.bankName || 'Not Set'}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FBF6EC] border border-[#1B4332]/10">
            <span className="text-[11px] font-bold text-[#6B756F] uppercase tracking-wider block">NUBAN Account Number</span>
            <p className="text-sm font-mono font-bold text-[#14231C] mt-0.5 tracking-wider">{activeBankDetails.accountNumber || '0000000000'}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FBF6EC] border border-[#1B4332]/10">
            <span className="text-[11px] font-bold text-[#6B756F] uppercase tracking-wider block">Verified Account Name</span>
            <p className="text-sm font-bold text-[#14231C] mt-0.5 truncate">{activeBankDetails.accountName || 'ADEWALE BABATUNDE O.'}</p>
          </div>
        </div>
      </div>

      {/* Edit Bank Details Modal */}
      {showEditBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14231C]/65 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#1B4332]/10">
            <div className="flex items-center justify-between border-b border-[#1B4332]/10 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E8A33D]/20 text-[#1B4332] flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#E8A33D]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-[#1B4332]">Edit Bank Payout Details</h3>
                  <p className="text-xs text-[#6B756F]">Syncs directly to Supabase & Master Admin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditBankModal(false)}
                className="text-[#6B756F] hover:text-[#14231C] text-sm font-bold p-1 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {bankSaveSuccess && (
              <div className="mb-4 p-3.5 rounded-xl bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 text-[#1B4332] text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
                <span>Bank details saved & synced to Supabase successfully!</span>
              </div>
            )}

            {bankErrorMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{bankErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveBankDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#14231C] mb-1">
                  Nigerian Bank Name <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={editBankName}
                  onChange={(e) => setEditBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                >
                  <option value="">Select your bank...</option>
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14231C] mb-1">
                  Account Number (10 Digits NUBAN) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  required
                  value={editAccountNumber}
                  onChange={(e) => setEditAccountNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  placeholder="0123456789"
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-bold tracking-wider bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14231C] mb-1">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editAccountName}
                  onChange={(e) => setEditAccountName(e.target.value)}
                  placeholder="e.g. ADEWALE BABATUNDE O."
                  className="w-full px-3.5 py-2.5 text-sm font-bold uppercase bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
                <p className="text-[11px] text-[#6B756F] mt-1">Must match your official bank registration.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1B4332]/10 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditBankModal(false)}
                  disabled={isSavingBank}
                  className="px-4 py-2.5 text-xs font-bold text-[#6B756F] hover:text-[#14231C] hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBank}
                  className="px-6 py-2.5 text-xs font-bold text-[#14231C] bg-[#E8A33D] hover:bg-[#d99530] rounded-xl transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSavingBank ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Sync Bank Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Listings Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#1B4332]/10 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B756F]">
              Total Properties
            </p>
            <h3 className="text-3xl font-bold text-[#14231C] mt-2 font-serif">
              {totalListings}
            </h3>
            <p className="text-xs text-[#6B756F] mt-1">
              Registered in your host portfolio
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#1B4332]/5 flex items-center justify-center text-[#1B4332]">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Active & Live Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#2D6A4F]/20 shadow-sm flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2D6A4F]">
                Active (Live)
              </p>
            </div>
            <h3 className="text-3xl font-bold text-[#14231C] mt-2 font-serif">
              {activeListings}
            </h3>
            <p className="text-xs text-[#6B756F] mt-1">
              Physically verified & bookable
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center text-[#2D6A4F]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Physical Verification Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8A33D]/30 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#E8A33D]">
              Pending Verification
            </p>
            <h3 className="text-3xl font-bold text-[#14231C] mt-2 font-serif">
              {pendingListings}
            </h3>
            <p className="text-xs text-[#6B756F] mt-1">
              Inspection team scheduling visit
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E8A33D]/15 flex items-center justify-center text-[#E8A33D]">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Listings Section */}
      <div className="bg-white rounded-2xl border border-[#1B4332]/10 shadow-sm overflow-hidden">
        {/* Section Header with Filter Controls */}
        <div className="p-6 border-b border-[#1B4332]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-[#1B4332] font-serif">
              My Property Listings
            </h3>
            <p className="text-xs text-[#6B756F] mt-0.5">
              Manage your apartment listings and track physical inspection status.
            </p>
          </div>

          {listings.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#6B756F] flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
              </span>
              <div className="inline-flex p-1 bg-[#FBF6EC] rounded-xl border border-[#1B4332]/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterStatus === 'all'
                      ? 'bg-[#1B4332] text-white shadow-sm'
                      : 'text-[#14231C] hover:text-[#1B4332]'
                  }`}
                >
                  All ({totalListings})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('approved_live')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterStatus === 'approved_live'
                      ? 'bg-[#2D6A4F] text-white shadow-sm'
                      : 'text-[#14231C] hover:text-[#2D6A4F]'
                  }`}
                >
                  Live ({activeListings})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('pending_verification')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterStatus === 'pending_verification'
                      ? 'bg-[#E8A33D] text-[#14231C] shadow-sm'
                      : 'text-[#14231C] hover:text-[#E8A33D]'
                  }`}
                >
                  Pending ({pendingListings})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Listings Display: Clean Empty State vs Listings Grid */}
        {listings.length === 0 ? (
          <div className="p-12 sm:p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1B4332]/5 text-[#1B4332] flex items-center justify-center mx-auto mb-4 border border-[#1B4332]/10">
              <Building2 className="w-8 h-8 text-[#2D6A4F]" />
            </div>
            <h4 className="text-xl font-bold text-[#14231C] font-serif">
              You haven&apos;t listed any properties yet
            </h4>
            <p className="text-xs text-[#6B756F] max-w-md mx-auto mt-2 leading-relaxed">
              Add your first verified apartment in Lagos, Abuja, or across Nigeria. Once submitted, our on-ground team will schedule a physical inspection before it goes live.
            </p>
            <div className="mt-6">
              <button
                onClick={onCreateListing}
                id="empty-state-create-btn"
                className="px-6 py-3 rounded-xl text-xs font-bold bg-[#E8A33D] hover:bg-[#d99530] text-[#14231C] transition-all inline-flex items-center gap-2 cursor-pointer shadow-md shadow-[#E8A33D]/25"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Create New Listing</span>
              </button>
            </div>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-10 h-10 text-[#6B756F]/40 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[#14231C]">No listings matching this filter</h4>
            <p className="text-xs text-[#6B756F] max-w-sm mx-auto mt-1">
              You do not have any properties under the selected status filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                id={`listing-card-${listing.id}`}
                className="group bg-[#FFFFFF] rounded-xl border border-[#1B4332]/10 hover:border-[#1B4332]/30 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Photo with Status Badge overlay */}
                  <div className="relative aspect-video w-full bg-[#1B4332]/5 overflow-hidden">
                    <img
                      src={listing.photos?.[0] || listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80'}
                      alt={listing.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      {listing.status === 'approved_live' || listing.status === 'approved' ? (
                        <span
                          id={`badge-status-${listing.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#2D6A4F] text-white shadow-md"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approved & Live</span>
                        </span>
                      ) : listing.status === 'rejected' ? (
                        <span
                          id={`badge-status-${listing.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-600 text-white shadow-md"
                        >
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <span
                          id={`badge-status-${listing.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E8A33D] text-[#14231C] shadow-md border border-[#E8A33D]/40"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending Verification</span>
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3 bg-[#14231C]/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-medium">
                      {listing.propertyType}
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-[#2D6A4F] font-semibold mb-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{listing.cityArea}, {listing.state}</span>
                      </div>
                      <h4 className="text-base font-bold text-[#14231C] line-clamp-1 group-hover:text-[#1B4332] transition-colors font-serif">
                        {listing.title}
                      </h4>
                    </div>

                    {/* Pricing */}
                    <div className="bg-[#FBF6EC] p-2.5 rounded-lg border border-[#1B4332]/10 flex items-center justify-between">
                      <span className="text-xs text-[#6B756F]">Nightly Rate:</span>
                      <span className="text-sm font-extrabold text-[#1B4332]">
                        ₦{listing.pricePerDay.toLocaleString()} <span className="text-[11px] font-normal text-[#6B756F]">/ night</span>
                      </span>
                    </div>

                    {/* Nigerian Amenities Snippet */}
                    <div className="flex flex-wrap gap-1.5">
                      {listing.amenities.slice(0, 3).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#1B4332]/5 text-[#14231C] border border-[#1B4332]/10 truncate max-w-[170px]"
                        >
                          {amenity}
                        </span>
                      ))}
                      {listing.amenities.length > 3 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#1B4332]/10 text-[#1B4332]">
                          +{listing.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Verification Notice & Action Footer */}
                <div className="p-4 pt-0">
                  <div className="border-t border-[#1B4332]/10 pt-3">
                    {listing.status === 'pending_verification' ? (
                      <div className="flex items-start gap-1.5 text-[11px] text-[#E8A33D] bg-[#E8A33D]/10 p-2 rounded-lg mb-3">
                        <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="leading-tight text-[#14231C]">
                          Verification team will WhatsApp you at <strong className="font-mono">{listing.hostWhatsApp}</strong>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#2D6A4F] bg-[#2D6A4F]/10 p-2 rounded-lg mb-3">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span className="leading-tight font-medium">
                          Inspected & Guaranteed
                        </span>
                      </div>
                    )}

                    {/* Action buttons: Inspection Details + Destructive Delete */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedListing(listing)}
                        id={`view-details-${listing.id}`}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-[#1B4332] bg-[#FBF6EC] hover:bg-[#1B4332]/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspection Details</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handlePromptDeleteListing(listing, e)}
                        id={`delete-listing-${listing.id}`}
                        title="Delete listing"
                        className="py-2 px-3 rounded-lg text-xs font-semibold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-current" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active 'Delete Account' (Danger Zone) */}
      <div className="bg-white rounded-2xl border border-red-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </div>
            <p className="text-xs text-[#6B756F] max-w-xl leading-relaxed">
              Permanently delete your host account, active listings, and all verified physical inspection records.
            </p>
          </div>
          <button
            type="button"
            onClick={handlePromptDeleteAccount}
            id="danger-zone-delete-account-btn"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:text-white bg-red-50/50 hover:bg-red-600 border border-red-300 hover:border-red-600 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete My Account</span>
          </button>
        </div>
      </div>

      {/* Delete Listing In-App Confirmation Modal */}
      {listingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14231C]/65 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#14231C] font-serif">Delete Property Listing?</h3>
                <p className="text-xs text-[#6B756F]">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-[#FBF6EC] p-3.5 rounded-xl border border-[#1B4332]/10 mb-5 flex items-center gap-3">
              <img
                src={listingToDelete.photos?.[0] || listingToDelete.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&auto=format&fit=crop&q=80'}
                alt={listingToDelete.title}
                className="w-14 h-14 rounded-lg object-cover border border-[#1B4332]/10 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-[#14231C] truncate">{listingToDelete.title}</h4>
                <p className="text-[11px] text-[#2D6A4F] mt-0.5">{listingToDelete.cityArea}, {listingToDelete.state}</p>
                <p className="text-[11px] font-bold text-[#1B4332] mt-0.5">₦{listingToDelete.pricePerDay?.toLocaleString()} / night</p>
              </div>
            </div>

            <p className="text-xs text-[#6B756F] leading-relaxed mb-5">
              Are you sure you want to permanently delete this listing from your host portfolio and remove it from the Ileya platform?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setListingToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#6B756F] hover:bg-[#1B4332]/5 hover:text-[#14231C] transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                id="confirm-delete-listing-btn"
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/20 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Listing'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account In-App Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14231C]/65 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-300 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#14231C] font-serif">Permanently Delete Account?</h3>
                <p className="text-xs text-red-600 font-semibold">Irreversible Danger Zone action</p>
              </div>
            </div>

            <p className="text-xs text-[#6B756F] leading-relaxed mb-5 bg-red-50 p-3 rounded-xl border border-red-200">
              WARNING: This will permanently delete your host account, deactivate all your active listings, and purge all your verified inspection records.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#6B756F] hover:bg-[#1B4332]/5 hover:text-[#14231C] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                id="confirm-delete-account-btn"
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete My Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listing Inspection Details Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14231C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#1B4332]/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold mb-2 ${
                  selectedListing.status === 'approved_live' || selectedListing.status === 'approved'
                    ? 'bg-[#2D6A4F] text-white'
                    : selectedListing.status === 'rejected'
                    ? 'bg-red-600 text-white'
                    : 'bg-[#E8A33D] text-[#14231C]'
                }`}>
                  {selectedListing.status === 'approved_live' || selectedListing.status === 'approved' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Live
                    </>
                  ) : selectedListing.status === 'rejected' ? (
                    <>
                      Rejected
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" /> Pending Verification
                    </>
                  )}
                </span>
                <h3 className="text-xl font-bold text-[#1B4332] font-serif">
                  {selectedListing.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="p-1 rounded-lg text-[#6B756F] hover:text-[#14231C] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#14231C]">
              <div className="bg-[#FBF6EC] p-3 rounded-xl border border-[#1B4332]/10 space-y-1">
                <p className="text-[#6B756F] font-semibold">Street Address:</p>
                <p className="font-medium text-[#14231C]">{selectedListing.streetAddress}</p>
                <p className="text-[#2D6A4F] font-semibold">{selectedListing.cityArea}, {selectedListing.state}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#FBF6EC] rounded-xl border border-[#1B4332]/10">
                  <p className="text-[#6B756F]">Property Type</p>
                  <p className="font-bold text-sm text-[#1B4332]">{selectedListing.propertyType}</p>
                </div>
                <div className="p-3 bg-[#FBF6EC] rounded-xl border border-[#1B4332]/10">
                  <p className="text-[#6B756F]">Price Per Day</p>
                  <p className="font-bold text-sm text-[#1B4332]">₦{selectedListing.pricePerDay.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="font-bold text-[#1B4332] mb-1.5">Selected Nigerian Amenities:</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedListing.amenities.map((item, i) => (
                    <span key={i} className="px-2 py-1 bg-[#1B4332]/5 rounded text-[11px] border border-[#1B4332]/10 font-medium">
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <p className="font-bold text-[#1B4332] flex items-center gap-1.5 mb-1">
                  <Phone className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  Host WhatsApp Inspection Contact
                </p>
                <p className="font-mono text-sm font-semibold text-[#14231C]">{selectedListing.hostWhatsApp}</p>
                <p className="text-[11px] text-[#6B756F] mt-1">
                  Strictly private. Used by Ileya on-ground inspectors to confirm keys and verify generators/inverters before activation.
                </p>
              </div>

              {selectedListing.verificationNotes && (
                <div className="p-3 rounded-xl bg-[#2D6A4F]/5 border border-[#2D6A4F]/20">
                  <p className="font-bold text-[#2D6A4F] mb-0.5">Verification Log:</p>
                  <p className="text-[11px] text-[#6B756F]">{selectedListing.verificationNotes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#1B4332]/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handlePromptDeleteListing(selectedListing)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete This Listing</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedListing(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1B4332] text-white hover:bg-[#2D6A4F] transition-all cursor-pointer"
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
