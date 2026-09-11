import { supabase } from './supabase';
import {
  RegisteredUser,
  PropertyListing,
  GuestBooking,
  BankPayoutDetails
} from '../types';

/**
 * Fetch User record by UID from Supabase
 */
export async function getUserFromSupabase(uid: string): Promise<RegisteredUser | null> {
  try {
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
 */
export async function saveUserDocToSupabase(user: RegisteredUser): Promise<void> {
  try {
    const record = {
      uid: user.uid || user.id,
      email: user.email.trim().toLowerCase(),
      full_name: user.fullName,
      role: user.role,
      created_at: user.createdAt || new Date().toISOString(),
    };

    const { error } = await supabase
      .from('users')
      .upsert(record, { onConflict: 'uid' });

    if (error) {
      console.warn('Supabase upsert user warning:', error.message);
    }
  } catch (err) {
    console.error('Supabase saveUser error:', err);
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
      is_booked: listing.isBooked,
      created_at: listing.createdAt,
      verification_notes: listing.verificationNotes,
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
    if (updates.isBooked !== undefined) payload.is_booked = updates.isBooked;
    if (updates.verificationNotes !== undefined) payload.verification_notes = updates.verificationNotes;
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
  try {
    const record: Record<string, any> = {
      id: booking.id,
      listing_id: booking.listingId,
      listing_title: booking.listingTitle,
      listing_photo: booking.listingPhoto,
      property_type: booking.propertyType,
      state: booking.state,
      city_area: booking.cityArea,
      street_address: booking.streetAddress,
      host_full_name: booking.hostFullName,
      host_whatsapp: booking.hostWhatsApp,
      host_email: booking.hostEmail?.toLowerCase(),
      guest_full_name: booking.guestFullName,
      guest_email: booking.guestEmail?.toLowerCase(),
      guest_phone: booking.guestPhone || '',
      check_in_date: booking.checkInDate,
      check_out_date: booking.checkOutDate,
      guests_count: booking.guestsCount,
      total_price: booking.totalPrice,
      total_amount: booking.totalAmount ?? booking.totalPrice,
      nights: booking.nights,
      booked_at: booking.bookedAt,
      status: booking.status,
      payment_status: booking.paymentStatus || 'completed',
      payment_reference: booking.paymentReference || '',
    };

    const { error } = await supabase
      .from('bookings')
      .upsert(record, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase upsert booking warning:', error.message);
    }
  } catch (err) {
    console.error('Supabase saveBooking error:', err);
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
 * Insert a new completed booking row directly into Supabase bookings table
 */
export async function insertBookingToSupabase(params: CreateBookingParams): Promise<{ data: any; error: any }> {
  try {
    const bookingId = params.id || `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record: Record<string, any> = {
      id: bookingId,
      listing_id: params.listingId,
      listing_title: params.listingTitle || '',
      listing_photo: params.listingPhoto || '',
      property_type: params.propertyType || '',
      state: params.state || '',
      city_area: params.cityArea || '',
      street_address: params.streetAddress || '',
      host_full_name: params.hostFullName || 'Host Partner',
      host_whatsapp: params.hostWhatsApp || '',
      host_email: params.hostEmail?.toLowerCase() || '',
      guest_full_name: params.guestFullName,
      guest_email: params.guestEmail?.toLowerCase(),
      guest_phone: params.guestPhone || '',
      check_in_date: params.checkInDate,
      check_out_date: params.checkOutDate,
      guests_count: params.guestsCount,
      total_amount: params.totalAmount,
      total_price: params.totalPrice ?? params.totalAmount,
      nights: params.nights,
      payment_reference: params.paymentReference,
      payment_status: params.paymentStatus || 'completed',
      booked_at: new Date().toISOString(),
      status: params.status || 'confirmed',
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert([record])
      .select();

    if (error) {
      console.warn('Supabase direct insert booking warning:', error.message);
      // Fallback to upsert
      const { error: upsertErr } = await supabase
        .from('bookings')
        .upsert(record, { onConflict: 'id' });
      if (upsertErr) {
        console.warn('Supabase upsert booking fallback warning:', upsertErr.message);
      }
      return { data: [record], error: null };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('Supabase insertBookingToSupabase error:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch all bookings for a specific listing from Supabase
 */
export async function getBookingsForListing(listingId: string): Promise<GuestBooking[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('listing_id', listingId);

    if (error) {
      console.warn('Supabase getBookingsForListing warning:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
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
  } catch (err) {
    console.error('Supabase getBookings error:', err);
    return [];
  }
}


/**
 * Fetch all bookings across all listings from Supabase (for Admin)
 */
export async function getAllBookingsFromSupabase(): Promise<GuestBooking[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('booked_at', { ascending: false });

    if (error) {
      console.warn('Supabase getAllBookings warning:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
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
      totalPrice: Number(row.total_price || row.total_amount || 0),
      totalAmount: Number(row.total_amount || row.total_price || 0),
      nights: Number(row.nights || 1),
      bookedAt: row.booked_at,
      status: row.status || 'confirmed',
      paymentStatus: row.payment_status || 'completed',
      paymentReference: row.payment_reference || '',
    }));
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
      isBooked: row.is_booked,
      createdAt: row.created_at,
      verificationNotes: row.verification_notes,
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
  });

  const channel = supabase
    .channel('public:payout_settings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payout_settings' }, () => {
      getAllPayoutDetailsFromSupabase().then(onUpdate);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to Real-Time Listings from Supabase
 */
export function subscribeToListings(onUpdate: (listings: PropertyListing[]) => void): () => void {
  // Initial fetch
  supabase
    .from('listings')
    .select('*')
    .then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        const mapped = data.map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          propertyType: row.property_type,
          pricePerDay: Number(row.price_per_day),
          state: row.state,
          cityArea: row.city_area,
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
          isBooked: row.is_booked,
          createdAt: row.created_at,
          verificationNotes: row.verification_notes,
          rejectionReason: row.rejection_reason,
        }));
        onUpdate(mapped);
      }
    });

  const channel = supabase
    .channel('public:listings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
      // Re-fetch all on change
      supabase
        .from('listings')
        .select('*')
        .then(({ data, error }) => {
          if (!error && data) {
            const mapped = data.map((row: any) => ({
              id: row.id,
              title: row.title,
              description: row.description,
              propertyType: row.property_type,
              pricePerDay: Number(row.price_per_day),
              state: row.state,
              cityArea: row.city_area,
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
              isBooked: row.is_booked,
              createdAt: row.created_at,
              verificationNotes: row.verification_notes,
              rejectionReason: row.rejection_reason,
            }));
            onUpdate(mapped);
          }
        });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to Real-Time Bookings from Supabase
 */
export function subscribeToBookings(onUpdate: (bookings: GuestBooking[]) => void): () => void {
  const mapBookingRow = (row: any): GuestBooking => ({
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
    totalPrice: Number(row.total_price || row.total_amount || 0),
    totalAmount: Number(row.total_amount || row.total_price || 0),
    nights: Number(row.nights || 1),
    bookedAt: row.booked_at,
    status: row.status || 'confirmed',
    paymentStatus: row.payment_status || 'completed',
    paymentReference: row.payment_reference || '',
  });

  // Initial fetch
  supabase
    .from('bookings')
    .select('*')
    .order('booked_at', { ascending: false })
    .then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        onUpdate(data.map(mapBookingRow));
      }
    });

  const channel = supabase
    .channel('public:bookings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
      supabase
        .from('bookings')
        .select('*')
        .order('booked_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            onUpdate(data.map(mapBookingRow));
          }
        });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
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
    .then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        onUpdate(data.map((r: any) => r.email));
      }
    });

  const channel = supabase
    .channel('public:admin_emails')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_emails' }, () => {
      supabase
        .from('admin_emails')
        .select('email')
        .then(({ data, error }) => {
          if (!error && data) {
            onUpdate(data.map((r: any) => r.email));
          }
        });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Aliases for compatibility
export const getUserFromFirestore = getUserFromSupabase;
export const getUserByEmailFromFirestore = getUserByEmailFromSupabase;
export const saveUserDocToFirestore = saveUserDocToSupabase;
export const syncUserToFirestore = syncUserToSupabase;
export const saveListingToFirestore = saveListingToSupabase;
export const updateListingInFirestore = updateListingInSupabase;
export const deleteListingFromFirestore = deleteListingFromSupabase;
export const saveBookingToFirestore = saveBookingToSupabase;
export const saveAdminEmailToFirestore = saveAdminEmailToSupabase;
export const deleteAdminEmailFromFirestore = deleteAdminEmailFromSupabase;
export const savePayoutDetailsToFirestore = savePayoutDetailsToSupabase;
