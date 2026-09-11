import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  CreditCard,
  Calendar,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Filter,
  ExternalLink,
  ChevronRight,
  Eye,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  Users
} from 'lucide-react';
import { GuestBooking, PropertyListing } from '../../types';
import {
  getAllBookingsFromSupabase,
  getAllListingsFromSupabase,
  subscribeToBookings
} from '../../lib/supabaseService';
import { useApp } from '../../context/AppContext';

export interface AdminBookingsManagerProps {
  listings?: PropertyListing[];
  className?: string;
}

export const AdminBookingsManager: React.FC<AdminBookingsManagerProps> = ({
  listings: propsListings,
  className = '',
}) => {
  const { listings: contextListings } = useApp();
  const availableListings = propsListings || contextListings || [];

  const [bookings, setBookings] = useState<GuestBooking[]>([]);
  const [allListings, setAllListings] = useState<PropertyListing[]>(availableListings);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<GuestBooking | null>(null);

  // Fetch all bookings and listings from Supabase
  const loadData = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [fetchedBookings, fetchedListings] = await Promise.all([
        getAllBookingsFromSupabase(),
        getAllListingsFromSupabase(),
      ]);

      if (fetchedBookings && fetchedBookings.length > 0) {
        setBookings(fetchedBookings);
      }
      if (fetchedListings && fetchedListings.length > 0) {
        setAllListings(fetchedListings);
      }
    } catch (err) {
      console.error('Error fetching admin bookings data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time booking updates from Supabase
    const unsubscribe = subscribeToBookings((updatedBookings) => {
      if (updatedBookings && updatedBookings.length > 0) {
        setBookings(updatedBookings);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Create a listing lookup map by listing ID
  const listingsMap = useMemo(() => {
    const map = new Map<string, PropertyListing>();
    allListings.forEach((l) => {
      map.set(l.id, l);
    });
    return map;
  }, [allListings]);

  // Merge booking records with matching listing information
  const enrichedBookings = useMemo(() => {
    return bookings.map((b) => {
      const matchedListing = listingsMap.get(b.listingId);
      return {
        ...b,
        // Fallback to matched listing details if booking snapshot was partial
        resolvedTitle: b.listingTitle || matchedListing?.title || 'Verified Property',
        resolvedPhoto:
          b.listingPhoto ||
          matchedListing?.photos?.[0] ||
          matchedListing?.images?.[0] ||
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
        resolvedPropertyType:
          b.propertyType || matchedListing?.propertyType || 'Apartment',
        resolvedState: b.state || matchedListing?.state || 'Lagos',
        resolvedCity: b.cityArea || matchedListing?.cityArea || 'Lekki',
        resolvedAddress:
          b.streetAddress || matchedListing?.streetAddress || 'Lagos, Nigeria',
        resolvedHostName:
          b.hostFullName || matchedListing?.hostFullName || 'Host Partner',
        resolvedHostEmail:
          b.hostEmail || matchedListing?.hostEmail || 'host@ileya.ng',
        resolvedHostPhone:
          b.hostWhatsApp || matchedListing?.hostWhatsApp || '+234000000000',
      };
    });
  }, [bookings, listingsMap]);

  // Filter list by Guest Name or Payment Reference (and status)
  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return enrichedBookings.filter((booking) => {
      // Status match
      if (statusFilter !== 'all') {
        const paymentStatus = (booking.paymentStatus || 'completed').toLowerCase();
        if (statusFilter === 'completed' && paymentStatus !== 'completed') return false;
        if (statusFilter === 'pending' && paymentStatus !== 'pending') return false;
        if (statusFilter === 'failed' && paymentStatus !== 'failed') return false;
      }

      // Search term match across Guest Name, Payment Reference, Email, and Property Name
      if (!term) return true;

      const guestName = (booking.guestFullName || '').toLowerCase();
      const paymentRef = (booking.paymentReference || '').toLowerCase();
      const guestEmail = (booking.guestEmail || '').toLowerCase();
      const propertyTitle = (booking.resolvedTitle || '').toLowerCase();
      const bookingId = (booking.id || '').toLowerCase();

      return (
        guestName.includes(term) ||
        paymentRef.includes(term) ||
        guestEmail.includes(term) ||
        propertyTitle.includes(term) ||
        bookingId.includes(term)
      );
    });
  }, [enrichedBookings, searchTerm, statusFilter]);

  // Aggregate Metrics for Header
  const metrics = useMemo(() => {
    const totalAmount = bookings.reduce(
      (sum, b) => sum + (Number(b.totalAmount || b.totalPrice) || 0),
      0
    );
    const completedCount = bookings.filter(
      (b) => (b.paymentStatus || 'completed') === 'completed'
    ).length;
    const totalNights = bookings.reduce((sum, b) => sum + (Number(b.nights) || 1), 0);

    return {
      totalRevenue: totalAmount,
      totalCount: bookings.length,
      completedCount,
      totalNights,
    };
  }, [bookings]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1B4332]">
              Bookings Manager
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#1B4332] text-[#E8A33D] text-xs font-bold font-mono">
              {bookings.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B756F] mt-1">
            Real-time Supabase transaction ledger, guest reservations, and Paystack settlement status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          id="refresh-bookings-btn"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#1B4332]/20 text-[#1B4332] hover:bg-[#FBF6EC] text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#E8A33D]' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Refresh Records'}</span>
        </button>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Volume Collected */}
        <div className="bg-white p-4 rounded-2xl border border-[#1B4332]/10 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6B756F] uppercase tracking-wider block">
              Total Revenue
            </span>
            <span className="text-xl font-extrabold font-serif text-[#1B4332] mt-0.5 block">
              ₦{metrics.totalRevenue.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Secured in Escrow</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Total Bookings */}
        <div className="bg-white p-4 rounded-2xl border border-[#1B4332]/10 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6B756F] uppercase tracking-wider block">
              Total Reservations
            </span>
            <span className="text-xl font-extrabold font-serif text-[#14231C] mt-0.5 block">
              {metrics.totalCount}
            </span>
            <span className="text-[10px] text-[#6B756F] font-medium mt-0.5 block">
              {metrics.completedCount} successful settlements
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FBF6EC] text-[#1B4332] flex items-center justify-center border border-[#1B4332]/10">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Total Guest Nights */}
        <div className="bg-white p-4 rounded-2xl border border-[#1B4332]/10 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6B756F] uppercase tracking-wider block">
              Booked Nights
            </span>
            <span className="text-xl font-extrabold font-serif text-[#14231C] mt-0.5 block">
              {metrics.totalNights} Nights
            </span>
            <span className="text-[10px] text-[#6B756F] font-medium mt-0.5 block">
              Across all verified properties
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Verified Properties */}
        <div className="bg-white p-4 rounded-2xl border border-[#1B4332]/10 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6B756F] uppercase tracking-wider block">
              Active Inventory
            </span>
            <span className="text-xl font-extrabold font-serif text-[#14231C] mt-0.5 block">
              {allListings.length} Properties
            </span>
            <span className="text-[10px] text-[#6B756F] font-medium mt-0.5 block">
              Physical QA verified hosts
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center border border-[#2D6A4F]/20">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#1B4332]/10 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar: Filters by Guest Name or Payment Reference */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B756F] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="admin-bookings-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by Guest Name, Payment Reference (e.g. ILE-..., PAY-...), or Property..."
              className="w-full pl-9 pr-8 py-2.5 bg-[#FBF6EC] rounded-xl border border-[#1B4332]/15 text-xs text-[#14231C] placeholder:text-[#6B756F]/70 focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B756F] hover:text-[#14231C]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Payment Status Dropdown Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#6B756F] hidden sm:block" />
            <span className="text-xs font-bold text-[#6B756F] hidden sm:block">Status:</span>
            <select
              id="admin-bookings-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-[#FBF6EC] rounded-xl border border-[#1B4332]/15 text-xs font-semibold text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            >
              <option value="all">All Payment Statuses</option>
              <option value="completed">Completed / Settled</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed / Cancelled</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-[11px] text-[#6B756F] pt-1">
          <span>
            Showing <strong className="text-[#14231C]">{filteredBookings.length}</strong> of{' '}
            <strong className="text-[#14231C]">{bookings.length}</strong> bookings
          </span>
          {searchTerm && (
            <span className="text-[#E8A33D] font-bold">
              Filtered for &ldquo;{searchTerm}&rdquo;
            </span>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-[#1B4332]/10 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#E8A33D] animate-spin mx-auto" />
            <p className="text-xs font-medium text-[#6B756F]">
              Querying Supabase bookings table and resolving property metadata...
            </p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-16 text-center space-y-3 max-w-sm mx-auto px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FBF6EC] text-[#1B4332] flex items-center justify-center mx-auto border border-[#1B4332]/10">
              <CreditCard className="w-6 h-6 text-[#6B756F]" />
            </div>
            <h3 className="text-base font-bold font-serif text-[#1B4332]">
              {searchTerm ? 'No Matching Bookings Found' : 'No Bookings Recorded Yet'}
            </h3>
            <p className="text-xs text-[#6B756F]">
              {searchTerm
                ? 'Try searching with a different guest name, booking ID, or Paystack payment reference.'
                : 'Guest reservations completed through Paystack checkout will automatically appear here in real-time.'}
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-3.5 py-1.5 rounded-xl bg-[#FBF6EC] hover:bg-[#1B4332]/10 text-xs font-bold text-[#1B4332] cursor-pointer"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1B4332] text-white uppercase text-[10px] tracking-wider font-semibold border-b border-[#2D6A4F]">
                  <th className="py-3.5 px-4">Guest Name</th>
                  <th className="py-3.5 px-4">Guest Email</th>
                  <th className="py-3.5 px-4">Property Name</th>
                  <th className="py-3.5 px-4">Dates & Duration</th>
                  <th className="py-3.5 px-4">Amount Paid</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B4332]/10">
                {filteredBookings.map((booking) => {
                  const paymentStatus = (booking.paymentStatus || 'completed').toLowerCase();
                  const isCompleted = paymentStatus === 'completed' || paymentStatus === 'success';

                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-[#FBF6EC]/70 transition-colors group"
                    >
                      {/* 1. Guest Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center font-bold font-serif text-xs shrink-0">
                            {(booking.guestFullName || 'G').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-[#14231C] block text-xs">
                              {booking.guestFullName || 'Valued Guest'}
                            </span>
                            {booking.guestPhone ? (
                              <span className="text-[10px] text-[#6B756F] flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-[#2D6A4F]" />
                                <span>{booking.guestPhone}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#6B756F] font-mono">
                                ID: {booking.id.slice(-8)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Guest Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#14231C]">
                          <Mail className="w-3 h-3 text-[#6B756F] shrink-0" />
                          <span className="truncate max-w-[170px]" title={booking.guestEmail}>
                            {booking.guestEmail || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* 3. Property Name & Host Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={booking.resolvedPhoto}
                            alt={booking.resolvedTitle}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover border border-[#1B4332]/10 shrink-0 bg-[#14231C]"
                          />
                          <div className="max-w-[200px]">
                            <span
                              className="font-bold text-[#1B4332] block truncate text-xs hover:text-[#2D6A4F]"
                              title={booking.resolvedTitle}
                            >
                              {booking.resolvedTitle}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-[#6B756F] mt-0.5 truncate">
                              <MapPin className="w-2.5 h-2.5 text-[#2D6A4F] shrink-0" />
                              <span className="truncate">
                                {booking.resolvedCity}, {booking.resolvedState}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#2D6A4F] font-medium mt-0.5 truncate">
                              Host: <strong>{booking.resolvedHostName}</strong>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 4. Dates & Duration */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-[#14231C] text-xs">
                            <Calendar className="w-3 h-3 text-[#2D6A4F] shrink-0" />
                            <span>
                              {booking.checkInDate} → {booking.checkOutDate}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[#6B756F]">
                            <span className="px-1.5 py-0.5 rounded-md bg-[#FBF6EC] border border-[#1B4332]/10 font-bold text-[#1B4332]">
                              {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                            </span>
                            <span>•</span>
                            <span>{booking.guestsCount} {booking.guestsCount === 1 ? 'guest' : 'guests'}</span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Amount Paid */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-extrabold font-serif text-[#1B4332] text-sm block">
                            ₦{(Number(booking.totalAmount || booking.totalPrice) || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-[#6B756F] font-mono">
                            ₦{((Number(booking.totalAmount || booking.totalPrice) || 0) / Math.max(1, booking.nights)).toLocaleString()}/night
                          </span>
                        </div>
                      </td>

                      {/* 6. Payment Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>Paid & Settled</span>
                            </span>
                          ) : paymentStatus === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>Payment Pending</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 text-[11px] font-bold">
                              <AlertCircle className="w-3 h-3 text-red-700" />
                              <span>{booking.paymentStatus || 'Failed'}</span>
                            </span>
                          )}

                          {booking.paymentReference && (
                            <div className="text-[10px] text-[#6B756F] font-mono truncate max-w-[130px]" title={booking.paymentReference}>
                              Ref: {booking.paymentReference}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 7. Action: View Details */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(booking)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-[#1B4332]/20 hover:bg-[#1B4332] hover:text-white text-[#1B4332] font-bold text-xs transition-all flex items-center gap-1 ml-auto cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#1B4332]/10 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#1B4332] text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-[#E8A33D]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif">
                    Booking & Payment Audit Details
                  </h3>
                  <p className="text-[10px] text-[#FBF6EC]/70 font-mono">
                    ID: {selectedBooking.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Payment Status Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <span className="text-sm font-bold block">
                      Paystack Payment Verified & Secured
                    </span>
                    <span className="text-xs text-emerald-800 font-mono mt-0.5 block">
                      Reference: <strong>{selectedBooking.paymentReference || 'N/A'}</strong>
                    </span>
                    <span className="text-[11px] text-emerald-700 block mt-1">
                      Status: <strong>{selectedBooking.paymentStatus || 'Completed'}</strong> • Funds escrowed pending physical checkout.
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">Amount Paid</span>
                  <span className="text-lg font-extrabold font-serif text-emerald-950">
                    ₦{(Number(selectedBooking.totalAmount || selectedBooking.totalPrice) || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Property Details Card */}
              <div className="p-4 rounded-2xl bg-[#FBF6EC] border border-[#1B4332]/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B4332] uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-[#2D6A4F]" />
                  <span>Booked Property Information</span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={(selectedBooking as any).resolvedPhoto || selectedBooking.listingPhoto}
                    alt={(selectedBooking as any).resolvedTitle || selectedBooking.listingTitle}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover border border-[#1B4332]/15 bg-[#14231C]"
                  />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold font-serif text-[#1B4332]">
                      {(selectedBooking as any).resolvedTitle || selectedBooking.listingTitle}
                    </h4>
                    <p className="text-xs text-[#6B756F] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#2D6A4F]" />
                      <span>
                        {(selectedBooking as any).resolvedAddress || selectedBooking.streetAddress},{' '}
                        {(selectedBooking as any).resolvedCity || selectedBooking.cityArea},{' '}
                        {(selectedBooking as any).resolvedState || selectedBooking.state} State
                      </span>
                    </p>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#1B4332]/10 text-[#1B4332] font-semibold text-[10px]">
                      {(selectedBooking as any).resolvedPropertyType || selectedBooking.propertyType || 'Apartment'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Two Column Grid: Guest Details & Host Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Guest Details */}
                <div className="p-4 rounded-2xl bg-white border border-[#1B4332]/10 space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#1B4332] border-b border-[#1B4332]/10 pb-2">
                    <User className="w-4 h-4 text-[#2D6A4F]" />
                    <span>Guest Profile</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] text-[#6B756F] block">Full Name</span>
                      <span className="font-bold text-[#14231C]">
                        {selectedBooking.guestFullName || 'Guest User'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B756F] block">Email Address</span>
                      <span className="font-medium text-[#14231C]">
                        {selectedBooking.guestEmail || 'N/A'}
                      </span>
                    </div>
                    {selectedBooking.guestPhone && (
                      <div>
                        <span className="text-[10px] text-[#6B756F] block">Phone Number</span>
                        <span className="font-medium text-[#14231C]">
                          {selectedBooking.guestPhone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Host Details */}
                <div className="p-4 rounded-2xl bg-white border border-[#1B4332]/10 space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#1B4332] border-b border-[#1B4332]/10 pb-2">
                    <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
                    <span>Host Partner</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] text-[#6B756F] block">Host Name</span>
                      <span className="font-bold text-[#14231C]">
                        {(selectedBooking as any).resolvedHostName || selectedBooking.hostFullName || 'Verified Host'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B756F] block">Host Email</span>
                      <span className="font-medium text-[#14231C]">
                        {(selectedBooking as any).resolvedHostEmail || selectedBooking.hostEmail || 'host@ileya.ng'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B756F] block">WhatsApp / Phone</span>
                      <span className="font-medium text-[#2D6A4F] font-mono">
                        {(selectedBooking as any).resolvedHostPhone || selectedBooking.hostWhatsApp || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule & Breakdown */}
              <div className="p-4 rounded-2xl bg-white border border-[#1B4332]/10 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#1B4332]/10 pb-2">
                  <span className="font-bold text-[#1B4332]">Reservation Schedule</span>
                  <span className="text-[#6B756F]">
                    Booked on: {new Date(selectedBooking.bookedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2.5 rounded-xl bg-[#FBF6EC]">
                    <span className="text-[10px] text-[#6B756F] block">Check-In</span>
                    <span className="font-bold text-[#14231C] text-xs mt-0.5 block">
                      {selectedBooking.checkInDate}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FBF6EC]">
                    <span className="text-[10px] text-[#6B756F] block">Check-Out</span>
                    <span className="font-bold text-[#14231C] text-xs mt-0.5 block">
                      {selectedBooking.checkOutDate}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FBF6EC]">
                    <span className="text-[10px] text-[#6B756F] block">Length of Stay</span>
                    <span className="font-bold text-[#1B4332] text-xs mt-0.5 block">
                      {selectedBooking.nights} {selectedBooking.nights === 1 ? 'Night' : 'Nights'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#FBF6EC] border-t border-[#1B4332]/10 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2.5 rounded-xl bg-[#1B4332] text-white hover:bg-[#2D6A4F] font-bold text-xs transition-colors cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
