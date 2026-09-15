import { supabase } from './supabase';
import { generateUUID, isValidUUID } from './uuid';
import {
  RegisteredUser,
  PropertyListing,
  GuestBooking,
  BankPayoutDetails,
  Review
} from '../types';

/**
 * Fetch User record by UID from Supabase
 */
export async function getUserFromSupabase(uid: string): Promise<RegisteredUser | null> {
  try {
    // Check profiles table first
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (!profileError && profileData) {
      let resolvedName = profileData.full_name || profileData.fullName || (profileData.first_name ? `${profileData.first_name} ${profileData.last_name || ''}`.trim() : '') || '';
      if (typeof resolvedName === 'string' && (resolvedName.toLowerCase().includes('diagnostic probe') || resolvedName.toLowerCase().includes('diagnostic.probe'))) {
        resolvedName = '';
      }
      return {
        id: profileData.id,
        uid: profileData.id,
        email: profileData.email,
        fullName: resolvedName,
        role: profileData.role || 'guest',
        createdAt: profileData.created_at,
      };
    }

    // Fallback check users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching user by UID from Supabase:', error.message);
      return null;
    }
    return data as RegisteredUser | null;
  } catch (err) {
    console.error('Supabase getUser error:', err);
    return null;
  }
}

/**
 * Fetch User record by Email from Supabase
 */
export async function getUserByEmailFromSupabase(email: string): Promise<RegisteredUser | null> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Check profiles table first
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!profileError && profileData) {
      let resolvedName = profileData.full_name || profileData.fullName || (profileData.first_name ? `${profileData.first_name} ${profileData.last_name || ''}`.trim() : '') || '';
      if (typeof resolvedName === 'string' && (resolvedName.toLowerCase().includes('diagnostic probe') || resolvedName.toLowerCase().includes('diagnostic.probe'))) {
        resolvedName = '';
      }
      return {
        id: profileData.id,
        uid: profileData.id,
        email: profileData.email,
        fullName: resolvedName,
        role: profileData.role || 'guest',
        createdAt: profileData.created_at,
      };
    }

    // Fallback check users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching user by email from Supabase:', error.message);
      return null;
    }
    return data as RegisteredUser | null;
  } catch (err) {
    console.error('Supabase getUserByEmail error:', err);
    return null;
  }
}

/**
 * Save or Upsert User profile in Supabase
 * Note: Guest checkout is completely decoupled from profiles. The profiles table has a strict
 * foreign key constraint (profiles_id_fkey) referencing auth.users(id). Only users created
 * through supabase.auth.signUp() are written to profiles.
 */
export async function saveUserDocToSupabase(user: RegisteredUser): Promise<void> {
  try {
    const targetId = user?.uid || user?.id || '';
    if (!targetId) return;

    // Check if there is an active authenticated auth session matching target user
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user || authData.user.id !== targetId) {
      // Completely decoupled: Never insert guests into profiles table to prevent foreign key violations
      console.log('[Decoupled Profiles] Bypassing profiles table insert for unauthenticated guest:', targetId);
      return;
    }

    const payload = {
      id: targetId,
      email: user?.email ? user.email.trim().toLowerCase() : '',
      full_name: user?.fullName || '',
      role: user?.role || 'guest',
      created_at: user?.createdAt || new Date().toISOString(),
    };

    console.log("PAYLOAD:", payload);

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      if (error.code === '23503') {
        console.warn('[Decoupled Profiles] Foreign key constraint profiles_id_fkey bypassed:', error.message);
        return;
      }
      console.error('Supabase profiles upsert error:', error);
      throw error;
    }
  } catch (err: any) {
    console.warn('[Decoupled Profiles] Profile save safely handled:', err?.message || err);
  }
}

export const syncUserToSupabase = saveUserDocToSupabase;

/**
 * Save or Upsert Listing in Supabase
 */
export async function saveListingToSupabase(listing: PropertyListing): Promise<void> {
  try {
    const record = {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      property_type: listing.propertyType,
      price: listing.pricePerDay,
      price_per_day: listing.pricePerDay,
      state: listing.state,
      city: listing.cityArea,
      city_area: listing.cityArea,
      street_address: listing.streetAddress,
      amenities: listing.amenities || [],
      photos: listing.photos || listing.images || [],
      images: listing.photos || listing.images || [],
      host_whatsapp: listing.hostWhatsApp,
      host_full_name: listing.hostFullName,
      host_email: listing.hostEmail?.toLowerCase(),
      host_bank_details: listing.hostBankDetails,
      status: listing.status,
      is_physically_verified: listing.isPhysicallyVerified,
      verification_status: listing.verification_status || listing.verificationStatus || (listing.status === 'approved' || listing.status === 'approved_live' ? 'verified' : 'pending'),
      verification_notes: listing.verification_notes || listing.verificationNotes,
      verification_evidence_urls: listing.verification_evidence_urls || listing.verificationEvidenceUrls || [],
      created_at: listing.createdAt,
      rejection_reason: listing.rejectionReason,
    };

    const { error } = await supabase
      .from('listings')
      .upsert(record, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase upsert listing warning:', error.message);
    }
  } catch (err) {
    console.error('Supabase saveListing error:', err);
  }
}

