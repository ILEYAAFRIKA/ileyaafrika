import React, { useState, useEffect, useMemo } from 'react';
import { AppProvider, useApp, MASTER_ADMIN_EMAIL } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './components/Home';
import { ListingDetails } from './components/ListingDetails';
import { HostLanding } from './components/HostLanding';
import { Login } from './components/Login';
import { SignUp } from './components/SignUp';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { UpdatePassword } from './components/auth/UpdatePassword';
import { HostHeader } from './components/host/HostHeader';
import { HostDashboardOverview } from './components/host/HostDashboardOverview';
import { ListingCreationForm } from './components/host/ListingCreationForm';
import { HostPayoutSettings } from './components/host/HostPayoutSettings';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { GuestDashboard } from './components/guest/GuestDashboard';
import {
  UserRole,
  UserSession,
  PropertyListing,
  BankPayoutDetails,
  HostViewTab,
  ListingStatus,
  GuestBooking
} from './types';
import {
  ShieldCheck,
  Building2,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { INITIAL_VERIFIED_LISTINGS } from './data/nigerianData';

/**
 * Route Normalizer
 * Keeps root '/' public, handles authentication support routes,
 * dynamic listing details routes, and dashboard boundaries.
 */
function normalizeRoute(path: string): string {
  if (!path || path === '' || path === '/') return '/';
  if (path === '/login' || path === '/auth') return '/login';
  if (path === '/signup' || path === '/register') return '/signup';
  if (path === '/host-landing' || path === '/become-a-host') return '/host-landing';
  if (path === '/forgot-password' || path === '/reset-password') return '/forgot-password';
  if (path === '/update-password') return '/update-password';
  if (path.startsWith('/listing/')) return path;
  if (path === '/guest' || path === '/guest-dashboard') return '/guest-dashboard';
  if (path === '/host' || path === '/host-dashboard') return '/host-dashboard';
  if (path.startsWith('/host/')) return path;
  if (path === '/admin' || path === '/admin-dashboard') return '/admin-dashboard';
  return path;
}

function getDashboardForRole(role?: UserRole): string {
  if (role === 'master_admin' || role === 'admin') return '/admin-dashboard';
  if (role === 'host') return '/host-dashboard';
  return '/guest-dashboard';
}

function MainApp() {
  const {
    currentUser,
    setCurrentUser,
    isLoading,
    authLoading,
    isAuthLoading,
    listings,
    addListing,
    approveListing,
    rejectListing,
    deleteListing,
    toggleBookingStatus,
    updateListingStatus,
    adminEmails,
    addAdmin,
    revokeAdmin,
    bankDetails,
    updateBankDetails,
    logoutUser,
    addBooking,
  } = useApp();

  const loading = isLoading !== undefined ? isLoading : (authLoading !== undefined ? authLoading : isAuthLoading);

  // Sync router with browser history & pathname (Defaults to public root '/')
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return normalizeRoute(window.location.pathname);
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Direct fetch fallback for /listing/:id if listing is not in memory
  const [directListing, setDirectListing] = useState<PropertyListing | null>(null);

  const [hostActiveTab, setHostActiveTab] = useState<HostViewTab>(() => {
    const path = window.location.pathname;
    if (path === '/host/new-listing') return 'new-listing';
    if (path === '/host/payout-settings') return 'payout-settings';
    return 'listings';
  });

  const navigateTo = (path: string) => {
    const normalized = normalizeRoute(path);
    setCurrentRoute(normalized);
    if (normalized === '/host/new-listing') setHostActiveTab('new-listing');
    else if (normalized === '/host/payout-settings') setHostActiveTab('payout-settings');
    else if (normalized === '/host-dashboard') setHostActiveTab('listings');

    try {
      window.history.pushState({}, '', normalized);
    } catch {
      // Fallback for sandboxed environments
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const normalized = normalizeRoute(window.location.pathname);
      setCurrentRoute(normalized);
      if (normalized === '/host/new-listing') setHostActiveTab('new-listing');
      else if (normalized === '/host/payout-settings') setHostActiveTab('payout-settings');
      else if (normalized === '/host-dashboard') setHostActiveTab('listings');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isAuthenticated = !!(currentUser && currentUser.isAuthenticated);

  // Definition of Public Routes (No Auth Required)
  const isPublicRoute =
    currentRoute === '/' ||
    currentRoute.startsWith('/listing/') ||
    currentRoute === '/host-landing' ||
    currentRoute === '/login' ||
    currentRoute === '/signup' ||
    currentRoute === '/forgot-password' ||
    currentRoute === '/update-password';

  // 1. Strict Authentication Guard for Protected Routes ONLY
  // Unauthenticated users are allowed to browse public routes freely.
  // Only redirect to /login if they attempt to access protected dashboards without a session.
  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated && !isPublicRoute) {
      navigateTo('/login');
    }
  }, [loading, isAuthenticated, isPublicRoute, currentRoute]);

  // Direct Listing Resolution for /listing/:id
  useEffect(() => {
    if (currentRoute.startsWith('/listing/')) {
      const listingId = currentRoute.replace('/listing/', '').split('?')[0].split('/')[0];
      const found = listings.find((l) => l.id === listingId) || INITIAL_VERIFIED_LISTINGS.find((l) => l.id === listingId);
      if (found) {
        setDirectListing(found);
      } else {
        // Fetch from Supabase
        supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .maybeSingle()
          .then(({ data, error }) => {
            if (data && !error) {
              setDirectListing({
                id: data.id,
                title: data.title || 'Verified Property',
                description: data.description || '',
                propertyType: data.property_type || 'Apartment',
                pricePerDay: Number(data.price_per_day || data.price || 0),
                state: data.state || 'Lagos',
                cityArea: data.city_area || data.city || '',
                streetAddress: data.street_address || '',
                amenities: Array.isArray(data.amenities) ? data.amenities : [],
                photos: Array.isArray(data.photos) && data.photos.length > 0 ? data.photos : (Array.isArray(data.images) ? data.images : []),
                images: Array.isArray(data.images) && data.images.length > 0 ? data.images : (Array.isArray(data.photos) ? data.photos : []),
                hostWhatsApp: data.host_whatsapp || '+2348000000000',
                hostFullName: data.host_full_name || 'Verified Host',
                hostEmail: data.host_email || '',
                status: data.status || 'approved',
                isPhysicallyVerified: data.is_physically_verified ?? true,
                verification_status: data.verification_status || 'verified',
                verificationNotes: data.verification_notes || '',
                verificationEvidenceUrls: Array.isArray(data.verification_evidence_urls) ? data.verification_evidence_urls : [],
                createdAt: data.created_at || new Date().toISOString(),
              });
            }
          });
      }
    } else {
      setDirectListing(null);
    }
  }, [currentRoute, listings]);

  // Handle successful login/signup from AuthPortal
  const handleAuthSuccess = (data: { role?: UserRole; fullName: string; email: string }) => {
    const userRole = data?.role || 'guest';
    const isMaster = userRole === 'master_admin' || (data?.email && data.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase());
    const userSession: UserSession = {
      fullName: data?.fullName || '',
      email: data?.email || '',
      role: userRole,
      isMasterAdmin: isMaster,
      isAuthenticated: true,
    };
    setCurrentUser(userSession);

    const targetDashboard = getDashboardForRole(userRole);
    if (userRole === 'host') {
      setHostActiveTab('listings');
    }
    navigateTo(targetDashboard);
  };

  const handleLogout = async () => {
    await logoutUser();
    navigateTo('/');
  };

  // Filter listings for current host
  const hostUserListings = useMemo(() => {
    if (!currentUser?.email) return listings;
    const email = currentUser.email.toLowerCase();
    return listings.filter((l) => !l.hostEmail || l.hostEmail.toLowerCase() === email);
  }, [listings, currentUser?.email]);

  // Host tab switcher
  const handleHostTabSelect = (tab: HostViewTab) => {
    setHostActiveTab(tab);
    if (tab === 'listings') navigateTo('/host-dashboard');
    else if (tab === 'new-listing') navigateTo('/host/new-listing');
    else if (tab === 'payout-settings') navigateTo('/host/payout-settings');
  };

  // Host creates a new listing
  const handleAddNewListing = (newListing: PropertyListing) => {
    addListing(newListing);
    setHostActiveTab('listings');
    navigateTo('/host-dashboard');
  };

  const handleDeleteListing = (id: string) => {
    deleteListing(id);
  };

  const handleDeleteAccount = async () => {
    await logoutUser();
    navigateTo('/');
  };

  const handleSaveBankDetails = (updated: BankPayoutDetails) => {
    updateBankDetails(updated);
  };

  // Booking completion handler from ListingDetails
  const handleConfirmBookingFromDetails = (bookingData: {
    listingId: string;
    listingTitle: string;
    checkInDate: string;
    checkOutDate: string;
    guestsCount: number;
    totalAmount: number;
  }) => {
    if (!currentUser) {
      navigateTo('/login');
      return;
    }

    const activeListing = listings.find((l) => l.id === bookingData.listingId) || directListing;
    const nights = Math.max(
      1,
      Math.ceil(
        (new Date(bookingData.checkOutDate).getTime() - new Date(bookingData.checkInDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    const newBooking: GuestBooking = {
      id: `bk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      listingId: bookingData.listingId,
      listingTitle: bookingData.listingTitle,
      listingPhoto: activeListing?.photos?.[0] || activeListing?.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      propertyType: activeListing?.propertyType || 'Apartment',
      state: activeListing?.state || 'Lagos',
      cityArea: activeListing?.cityArea || 'Lekki',
      streetAddress: activeListing?.streetAddress || '',
      guestEmail: currentUser.email || '',
      guestFullName: currentUser.fullName || currentUser.email || 'Guest',
      guestUid: currentUser.uid || '',
      checkInDate: bookingData.checkInDate,
      checkOutDate: bookingData.checkOutDate,
      guestsCount: bookingData.guestsCount,
      nights,
      totalPrice: bookingData.totalAmount,
      totalAmount: bookingData.totalAmount,
      bookedAt: new Date().toISOString(),
      status: 'confirmed',
    };

    try {
      addBooking(newBooking);
      setToastMsg(`Reservation confirmed for "${bookingData.listingTitle}"!`);
      setTimeout(() => setToastMsg(null), 5000);
      navigateTo('/guest-dashboard');
    } catch (err) {
      console.warn('Booking save notice:', err);
      navigateTo('/guest-dashboard');
    }
  };

  // -------------------------------------------------------------
  // Loading Barrier on Initial Auth Check
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-gray-900">
        <div className="w-12 h-12 rounded-2xl bg-[#1B4332] flex items-center justify-center text-[#E8A33D] shadow-md mb-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#E8A33D]" />
        </div>
        <p className="text-xs text-gray-500 font-medium">Loading Ileya Afrika...</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Dynamic Route Content Renderer
  // -------------------------------------------------------------
  const renderRouteContent = () => {
    // 1. PUBLIC ROUTE: Root Homepage (/)
    if (currentRoute === '/') {
      return (
        <Home
          onSelectListing={(listing: PropertyListing) => navigateTo(`/listing/${listing.id}`)}
          onNavigate={navigateTo}
        />
      );
    }

    // 2. PUBLIC ROUTE: Listing Details (/listing/:id)
    if (currentRoute.startsWith('/listing/')) {
      const listingId = currentRoute.replace('/listing/', '').split('?')[0].split('/')[0];
      const activeListing = directListing || listings.find((l) => l.id === listingId) || INITIAL_VERIFIED_LISTINGS[0];

      return (
        <ListingDetails
          listing={activeListing}
          user={currentUser}
          onClose={() => navigateTo('/')}
          onNavigate={navigateTo}
          onConfirmBooking={handleConfirmBookingFromDetails}
        />
      );
    }

    // 3. PUBLIC ROUTE: Host Landing Page (/host-landing)
    if (currentRoute === '/host-landing') {
      return <HostLanding onNavigate={navigateTo} user={currentUser} />;
    }

    // 4. PUBLIC ROUTE: Forgot Password (/forgot-password)
    if (currentRoute === '/forgot-password') {
      return <ForgotPassword onNavigate={navigateTo} />;
    }

    // 5. PUBLIC ROUTE: Update Password (/update-password)
    if (currentRoute === '/update-password') {
      return (
        <UpdatePassword
          onNavigate={navigateTo}
          onSuccessToast={(msg) => {
            setToastMsg(msg);
            setTimeout(() => setToastMsg(null), 6000);
          }}
        />
      );
    }

    // 6. PUBLIC ROUTE: Dedicated Login Page (/login)
    if (currentRoute === '/login' || currentRoute === '/auth') {
      return (
        <Login
          onNavigate={navigateTo}
          onSuccess={handleAuthSuccess}
        />
      );
    }

    // 7. PUBLIC ROUTE: Dedicated Registration Page (/signup)
    if (currentRoute === '/signup' || currentRoute === '/register') {
      return (
        <SignUp
          onNavigate={navigateTo}
          onSuccess={handleAuthSuccess}
        />
      );
    }

    // -----------------------------------------------------------
    // PROTECTED ROUTES (Requires Authentication)
    // -----------------------------------------------------------
    if (!isAuthenticated) {
      return (
        <Login
          onNavigate={navigateTo}
          onSuccess={handleAuthSuccess}
        />
      );
    }

    // A. Protected Route: Admin Operations Control (/admin-dashboard)
    if (currentRoute === '/admin-dashboard' || currentRoute === '/admin') {
      const isAuthorizedAdmin =
        currentUser?.role === 'admin' ||
        currentUser?.role === 'master_admin' ||
        (currentUser?.email && currentUser.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase());

      if (!isAuthorizedAdmin) {
        // Non-admin redirect
        return (
          <GuestDashboard
            session={currentUser}
            listings={listings}
            onLogout={handleLogout}
            onBookListing={toggleBookingStatus}
          />
        );
      }

      return (
        <AdminDashboard
          session={currentUser}
          listings={listings}
          adminEmails={adminEmails}
          masterAdminEmail={MASTER_ADMIN_EMAIL}
          onLogout={handleLogout}
          onApproveListing={approveListing}
          onRejectListing={rejectListing}
          onToggleBookingStatus={toggleBookingStatus}
          onDeleteListing={handleDeleteListing}
          onUpdateListingStatus={updateListingStatus}
          onAddAdmin={addAdmin}
          onRevokeAdmin={revokeAdmin}
        />
      );
    }

    // B. Protected Route: Host Partner Portal (/host-dashboard or /host/*)
    if (
      currentRoute === '/host-dashboard' ||
      currentRoute === '/host' ||
      currentRoute.startsWith('/host/')
    ) {
      return (
        <div className="bg-[#FBF6EC] min-h-[calc(100vh-140px)] text-[#14231C] flex flex-col">
          <HostHeader
            activeTab={hostActiveTab}
            onSelectTab={handleHostTabSelect}
            session={currentUser}
            onLogout={handleLogout}
          />

          <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {hostActiveTab === 'listings' && (
              <HostDashboardOverview
                session={currentUser}
                listings={hostUserListings}
                bankDetails={bankDetails}
                onCreateListing={() => handleHostTabSelect('new-listing')}
                onNavigateToPayout={() => handleHostTabSelect('payout-settings')}
                onDeleteListing={handleDeleteListing}
                onDeleteAccount={handleDeleteAccount}
                onSaveBankDetails={handleSaveBankDetails}
              />
            )}

            {hostActiveTab === 'new-listing' && (
              <ListingCreationForm
                onCancel={() => handleHostTabSelect('listings')}
                onSubmitSuccess={handleAddNewListing}
                hostSession={currentUser}
                bankDetails={bankDetails}
              />
            )}

            {hostActiveTab === 'payout-settings' && (
              <HostPayoutSettings
                bankDetails={bankDetails}
                onSaveBankDetails={handleSaveBankDetails}
                onNavigateToListings={() => handleHostTabSelect('listings')}
              />
            )}
          </div>
        </div>
      );
    }

    // C. Protected Route: Guest Dashboard & Bookings (/guest-dashboard or /guest)
    if (currentRoute === '/guest-dashboard' || currentRoute === '/guest') {
      return (
        <GuestDashboard
          session={currentUser}
          listings={listings}
          onLogout={handleLogout}
          onBookListing={toggleBookingStatus}
        />
      );
    }

    // Fallback: Default to Public Homepage
    return (
      <Home
        onSelectListing={(listing: PropertyListing) => navigateTo(`/listing/${listing.id}`)}
        onNavigate={navigateTo}
      />
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-[#1B4332] selection:text-white">
      {/* Global Navbar (Wraps all routes) */}
      <Navbar
        user={currentUser}
        onNavigate={navigateTo}
        onLogout={handleLogout}
      />

      {/* Global Notification Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#1B4332] text-white shadow-2xl flex items-center gap-3 border border-[#E8A33D]/40 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-[#E8A33D]" />
          <p className="text-xs font-semibold">{toastMsg}</p>
        </div>
      )}

      {/* Main Routed Content Area */}
      <main className="flex-1">
        {renderRouteContent()}
      </main>

      {/* Global Footer (Wraps all routes) */}
      <Footer onNavigate={navigateTo} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
