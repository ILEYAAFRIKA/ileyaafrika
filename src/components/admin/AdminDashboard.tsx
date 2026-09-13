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
import { ShieldCheck, Database, Activity } from 'lucide-react';
import { SupabaseDiagnosticRoutine } from '../SupabaseDiagnosticRoutine';

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
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState<boolean>(false);
  const [diagnosticsRunKey, setDiagnosticsRunKey] = useState<number>(0);

  const currentAdminEmail = session?.email || masterAdminEmail;
  const isMasterAdmin =
    session?.role === 'master_admin' ||
    session?.isMasterAdmin === true ||
    currentAdminEmail.toLowerCase() === masterAdminEmail.toLowerCase();

  // Manual trigger for Supabase health check
  const handleRunDiagnostics = () => {
    setShowDiagnosticsModal(true);
    setDiagnosticsRunKey((prev) => prev + 1);
  };

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
        onRunDiagnostics={handleRunDiagnostics}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Master Admin System Health & Diagnostic Bar */}
        {isMasterAdmin && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-white border border-[#1B4332]/15 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center shrink-0 border border-[#1B4332]/10">
                <Database className="w-5 h-5 text-[#1B4332]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#1B4332]">Master Admin System Health & Database Diagnostics</h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#E8A33D]/20 text-[#1B4332] text-[10px] font-extrabold uppercase tracking-wide">
                    Master Admin
                  </span>
                </div>
                <p className="text-xs text-[#6B756F] mt-0.5">
                  Audit Supabase configuration, verify Row Level Security, bookings schema, and execute manual probe tests.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunDiagnostics}
              id="admin-run-system-diagnostics-btn"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B4332] hover:bg-[#143427] text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 border border-[#E8A33D]/40"
              title="Manually trigger system and database diagnostics"
            >
              <Activity className="w-4 h-4 text-[#E8A33D]" />
              <span>Run System Diagnostics</span>
            </button>
          </div>
        )}

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
            onOpenDiagnostics={handleRunDiagnostics}
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

      {/* Master Admin Diagnostics Modal (Manual Trigger Only, Does Not Run Automatically) */}
      <SupabaseDiagnosticRoutine
        isOpen={showDiagnosticsModal}
        onClose={() => setShowDiagnosticsModal(false)}
        autoRunOnMount={false}
        triggerRunTimestamp={diagnosticsRunKey}
        showFloatingTrigger={false}
      />

      {/* Admin Footer */}
      <footer className="border-t border-[#1B4332]/10 bg-white/60 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B756F]">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-[#1B4332]">Ileya Afrika Operations Control</span>
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