/**
 * Update Listing partial in Supabase
 */
export async function updateListingInSupabase(id: string, updates: Partial<PropertyListing>): Promise<void> {
  try {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.propertyType !== undefined) payload.property_type = updates.propertyType;
    if (updates.pricePerDay !== undefined) {
      payload.price_per_day = updates.pricePerDay;
      payload.price = updates.pricePerDay;
    }
    if (updates.state !== undefined) payload.state = updates.state;
    if (updates.cityArea !== undefined) {
      payload.city_area = updates.cityArea;
      payload.city = updates.cityArea;
    }
    if (updates.streetAddress !== undefined) payload.street_address = updates.streetAddress;
    if (updates.amenities !== undefined) payload.amenities = updates.amenities;
    if (updates.photos !== undefined) payload.photos = updates.photos;
    if (updates.images !== undefined) payload.images = updates.images;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.isPhysicallyVerified !== undefined) payload.is_physically_verified = updates.isPhysicallyVerified;
    if (updates.verification_status !== undefined) payload.verification_status = updates.verification_status;
    if (updates.verificationStatus !== undefined) payload.verification_status = updates.verificationStatus;
    if (updates.verification_notes !== undefined) payload.verification_notes = updates.verification_notes;
    if (updates.verificationNotes !== undefined) payload.verification_notes = updates.verificationNotes;
    if (updates.verification_evidence_urls !== undefined) payload.verification_evidence_urls = updates.verification_evidence_urls;
    if (updates.verificationEvidenceUrls !== undefined) payload.verification_evidence_urls = updates.verificationEvidenceUrls;
    if (updates.rejectionReason !== undefined) payload.rejection_reason = updates.rejectionReason;

    const { error } = await supabase
      .from('listings')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.warn('Supabase update listing warning:', error.message);
    }
  } catch (err) {
    console.error('Supabase updateListing error:', err);
  }
}

/**
 * Delete Listing in Supabase
 */
export async function deleteListingFromSupabase(id: string): Promise<void> {
  try {
    // 1. Delete dependent bookings first if any
    try {
      await supabase.from('bookings').delete().eq('listing_id', id);
    } catch (bookingErr) {
      console.warn('Supabase delete dependent bookings warning:', bookingErr);
    }

    // 2. Delete listing by id
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase delete listing warning:', error.message);
    }
  } catch (err) {
    console.error('Supabase deleteListing error:', err);
  }
}

/**
 * Save / Insert Booking in Supabase
 */
export async function saveBookingToSupabase(booking: GuestBooking): Promise<void> {
  const bookingId = isValidUUID(booking.id) ? booking.id : generateUUID();
  const record: Record<string, any> = {
    id: bookingId,
    listing_id: booking.listingId,
    guest_name: booking.guestFullName || 'Valued Guest',
    guest_email: booking.guestEmail?.toLowerCase() || 'guest@ileya.ng',
    amount_paid: booking.totalAmount ?? booking.totalPrice ?? 0,
    check_in_date: booking.checkInDate,
    check_out_date: booking.checkOutDate,
    payment_status: booking.paymentStatus || 'completed',
    payment_reference: booking.paymentReference || '',
    booked_at: booking.bookedAt || new Date().toISOString(),
  };

  console.log("PAYLOAD:", record);
  const { data, error } = await supabase
    .from('bookings')
    .upsert(record, { onConflict: 'id' });

  if (error) {
    console.error('Supabase upsert booking error:', error);
    throw error;
  }
}

export interface CreateBookingParams {
  id?: string;
  listingId: string;
  listingTitle?: string;
  listingPhoto?: string;
  propertyType?: string;
  state?: string;
  cityArea?: string;
  streetAddress?: string;
  hostFullName?: string;
  hostWhatsApp?: string;
  hostEmail?: string;
  guestFullName: string;
  guestEmail: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  totalAmount: number;
  totalPrice?: number;
  nights: number;
  paymentReference: string;
  paymentStatus?: string;
  status?: 'confirmed' | 'completed' | 'cancelled';
}

/**
 * Checks whether an error from PostgreSQL/Supabase represents an exclusion
 * constraint violation (code 23P01) or date overlap collision.
 */
export function isPostgresExclusionError(err: any): boolean {
  if (!err) return false;
  const code = String(err.code || err.statusCode || '');
  const msg = String(err.message || '').toLowerCase();
  const details = String(err.details || '').toLowerCase();
  const hint = String(err.hint || '').toLowerCase();

  return (
    code === '23P01' || // PostgreSQL exclusion_violation
    code === '23505' || // PostgreSQL unique_violation
    code === 'P0001' || // PL/pgSQL RAISE EXCEPTION
    code === '40001' || // serialization_failure
    msg.includes('exclusion') ||
    msg.includes('overlap') ||
    msg.includes('conflict') ||
    msg.includes('already booked') ||
    msg.includes('duplicate') ||
    details.includes('exclusion') ||
    details.includes('overlap') ||
    details.includes('conflict') ||
    hint.includes('overlap')
  );
}

/**
 * Insert a new completed booking row directly into Supabase bookings table
 */
