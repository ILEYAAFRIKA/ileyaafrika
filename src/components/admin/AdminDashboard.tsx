import React, { useState } from 'react';
import { AdminHeader } from './AdminHeader';
import { PendingVerificationsTab } from './PendingVerificationsTab';
import { AllListingsTab } from './AllListingsTab';
import { AdminBookingsManager } from './AdminBookingsManager';
import { AdminTeamTab } from './AdminTeamTab';
import {
  AdminViewTab,
  PropertyListing,
  UserSession,
  ListingStatus
} from '../../types';
import { useApp } from '../../context/AppContext';
import { ShieldCheck } from 'lucide-react';

interface AdminDashboardProps {
  session: UserSession | null;
  listings: PropertyListing[];
  adminEmails: string[];
  masterAdminEmail?: string;
  onLogout: () => void;
  onApproveListing: (id: string, inspectionNotes?: string) => void;
  onRejectListing: (id: string, reason: string) => void;
  onToggleBookingStatus: (id: string) => void;
  onDeleteListing: (id: string) => void;
  onUpdateListingStatus: (id: string, status: ListingStatus) => void;
  onAddAdmin: (email: string) => void;
  onRevokeAdmin: (email: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  session,
  listings,
  adminEmails,
  masterAdminEmail = 'emmanuelolarinde53@gmail.com',
  onLogout,
  onApproveListing,
  onRejectListing,
  onToggleBookingStatus,
  onDeleteListing,
  onUpdateListingStatus,
  onAddAdmin,
  onRevokeAdmin,
}) => {
  const { myBookings } = useApp();
  const [activeTab, setActiveTab] = useState<AdminViewTab>('pending-verifications');

  const currentAdminEmail = session?.email || masterAdminEmail;
  const isMasterAdmin =
    session?.role === 'master_admin' ||
    session?.isMasterAdmin === true ||
    currentAdminEmail.toLowerCase() === masterAdminEmail.toLowerCase();

  // If a non-master admin somehow lands on 'admin-team', reset to pending-verifications
  const safeActiveTab = (!isMasterAdmin && activeTab === 'admin-team') ? 'pending-verifications' : activeTab;

  const pendingListings = listings.filter((l) => l.status === 'pending_verification' || l.status === 'pending');

  return (
    <div className="min-h-screen bg-[#FBF6EC] text-[#14231C] flex flex-col">
      {/* Admin Top Navigation Header */}
      <AdminHeader
        activeTab={safeActiveTab}
        onSelectTab={setActiveTab}
        session={session}
        pendingCount={pendingListings.length}
        totalListingsCount={listings.length}
        adminCount={adminEmails.length}
        bookingsCount={myBookings.length}
        isMasterAdmin={isMasterAdmin}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {safeActiveTab === 'pending-verifications' && (
          <PendingVerificationsTab
            pendingListings={pendingListings}
            onApproveListing={onApproveListing}
            onRejectListing={onRejectListing}
          />
        )}

        {safeActiveTab === 'all-listings' && (
          <AllListingsTab
            listings={listings}
            onToggleBookingStatus={onToggleBookingStatus}
            onDeleteListing={onDeleteListing}
            onUpdateListingStatus={onUpdateListingStatus}
          />
        )}

        {safeActiveTab === 'bookings' && (
          <AdminBookingsManager
            listings={listings}
          />
        )}

        {safeActiveTab === 'admin-team' && isMasterAdmin && (
          <AdminTeamTab
            adminEmails={adminEmails}
            masterAdminEmail={masterAdminEmail}
            currentAdminEmail={currentAdminEmail}
            onAddAdmin={onAddAdmin}
            onRevokeAdmin={onRevokeAdmin}
          />
        )}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-[#1B4332]/10 bg-white/60 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B756F]">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-[#1B4332]">Ileya Operations Control</span>
            <span>•</span>
            <span>Physical Quality Assurance & Settlement Security</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
            <span>Authorized Operations Session</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
