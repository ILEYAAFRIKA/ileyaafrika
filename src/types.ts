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
  hostWhatsApp: string;
  hostFullName?: string;
  hostEmail?: string;
  hostBankDetails?: BankPayoutDetails;
  status: ListingStatus;
  isPhysicallyVerified?: boolean;
  isBooked?: boolean;
  createdAt: string;
  verificationNotes?: string;
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
}