export async function insertBookingToSupabase(params: CreateBookingParams): Promise<{ data: any; error: any }> {
  try {
    const bookingId = isValidUUID(params.id || '') ? (params.id as string) : generateUUID();
    const record: Record<string, any> = {
      id: bookingId,
      listing_id: params.listingId,
      guest_name: params.guestFullName || 'Valued Guest',
      guest_email: params.guestEmail?.toLowerCase() || 'guest@ileya.ng',
      amount_paid: params.totalAmount || params.totalPrice || 0,
      check_in_date: params.checkInDate,
      check_out_date: params.checkOutDate,
      payment_status: params.paymentStatus || 'completed',
      payment_reference: params.paymentReference || '',
      booked_at: new Date().toISOString(),
    };

    // Pre-insert verification for date overlaps
    const { hasOverlap } = await checkBookingOverlap(
      params.listingId,
      params.checkInDate,
      params.checkOutDate
    );
    if (hasOverlap) {
      const exclusionErr = {
        code: '23P01',
        message: 'conflicting key value violates exclusion constraint: date range overlaps with existing booking',
        details: 'Key (listing_id, daterange(check_in_date, check_out_date)) conflicts with existing key.',
      };
      return { data: null, error: exclusionErr };
    }

    console.log("PAYLOAD:", record);
    const { data, error } = await supabase
      .from('bookings')
      .insert([record])
      .select();

    if (error) {
      console.error('Supabase direct insert booking error:', error);
      throw error;
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('Supabase insertBookingToSupabase error:', err);
    throw err;
  }
}

/**
 * Safe local Date parsing avoiding UTC midnight shift bugs
 */
export function parseLocalDate(dateStr: string | Date | null | undefined): Date {
  if (!dateStr) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }
  if (dateStr instanceof Date) {
    const d = new Date(dateStr.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const cleanStr = String(dateStr).split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 0, 0, 0, 0);
  }
  const fallback = new Date(dateStr);
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

/**
 * Format local Date to strict YYYY-MM-DD string
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Map a raw booking row from Supabase (with joined listings table data)
 * to our strongly typed GuestBooking interface.
 */
export function mapBookingWithListing(row: any): GuestBooking {
  const listingObj = Array.isArray(row.listings) ? row.listings[0] : row.listings;
  
  // Extract images array safely from either photos or images columns
  const rawPhotos = Array.isArray(listingObj?.photos)
    ? listingObj.photos
    : Array.isArray(listingObj?.images)
    ? listingObj.images
    : [];

  // Primary image URL resolution: image_url -> photos[0] -> images[0] -> snapshot photo
  const resolvedImageUrl =
    listingObj?.image_url ||
    rawPhotos[0] ||
    (typeof listingObj?.images === 'string' ? listingObj.images : '') ||
    row.listing_photo ||
    '';

  const normalizedListings = listingObj
    ? {
        ...listingObj,
        image_url: resolvedImageUrl,
        title: listingObj.title || row.listing_title || 'Verified Property',
        photos: rawPhotos.length > 0 ? rawPhotos : (resolvedImageUrl ? [resolvedImageUrl] : []),
        images: rawPhotos.length > 0 ? rawPhotos : (resolvedImageUrl ? [resolvedImageUrl] : []),
        property_type: listingObj.property_type || row.property_type || 'Apartment',
        state: listingObj.state || row.state || 'Nigeria',
        city_area: listingObj.city_area || listingObj.city || row.city_area || '',
        city: listingObj.city || listingObj.city_area || row.city_area || '',
        street_address: listingObj.street_address || row.street_address || '',
        price_per_day: Number(listingObj.price_per_day || listingObj.price || 0),
        host_full_name: listingObj.host_full_name || row.host_full_name || '',
        host_whatsapp: listingObj.host_whatsapp || row.host_whatsapp || '',
        host_email: listingObj.host_email || row.host_email || '',
      }
    : (resolvedImageUrl || row.listing_title
        ? {
            image_url: resolvedImageUrl,
            title: row.listing_title || 'Verified Property',
            photos: resolvedImageUrl ? [resolvedImageUrl] : [],
            images: resolvedImageUrl ? [resolvedImageUrl] : [],
          }
        : null);

  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: listingObj?.title || row.listing_title || 'Verified Property',
    listingPhoto: resolvedImageUrl,
    propertyType: listingObj?.property_type || row.property_type || 'Apartment',
    state: listingObj?.state || row.state || 'Nigeria',
    cityArea: listingObj?.city_area || listingObj?.city || row.city_area || '',
    streetAddress: listingObj?.street_address || row.street_address || '',
    hostFullName: listingObj?.host_full_name || row.host_full_name || '',
    hostWhatsApp: listingObj?.host_whatsapp || row.host_whatsapp || '',
    hostEmail: listingObj?.host_email || row.host_email || '',
    guestFullName: row.guest_name || row.guest_full_name || 'Valued Guest',
    guestEmail: row.guest_email || '',
    guestPhone: row.guest_phone || '',
    checkInDate: row.check_in_date,
    checkOutDate: row.check_out_date,
    guestsCount: row.guests_count || 1,
    totalPrice: Number(row.amount_paid || row.total_price || row.total_amount || 0),
    totalAmount: Number(row.amount_paid || row.total_amount || row.total_price || 0),
    nights: Number(row.nights || 1),
    bookedAt: row.booked_at || row.created_at || new Date().toISOString(),
    status: row.status || 'confirmed',
    paymentStatus: row.payment_status || 'completed',
    paymentReference: row.payment_reference || '',
    listings: normalizedListings,
  };
}

