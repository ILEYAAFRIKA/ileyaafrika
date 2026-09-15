export type UserRole = 'guest' | 'host' | 'admin' | 'master_admin';
export type AuthMode = 'signup' | 'login' | 'reset-password';

export interface AuthFormData {
  fullName?: string;
  email: string;
  password?: string;
  role: UserRole;
  mode: AuthMode;
}

export interface UserSession {
  uid?: string;
  fullName: string;
  email: string;
  role: UserRole;
  isMasterAdmin?: boolean;
  isAuthenticated: boolean;
  emailVerified?: boolean;
}

export interface RegisteredUser {
  uid?: string;
  id?: string;
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt?: string;
}

export type ListingStatus = 
  | 'pending_verification' 
  | 'approved_live' 
  | 'rejected' 
  | 'delisted'
  | 'pending'
  | 'approved';

export type PropertyType = 
  | 'Entire Apartment'
  | 'Studio Apartment'
  | 'Duplex'
  | 'Penthouse'
  | 'Serviced Flat'
  | 'Townhouse'
  | 'Luxury Villa';

export interface BankPayoutDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  bvnOptional?: string;
  isVerified?: boolean;
}

export interface PropertyListing {
  id: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  pricePerDay: number; // in NGN (₦)
  state: string;
  cityArea: string;
  streetAddress: string;
  amenities: string[];
  photos: string[];
  images?: string[]; // Alias for photos compatibility
  image_url?: string; // Direct image URL alias for single-image mappings
  hostWhatsApp: string;
  hostFullName?: string;
  hostEmail?: string;
  hostBankDetails?: BankPayoutDetails;
  status: ListingStatus;
  isPhysicallyVerified?: boolean;
  verification_status?: 'pending' | 'verified' | 'rejected' | string;
  verificationStatus?: 'pending' | 'verified' | 'rejected' | string;
  verification_notes?: string;
  verificationNotes?: string;
  verification_evidence_urls?: string[];
  verificationEvidenceUrls?: string[];
  createdAt: string;
  rejectionReason?: string;
}

export type HostViewTab = 'listings' | 'new-listing' | 'payout-settings';
export type AdminViewTab = 'pending-verifications' | 'all-listings' | 'bookings' | 'admin-team';
export type GuestViewTab = 'explore' | 'my-bookings';

export interface GuestBooking {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPhoto: string;
  propertyType: string;
  state: string;
  cityArea: string;
  streetAddress: string;
  guestEmail?: string;
  guestFullName?: string;
  guestPhone?: string;
  guestUid?: string;
  hostFullName?: string;
  hostWhatsApp?: string;
  hostEmail?: string;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  totalPrice: number;
  totalAmount?: number;
  nights: number;
  bookedAt: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  paymentStatus?: 'completed' | 'pending' | 'failed' | string;
  paymentReference?: string;
  // Foreign key joined listing relationship
  listings?: {
    id?: string;
    title?: string;
    image_url?: string;
    photos?: string[];
    images?: string[];
    property_type?: string;
    state?: string;
    city_area?: string;
    city?: string;
    street_address?: string;
    price?: number;
    price_per_day?: number;
    host_full_name?: string;
    host_whatsapp?: string;
    host_email?: string;
    [key: string]: any;
  } | null;
}

export interface Review {
  id: string;
  listing_id: string;
  booking_id: string;
  guest_name: string;
  rating: number; // 1-5
  comment: string;
  created_at: string;
}
