import React, { useState, useEffect, useMemo } from 'react';
import { AppProvider, useApp, MASTER_ADMIN_EMAIL } from './context/AppContext';
import { AuthPortal } from './components/AuthPortal';
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
  ListingStatus
} from './types';
import {
  ShieldCheck,
  Building2,
  Loader2,
  CheckCircle2
} from 'lucide-react';

function normalizeRoute(path: string): string {
  if (!path || path === '/' || path === '') return '/login';
  if (path === '/login' || path === '/auth') return '/login';
  if (path === '/forgot-password' || path === '/reset-password') return '/forgot-password';
  if (path === '/update-password') return '/update-password';
  if (path === '/guest' || path === '/guest-dashboard') return '/guest-dashboard';
  if (path === '/host' || path === '/host-dashboard') return '/host-dashboard';
  if (path === '/admin' || path === '/admin-dashboard') return '/admin-dashboard';
  if (path.startsWith('/host/')) return path;
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
  } = useApp();

  const loading = isLoading !== undefined ? isLoading : (authLoading !== undefined ? authLoading : isAuthLoading);

  // Sync router with browser history & pathname (Defaults strictly to /login when unauthenticated)
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return normalizeRoute(window.location.pathname);
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
      // Fallback for sandboxed iframe environments
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

  const isPublicAuthRoute =
    currentRoute === '/login' ||
    currentRoute === '/auth' ||
    currentRoute === '/forgot-password' ||
    currentRoute === '/update-password';

  // 1. Strict Authentication Guard & 2. Role-Based Redirection Effect
  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      // 1. Strict Authentication Guard:
      // Allow access to public auth routes: /login, /forgot-password, /update-password.
      // If unauthenticated user tries to access protected dashboards, redirect to /login.
      if (!isPublicAuthRoute) {
        setCurrentRoute('/login');
        try {
          window.history.replaceState({}, '', '/login');
        } catch {
          // Fallback for sandboxed iframe environments
        }
      }
    } else {
      // 2. Role-Based Redirection:
      // If user is already logged in, evaluate their account type/role.
      // Automatically redirect to their respective dashboard so they don't have to log in again.
      // Allow /update-password so user can complete password update flow.
      const targetDashboard = getDashboardForRole(currentUser?.role);

      if (currentRoute === '/login' || currentRoute === '/auth' || currentRoute === '/' || currentRoute === '/forgot-password') {
        navigateTo(targetDashboard);
      } else if (currentRoute !== '/update-password') {
        // Enforce role-based access boundaries
        const role = currentUser?.role;
        const isGuest = role === 'guest';
        const isHost = role === 'host';
        const isAdmin = role === 'admin' || role === 'master_admin';

        if (isGuest && (currentRoute.startsWith('/host') || currentRoute.startsWith('/admin'))) {
          navigateTo('/guest-dashboard');
        } else if (isHost && (currentRoute.startsWith('/guest') || currentRoute.startsWith('/admin'))) {
          navigateTo('/host-dashboard');
        } else if (isAdmin && (currentRoute.startsWith('/guest') || currentRoute.startsWith('/host'))) {
          navigateTo('/admin-dashboard');
        }
      }
    }
  }, [loading, isAuthenticated, currentUser?.role, currentRoute]);

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
    navigateTo('/login');
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

  // Delete listing (used by both host and admin)
  const handleDeleteListing = (id: string) => {
    deleteListing(id);
  };

  // Host deletes entire account (Danger Zone)
  const handleDeleteAccount = async () => {
    await logoutUser();
    navigateTo('/login');
  };

  // Host updates bank details
  const handleSaveBankDetails = (updated: BankPayoutDetails) => {
    updateBankDetails(updated);
  };

  // -------------------------------------------------------------
  // 3. Loading Barrier (Prevents Route Flashing on Initial Auth Check)
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF6EC] flex flex-col items-center justify-center p-6 text-[#14231C]">
        <div className="w-14 h-14 rounded-2xl bg-[#1B4332] flex items-center justify-center text-[#E8A33D] shadow-lg mb-4">
          <Loader2 className="w-7 h-7 animate-spin text-[#E8A33D]" />
        </div>
        <h2 className="text-xl font-bold font-serif text-[#1B4332]">Ileya Afrika Verified Stays</h2>
        <p className="text-xs text-[#6B756F] mt-1.5 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
          <span>Verifying authentication session...</span>
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Public Authentication & Password Reset Routes
  // -------------------------------------------------------------

  // View: Forgot Password (/forgot-password)
  if (currentRoute === '/forgot-password') {
    return <ForgotPassword onNavigate={navigateTo} />;
  }

  // View: Update Password (/update-password)
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

  // -------------------------------------------------------------
  // 1. Strict Authentication Guard:
  // If unauthenticated or on login route, ALWAYS render the AuthPortal.
  // Unauthenticated users CANNOT see Guest, Host, or Admin dashboards.
  // -------------------------------------------------------------
  if (!isAuthenticated || currentRoute === '/login' || currentRoute === '/auth') {
    return (
      <AuthPortal
        onSuccess={handleAuthSuccess}
        currentPath="/login"
        onNavigate={navigateTo}
        adminEmails={adminEmails}
        initialSuccessMsg={toastMsg}
      />
    );
  }

  // -------------------------------------------------------------
  // 2. Role-Based Dashboard Redirection & Access Enforcement
  // -------------------------------------------------------------

  // View A: Master Admin & Operational Admin Portal
  if (currentUser?.role === 'admin' || currentUser?.role === 'master_admin') {
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

  // View B: Host Partner Portal
  if (currentUser?.role === 'host') {
    return (
      <div className="min-h-screen bg-[#FBF6EC] text-[#14231C] flex flex-col">
        {/* Top Host Navigation Header */}
        <HostHeader
          activeTab={hostActiveTab}
          onSelectTab={handleHostTabSelect}
          session={currentUser}
          onLogout={handleLogout}
        />

        {/* Main Content Area based on Host Tab */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </main>

        {/* Host Footer */}
        <footer className="border-t border-[#1B4332]/10 bg-white/60 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B756F]">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-[#1B4332]">Ileya Afrika Host Portal</span>
              <span>•</span>
              <span>Physical Inspection Operations: Lagos • Abuja • Port Harcourt • Ibadan</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
              <span>Encrypted Direct NUBAN Settlements</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // View C: Verified Guest Experience (Only for authenticated users with 'guest' role)
  return (
    <GuestDashboard
      session={currentUser}
      listings={listings}
      onLogout={handleLogout}
      onBookListing={toggleBookingStatus}
    />
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