/**
 * Fetch all completed bookings for a specific listing from Supabase
 * Specifically filters where payment_status = 'completed'
 */
export async function getCompletedBookingsForListing(listingId: string): Promise<GuestBooking[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, listings(*)')
      .eq('listing_id', listingId)
      .eq('payment_status', 'completed');

    if (error) {
      console.warn('Supabase getCompletedBookingsForListing warning:', error.message);
      // Fallback: fetch without status filter if payment_status column has mixed casing
      const { data: fallbackData } = await supabase
        .from('bookings')
        .select('*, listings(*)')
        .eq('listing_id', listingId);

      const filtered = (fallbackData || []).filter(
        (row: any) =>
          String(row.payment_status || '').toLowerCase() === 'completed' ||
          String(row.status || '').toLowerCase() === 'confirmed'
      );

      return filtered.map(mapBookingWithListing);
    }

    return (data || []).map(mapBookingWithListing);
  } catch (err) {
    console.error('Supabase getCompletedBookingsForListing error:', err);
    return [];
  }
}

/**
 * Strict Pre-Payment Double-Booking Guard:
 * Query Supabase bookings table to check if any 'completed' bookings overlap with
 * the requested [checkInDate, checkOutDate] for the specified listing.
 * An overlap exists if: check_in_date < requestedCheckOut AND check_out_date > requestedCheckIn
 */
export async function checkBookingOverlap(
  listingId: string,
  checkInDate: string,
  checkOutDate: string
): Promise<{ hasOverlap: boolean; overlappingBookings: GuestBooking[] }> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('listing_id', listingId)
      .eq('payment_status', 'completed')
      .lt('check_in_date', checkOutDate)
      .gt('check_out_date', checkInDate);

    if (error) {
      console.warn('Supabase checkBookingOverlap direct query warning, falling back to local verification:', error.message);
      // Fallback: fetch listing completed bookings and check in JavaScript
      const completed = await getCompletedBookingsForListing(listingId);
      const overlapping = completed.filter((b) => {
        return b.checkInDate < checkOutDate && b.checkOutDate > checkInDate;
      });
      return {
        hasOverlap: overlapping.length > 0,
        overlappingBookings: overlapping,
      };
    }

    const mapped: GuestBooking[] = (data || []).map((row: any) => ({
      id: row.id,
      listingId: row.listing_id,
      listingTitle: row.listing_title,
      listingPhoto: row.listing_photo,
      propertyType: row.property_type,
      state: row.state,
      cityArea: row.city_area,
      streetAddress: row.street_address,
      hostFullName: row.host_full_name,
      hostWhatsApp: row.host_whatsapp,
      hostEmail: row.host_email,
      guestFullName: row.guest_full_name,
      guestEmail: row.guest_email,
      guestPhone: row.guest_phone,
      checkInDate: row.check_in_date,
      checkOutDate: row.check_out_date,
      guestsCount: row.guests_count,
      totalPrice: row.total_price || row.total_amount || 0,
      totalAmount: row.total_amount || row.total_price || 0,
      nights: row.nights,
      bookedAt: row.booked_at,
      status: row.status,
      paymentStatus: row.payment_status || 'completed',
      paymentReference: row.payment_reference || '',
    }));

    return {
      hasOverlap: mapped.length > 0,
      overlappingBookings: mapped,
    };
  } catch (err) {
    console.error('Supabase checkBookingOverlap exception:', err);
    return { hasOverlap: false, overlappingBookings: [] };
  }
}

/**
 * Search Page Date Filter Query:
 * Fetch all listing_ids that have overlapping 'completed' bookings for the requested date window.
 * Any property ID returned is unavailable for those dates and should be filtered out from the directory.
 */
export async function getUnavailableListingIdsForDates(
  checkInDate: string,
  checkOutDate: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('listing_id, check_in_date, check_out_date')
      .eq('payment_status', 'completed')
      .lt('check_in_date', checkOutDate)
      .gt('check_out_date', checkInDate);

    if (error) {
      console.warn('Supabase getUnavailableListingIdsForDates warning:', error.message);
      // Fallback: fetch all completed bookings and filter
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('listing_id, check_in_date, check_out_date, payment_status');

      const overlappingIds = (allBookings || [])
        .filter(
          (b: any) =>
            String(b.payment_status || '').toLowerCase() === 'completed' &&
            b.check_in_date < checkOutDate &&
            b.check_out_date > checkInDate
        )
        .map((b: any) => b.listing_id);

      return Array.from(new Set(overlappingIds.filter(Boolean)));
    }

    const ids = (data || []).map((row: any) => row.listing_id);
    return Array.from(new Set(ids.filter(Boolean)));
  } catch (err) {
    console.error('Supabase getUnavailableListingIdsForDates exception:', err);
    return [];
  }
}

/**
 * Fetch all bookings for a specific listing from Supabase
 */
