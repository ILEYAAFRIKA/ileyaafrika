import React, { useState, useEffect, useMemo } from 'react';
import { AppProvider, useApp, MASTER_ADMIN_EMAIL } from './context/AppContext';
import { AuthPortal } from './components/AuthPortal';
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
} from 'lucide-react';

function MainApp() {
  const {
    currentUser,
    setCurrentUser,
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

  const loading = authLoading !== undefined ? authLoading : isAuthLoading;

  // Sync router with browser history & pathname
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const path = window.location.pathname;
    if (
      path === '/guest-dashboard' ||
      path === '/host-dashboard' ||
      path === '/admin-dashboard' ||
      path === '/host/new-listing' ||
      path === '/host/payout-settings'
    ) {
      return path;
    }
    return '/auth';
  });

  const [hostActiveTab, setHostActiveTab] = useState<HostViewTab>(() => {
    const path = window.location.pathname;
    if (path === '/host/new-listing') return 'new-listing';
    if (path === '/host/payout-settings') return 'payout-settings';
    return 'listings';
  });

  const navigateTo = (path: string) => {
    setCurrentRoute(path);
    if (path === '/host/new-listing') setHostActiveTab('new-listing');
    else if (path === '/host/payout-settings') setHostActiveTab('payout-settings');
    else if (path === '/host-dashboard') setHostActiveTab('listings');

    try {
      window.history.pushState({}, '', path);
    } catch {
      // Fallback for sandboxed iframe environments
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentRoute(path);
      if (path === '/host/new-listing') setHostActiveTab('new-listing');
      else if (path === '/host/payout-settings') setHostActiveTab('payout-settings');
      else if (path === '/host-dashboard') setHostActiveTab('listings');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update route on session changes
  useEffect(() => {
    if (!loading && currentUser?.isAuthenticated) {
      if (currentUser.role === 'master_admin' || currentUser.role === 'admin') {
        if (currentRoute === '/auth') setCurrentRoute('/admin-dashboard');
      } else if (currentUser.role === 'host') {
        if (currentRoute === '/auth') setCurrentRoute('/host-dashboard');
      } else if (currentUser.role === 'guest') {
        if (currentRoute === '/auth') setCurrentRoute('/guest-dashboard');
      }
    }
  }, [currentUser, loading, currentRoute]);

  // Handle successful login/signup from AuthPortal
  const handleAuthSuccess = (data: { role: UserRole; fullName: string; email: string }) => {
    const isMaster = data.role === 'master_admin' || data.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
    const userSession: UserSession = {
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      isMasterAdmin: isMaster,
      isAuthenticated: true,
    };
    setCurrentUser(userSession);

    if (data.role === 'master_admin' || data.role === 'admin') {
      navigateTo('/admin-dashboard');
    } else if (data.role === 'guest') {
      navigateTo('/guest-dashboard');
    } else {
      setHostActiveTab('listings');
      navigateTo('/host-dashboard');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigateTo('/auth');
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
    navigateTo('/auth');
  };

  // Host updates bank details
  const handleSaveBankDetails = (updated: BankPayoutDetails) => {
    updateBankDetails(updated);
  };

  // -------------------------------------------------------------
  // Dedicated Loading Barrier (Ensures role is fetched before render)
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF6EC] flex flex-col items-center justify-center p-6 text-[#14231C]">
        <div className="w-14 h-14 rounded-2xl bg-[#1B4332] flex items-center justify-center text-[#E8A33D] shadow-lg mb-4">
          <Loader2 className="w-7 h-7 animate-spin text-[#E8A33D]" />
        </div>
        <h2 className="text-xl font-bold font-serif text-[#1B4332]">Ileya Verified Stays</h2>
        <p className="text-xs text-[#6B756F] mt-1.5 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
          <span>Synchronizing verified session...</span>
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // View 1: Auth Portal (Root /auth or unauthenticated)
  // -------------------------------------------------------------
  if (!currentUser?.isAuthenticated || currentRoute === '/auth') {
    return (
      <AuthPortal
        onSuccess={handleAuthSuccess}
        currentPath={currentRoute}
        onNavigate={navigateTo}
        adminEmails={adminEmails}
      />
    );
  }

  // -------------------------------------------------------------
  // View 2: Full Admin Operations Dashboard (/admin-dashboard)
  // -------------------------------------------------------------
  if (
    currentUser.role === 'admin' ||
    currentUser.role === 'master_admin' ||
    currentRoute === '/admin-dashboard'
  ) {
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

  // -------------------------------------------------------------
  // View 3: Host Partner Portal (/host-dashboard)
  // -------------------------------------------------------------
  if (
    currentUser.role === 'host' ||
    currentRoute === '/host-dashboard' ||
    currentRoute === '/host/new-listing' ||
    currentRoute === '/host/payout-settings'
  ) {
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
              <span className="font-serif font-bold text-[#1B4332]">Ileya Host Portal</span>
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

  // -------------------------------------------------------------
  // View 4: Guest Discovery & Booking Experience (/guest-dashboard or default)
  // -------------------------------------------------------------
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