export async function getBookingsForListing(listingId: string): Promise<GuestBooking[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, listings(*)')
      .eq('listing_id', listingId);

    if (error) {
      console.warn('Supabase getBookingsForListing warning:', error.message);
      return [];
    }

    return (data || []).map(mapBookingWithListing);
  } catch (err) {
    console.error('Supabase getBookings error:', err);
    return [];
  }
}


/**
 * Fetch all bookings across all listings from Supabase (for Admin & Dashboards)
 * Performs a foreign key join on listings table to hydrate listing details and photos
 */
export async function getAllBookingsFromSupabase(): Promise<GuestBooking[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, listings(*)')
      .order('booked_at', { ascending: false });

    if (error) {
      console.warn('Supabase getAllBookings warning:', error.message);
      return [];
    }

    return (data || []).map(mapBookingWithListing);
  } catch (err) {
    console.error('Supabase getAllBookings error:', err);
    return [];
  }
}

/**
 * Fetch all listings from Supabase
 */
export async function getAllListingsFromSupabase(): Promise<PropertyListing[]> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase getAllListings warning:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      propertyType: row.property_type,
      pricePerDay: Number(row.price_per_day || row.price || 0),
      state: row.state,
      cityArea: row.city_area || row.city,
      streetAddress: row.street_address,
      amenities: row.amenities || [],
      photos: row.photos || row.images || [],
      images: row.images || row.photos || [],
      hostWhatsApp: row.host_whatsapp,
      hostFullName: row.host_full_name,
      hostEmail: row.host_email,
      hostBankDetails: row.host_bank_details,
      status: row.status,
      isPhysicallyVerified: row.is_physically_verified,
      verification_status: row.verification_status || (row.status === 'approved' || row.status === 'approved_live' ? 'verified' : 'pending'),
      verificationStatus: row.verification_status || (row.status === 'approved' || row.status === 'approved_live' ? 'verified' : 'pending'),
      verification_notes: row.verification_notes || row.verificationNotes || '',
      verificationNotes: row.verification_notes || row.verificationNotes || '',
      verification_evidence_urls: Array.isArray(row.verification_evidence_urls) ? row.verification_evidence_urls : (Array.isArray(row.verificationEvidenceUrls) ? row.verificationEvidenceUrls : []),
      verificationEvidenceUrls: Array.isArray(row.verification_evidence_urls) ? row.verification_evidence_urls : (Array.isArray(row.verificationEvidenceUrls) ? row.verificationEvidenceUrls : []),
      createdAt: row.created_at,
      rejectionReason: row.rejection_reason,
    }));
  } catch (err) {
    console.error('Supabase getAllListings error:', err);
    return [];
  }
}

/**
 * Save Admin Email to Supabase
 */
export async function saveAdminEmailToSupabase(email: string): Promise<void> {
  try {
    const normalized = email.trim().toLowerCase();
    const { error } = await supabase
      .from('admin_emails')
      .upsert({ email: normalized, added_at: new Date().toISOString() }, { onConflict: 'email' });

    if (error) {
      console.warn('Supabase saveAdminEmail warning:', error.message);
    }
  } catch (err) {
    console.error('Supabase saveAdminEmail error:', err);
  }
}

/**
 * Delete Admin Email from Supabase
 */
export async function deleteAdminEmailFromSupabase(email: string): Promise<void> {
  try {
    const normalized = email.trim().toLowerCase();
    const { error } = await supabase
      .from('admin_emails')
      .delete()
      .eq('email', normalized);

    if (error) {
      console.warn('Supabase deleteAdminEmail warning:', error.message);
    }
  } catch (err) {
    console.error('Supabase deleteAdminEmail error:', err);
  }
}

/**
 * Save Host Payout Details in Supabase
 */
export async function savePayoutDetailsToSupabase(details: BankPayoutDetails, email?: string): Promise<void> {
  try {
    const hostEmail = (email || 'default_host').trim().toLowerCase();
    
    // 1. Upsert into payout_settings table
    const { error } = await supabase
      .from('payout_settings')
      .upsert({
        host_email: hostEmail,
        bank_name: details.bankName,
        account_number: details.accountNumber,
        account_name: details.accountName,
        is_verified: details.isVerified ?? true,
      }, { onConflict: 'host_email' });

    if (error) {
      console.warn('Supabase savePayoutDetails warning:', error.message);
    }

    // 2. Also update all listings created by this host so listing records carry the latest bank details
    if (hostEmail && hostEmail !== 'default_host') {
      try {
        const { error: listingUpdateError } = await supabase
          .from('listings')
          .update({ host_bank_details: details })
          .eq('host_email', hostEmail);

        if (listingUpdateError) {
          console.warn('Supabase update listings bank details warning:', listingUpdateError.message);
        }
      } catch (lErr) {
        console.warn('Supabase listings bank sync error:', lErr);
      }
    }
  } catch (err) {
    console.error('Supabase savePayoutDetails error:', err);
  }
}

/**
 * Fetch specific host's payout details from Supabase
 */
export async function getPayoutDetailsFromSupabase(email: string): Promise<BankPayoutDetails | null> {
  try {
    const hostEmail = email.trim().toLowerCase();
    const { data, error } = await supabase
      .from('payout_settings')
      .select('*')
      .eq('host_email', hostEmail)
      .maybeSingle();

    if (error) {
      console.warn('Supabase getPayoutDetails warning:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      bankName: data.bank_name,
      accountNumber: data.account_number,
      accountName: data.account_name,
      isVerified: data.is_verified ?? true,
    };
  } catch (err) {
    console.error('Supabase getPayoutDetails error:', err);
    return null;
  }
}

/**
 * Fetch all payout details mapped by host email from Supabase (for Master Admin)
 */
export async function getAllPayoutDetailsFromSupabase(): Promise<Record<string, BankPayoutDetails>> {
  try {
    const { data, error } = await supabase
      .from('payout_settings')
      .select('*');

    if (error) {
      console.warn('Supabase getAllPayoutDetails warning:', error.message);
      return {};
    }

    const map: Record<string, BankPayoutDetails> = {};
    (data || []).forEach((row: any) => {
      if (row.host_email) {
        map[row.host_email.toLowerCase()] = {
          bankName: row.bank_name,
          accountNumber: row.account_number,
          accountName: row.account_name,
          isVerified: row.is_verified ?? true,
        };
      }
    });
    return map;
  } catch (err) {
    console.error('Supabase getAllPayoutDetails error:', err);
    return {};
  }
}

/**
 * Subscribe to Real-Time Payout Settings from Supabase
 */
export function subscribeToPayoutSettings(onUpdate: (payouts: Record<string, BankPayoutDetails>) => void): () => void {
  // Initial fetch
  getAllPayoutDetailsFromSupabase().then((map) => {
    if (Object.keys(map).length > 0) {
      onUpdate(map);
    }
  }).catch((err) => console.warn('Initial payout fetch notice:', err));

  let channel: any = null;
  try {
    const channelName = `payouts_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payout_settings' }, () => {
        getAllPayoutDetailsFromSupabase().then(onUpdate).catch((err) => console.warn('Payout refresh notice:', err));
      })
      .subscribe((status, err) => {
        if (err) console.warn('Payouts realtime status:', status, err);
      });
  } catch (err) {
    console.warn('Could not create payouts realtime channel:', err);
  }

  return () => {
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (removeErr) {
        console.warn('Error removing payouts channel:', removeErr);
      }
    }
  };
}

/**
 * Subscribe to Real-Time Listings from Supabase
 */
export function subscribeToListings(onUpdate: (listings: PropertyListing[]) => void): () => void {
  const mapListingRow = (row: any): PropertyListing => ({
    id: row.id,
    title: row.title || 'Verified Apartment',
    description: row.description || '',
    propertyType: row.property_type || 'Apartment',
    pricePerDay: Number(row.price_per_day || row.price || 0),
    state: row.state || 'Lagos',
    cityArea: row.city_area || row.city || '',
    streetAddress: row.street_address || '',
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    photos: Array.isArray(row.photos) && row.photos.length > 0 ? row.photos : (Array.isArray(row.images) ? row.images : []),
    images: Array.isArray(row.images) && row.images.length > 0 ? row.images : (Array.isArray(row.photos) ? row.photos : []),
    hostWhatsApp: row.host_whatsapp || '+2348000000000',
    hostFullName: row.host_full_name || 'Verified Host',
    hostEmail: row.host_email || '',
    hostBankDetails: row.host_bank_details,
    status: row.status || 'approved_live',
    isPhysicallyVerified: row.is_physically_verified ?? true,
    verification_status: row.verification_status || (row.status === 'approved' || row.status === 'approved_live' ? 'verified' : 'pending'),
    verificationStatus: row.verification_status || (row.status === 'approved' || row.status === 'approved_live' ? 'verified' : 'pending'),
    verification_notes: row.verification_notes || row.verificationNotes || '',
    verificationNotes: row.verification_notes || row.verificationNotes || '',
    verification_evidence_urls: Array.isArray(row.verification_evidence_urls) ? row.verification_evidence_urls : (Array.isArray(row.verificationEvidenceUrls) ? row.verificationEvidenceUrls : []),
    verificationEvidenceUrls: Array.isArray(row.verification_evidence_urls) ? row.verification_evidence_urls : (Array.isArray(row.verificationEvidenceUrls) ? row.verificationEvidenceUrls : []),
    createdAt: row.created_at || new Date().toISOString(),
    rejectionReason: row.rejection_reason,
  });

  // Initial fetch
  supabase
    .from('listings')
    .select('*')
    .then(
      ({ data, error }) => {
        if (!error && data && data.length > 0) {
          onUpdate(data.map(mapListingRow));
        }
      },
      (err) => console.warn('Initial listings fetch notice:', err)
    );

  let channel: any = null;
  try {
    const channelName = `listings_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        // Re-fetch all on change
        supabase
          .from('listings')
          .select('*')
          .then(
            ({ data, error }) => {
              if (!error && data) {
                onUpdate(data.map(mapListingRow));
              }
            },
            (err) => console.warn('Listings refresh notice:', err)
          );
      })
      .subscribe((status, err) => {
        if (err) console.warn('Listings realtime status:', status, err);
      });
  } catch (err) {
    console.warn('Could not create listings realtime channel:', err);
  }

  return () => {
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (removeErr) {
        console.warn('Error removing listings channel:', removeErr);
      }
    }
  };
}

/**
 * Subscribe to Real-Time Bookings from Supabase
 */
export function subscribeToBookings(onUpdate: (bookings: GuestBooking[]) => void): () => void {
  // Initial fetch with listings foreign key join
  supabase
    .from('bookings')
    .select('*, listings(*)')
    .order('booked_at', { ascending: false })
    .then(
      ({ data, error }) => {
        if (!error && data && data.length > 0) {
          onUpdate(data.map(mapBookingWithListing));
        }
      },
      (err) => console.warn('Initial bookings fetch notice:', err)
    );

  let channel: any = null;
  try {
    const channelName = `bookings_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        supabase
          .from('bookings')
          .select('*, listings(*)')
          .order('booked_at', { ascending: false })
          .then(
            ({ data, error }) => {
              if (!error && data) {
                onUpdate(data.map(mapBookingWithListing));
              }
            },
            (err) => console.warn('Bookings refresh notice:', err)
          );
      })
      .subscribe((status, err) => {
        if (err) console.warn('Bookings realtime status:', status, err);
      });
  } catch (err) {
    console.warn('Could not create bookings realtime channel:', err);
  }

  return () => {
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (removeErr) {
        console.warn('Error removing bookings channel:', removeErr);
      }
    }
  };
}

/**
 * Subscribe to Admin Whitelist from Supabase
 */
export function subscribeToAdminEmails(onUpdate: (emails: string[]) => void): () => void {
  // Initial fetch
  supabase
    .from('admin_emails')
    .select('email')
    .then(
      ({ data, error }) => {
        if (!error && data && data.length > 0) {
          onUpdate(data.map((r: any) => r.email));
        }
      },
      (err) => console.warn('Initial admin emails fetch notice:', err)
    );

  let channel: any = null;
  try {
    const channelName = `admin_emails_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_emails' }, () => {
        supabase
          .from('admin_emails')
          .select('email')
          .then(
            ({ data, error }) => {
              if (!error && data) {
                onUpdate(data.map((r: any) => r.email));
              }
            },
            (err) => console.warn('Admin emails refresh notice:', err)
          );
      })
      .subscribe((status, err) => {
        if (err) console.warn('Admin emails realtime status:', status, err);
      });
  } catch (err) {
    console.warn('Could not create admin emails realtime channel:', err);
  }

  return () => {
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (removeErr) {
        console.warn('Error removing admin emails channel:', removeErr);
      }
    }
  };
}

/**
 * Evaluates whether midnight of the checkout day has strictly passed in local time.
 * E.g., if checkout is 2026-09-14, midnight of that day (23:59:59.999) has passed.
 */
export function isCheckoutDateStrictlyPast(checkOutDateStr: string | undefined | null): boolean {
  if (!checkOutDateStr) return false;
  try {
    const raw = String(checkOutDateStr).trim();
    const datePart = raw.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length < 3) {
      const parsed = new Date(raw);
      if (isNaN(parsed.getTime())) return false;
      parsed.setHours(23, 59, 59, 999);
      return Date.now() > parsed.getTime();
    }
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;

    // Midnight of the checkout day (end of that day: 23:59:59.999)
    const endOfCheckoutDay = new Date(year, month, day, 23, 59, 59, 999);
    return Date.now() > endOfCheckoutDay.getTime();
  } catch {
    return false;
  }
}

/**
 * Strict eligibility checker for leaving a review on a booking:
 * 1. payment_status is exactly 'completed'
 * 2. check_out_date is strictly in the past (midnight of checkout day has passed)
 * 3. The guest has not already left a review for this specific booking_id
 */
export function canLeaveReview(
  booking: GuestBooking,
  reviewedBookingIds: Set<string> | string[]
): boolean {
  if (!booking || !booking.id) return false;

  // Condition 1: payment_status is exactly 'completed'
  const paymentStatus = String(booking.paymentStatus || (booking as any).payment_status || '')
    .trim()
    .toLowerCase();
  if (paymentStatus !== 'completed') {
    return false;
  }

  // Condition 2: check_out_date is strictly in the past
  const checkOutDate = booking.checkOutDate || (booking as any).check_out_date;
  if (!isCheckoutDateStrictlyPast(checkOutDate)) {
    return false;
  }

  // Condition 3: guest has not already left a review for this booking_id
  const reviewedSet = Array.isArray(reviewedBookingIds)
    ? new Set(reviewedBookingIds)
    : reviewedBookingIds;

  if (reviewedSet.has(booking.id)) {
    return false;
  }

  return true;
}

/**
 * Fetch all reviews from Supabase reviews table
 */
export async function getAllReviewsFromSupabase(): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching all reviews from Supabase:', error.message);
      return [];
    }
    return (data as Review[]) || [];
  } catch (err) {
    console.error('getAllReviewsFromSupabase error:', err);
    return [];
  }
}

/**
 * Fetch reviews for a specific listing from Supabase
 */
export async function getReviewsForListing(listingId: string): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching reviews for listing from Supabase:', error.message);
      return [];
    }
    return (data as Review[]) || [];
  } catch (err) {
    console.error('getReviewsForListing error:', err);
    return [];
  }
}

/**
 * Fetch existing reviewed booking IDs set from Supabase
 */
export async function getReviewedBookingIds(): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('booking_id');

    if (error) {
      console.warn('Error fetching reviewed booking IDs from Supabase:', error.message);
      return new Set();
    }
    const ids = new Set<string>();
    if (Array.isArray(data)) {
      data.forEach((r: any) => {
        if (r.booking_id) ids.add(String(r.booking_id));
      });
    }
    return ids;
  } catch (err) {
    console.error('getReviewedBookingIds error:', err);
    return new Set();
  }
}

/**
 * Insert a review into Supabase with strict submission guard
 */
export async function insertReviewToSupabase(params: {
  listingId: string;
  bookingId: string;
  guestName: string;
  rating: number;
  comment: string;
  checkOutDate?: string;
}): Promise<{ data: Review | null; error: any }> {
  // Submission Guard: Re-verify that check-out date is in the past
  if (params.checkOutDate && !isCheckoutDateStrictlyPast(params.checkOutDate)) {
    const errorMsg = 'Reviews can only be submitted after your stay is fully completed.';
    return {
      data: null,
      error: new Error(errorMsg),
    };
  }

  try {
    const reviewId = generateUUID();
    const payload = {
      id: reviewId,
      listing_id: params.listingId,
      booking_id: params.bookingId,
      guest_name: params.guestName.trim() || 'Verified Guest',
      rating: Math.min(5, Math.max(1, Math.round(params.rating))),
      comment: params.comment.trim(),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('reviews')
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase insert review error:', error);
      return { data: null, error };
    }

    return { data: (data as Review) || (payload as Review), error: null };
  } catch (err: any) {
    console.error('insertReviewToSupabase error:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch all listings where verification_status === 'pending'
 */
export async function getPendingVerificationListingsFromSupabase(): Promise<PropertyListing[]> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .or('verification_status.eq.pending,status.eq.pending_verification,status.eq.pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase getPendingVerificationListings warning:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title || 'Verified Apartment',
      description: row.description || '',
      propertyType: row.property_type || 'Apartment',
      pricePerDay: Number(row.price_per_day || row.price || 0),
      state: row.state || 'Lagos',
      cityArea: row.city_area || row.city || '',
      streetAddress: row.street_address || '',
      amenities: Array.isArray(row.amenities) ? row.amenities : [],
      photos: Array.isArray(row.photos) && row.photos.length > 0 ? row.photos : (Array.isArray(row.images) ? row.images : []),
      images: Array.isArray(row.images) && row.images.length > 0 ? row.images : (Array.isArray(row.photos) ? row.photos : []),
      hostWhatsApp: row.host_whatsapp || '+2348000000000',
      hostFullName: row.host_full_name || 'Verified Host',
      hostEmail: row.host_email || '',
      hostBankDetails: row.host_bank_details,
      status: row.status || 'pending',
      isPhysicallyVerified: row.is_physically_verified ?? false,
      verification_status: row.verification_status || 'pending',
      verificationStatus: row.verification_status || 'pending',
      verification_notes: row.verification_notes || row.verificationNotes || '',
      verificationNotes: row.verification_notes || row.verificationNotes || '',
      verification_evidence_urls: Array.isArray(row.verification_evidence_urls) ? row.verification_evidence_urls : (Array.isArray(row.verificationEvidenceUrls) ? row.verificationEvidenceUrls : []),
      verificationEvidenceUrls: Array.isArray(row.verification_evidence_urls) ? row.verification_evidence_urls : (Array.isArray(row.verificationEvidenceUrls) ? row.verificationEvidenceUrls : []),
      createdAt: row.created_at || new Date().toISOString(),
      rejectionReason: row.rejection_reason,
    }));
  } catch (err) {
    console.error('Supabase getPendingVerificationListings error:', err);
    return [];
  }
}

/**
 * Upload multiple files to the 'verifications' storage bucket using Promise.all
 * and retrieve their public URLs.
 */
export async function uploadVerificationEvidenceFiles(
  files: File[],
  listingId: string
): Promise<string[]> {
  if (!files || files.length === 0) return [];

  const uploadPromises = Array.from(files).map(async (file, index) => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const cleanFileName = `verification_${listingId}_${timestamp}_${index}_${randomStr}.${fileExt}`;
    const filePath = `evidence/${listingId}/${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('verifications')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Failed uploading verification evidence file:', uploadError);
      throw new Error(uploadError.message || `Evidence upload failed for ${file.name}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('verifications')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  });

  return await Promise.all(uploadPromises);
}

/**
 * Update listing record in database:
 * - verification_status = 'verified'
 * - verification_notes = notes
 * - verification_evidence_urls = array of public URLs
 * - status = 'approved_live'
 * - is_physically_verified = true
 */
export async function verifyListingInSupabase(
  listingId: string,
  notes: string,
  evidenceUrls: string[]
): Promise<void> {
  const { error } = await supabase
    .from('listings')
    .update({
      verification_status: 'verified',
      verification_notes: notes,
      verification_evidence_urls: evidenceUrls,
      status: 'approved_live',
      is_physically_verified: true,
    })
    .eq('id', listingId);

  if (error) {
    console.error('Supabase update listing verification error:', error);
    throw new Error(error.message || 'Failed to update listing verification status');
  }
}


