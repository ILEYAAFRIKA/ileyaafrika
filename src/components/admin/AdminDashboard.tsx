import React, { useState, useMemo, useEffect } from 'react';
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
import { supabase } from '../../lib/supabase';
import { ShieldCheck, Database, Activity } from 'lucide-react';
import { SupabaseDiagnosticRoutine } from '../SupabaseDiagnosticRoutine';

interface AdminDashboardProps {
  session: UserSession | null;
  listings: PropertyListing[];
  adminEmails: string[];
  masterAdminEmail?: string;
  onLogout: () => void;
  onApproveListing: (id: string, inspectionNotes?: string, evidenceUrls?: string[]) => void;
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

  // Local state for listings fetched with .neq('status', 'delisted')
  const [fetchedListings, setFetchedListings] = useState<PropertyListing[]>([]);

  // 1. Supabase data fetching function (inside useEffect): strictly excludes delisted properties
  useEffect(() => {
    let isMounted = true;

    async function fetchNonDelistedListings() {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .neq('status', 'delisted')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Error fetching admin listings without delisted:', error.message);
        } else if (data && isMounted) {
          const mapped: PropertyListing[] = data.map((row: any) => ({
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
            hostWhatsApp: row.host_whatsapp || '',
            hostFullName: row.host_full_name || 'Verified Host',
            hostEmail: row.host_email || '',
            status: row.status || 'pending',
            isPhysicallyVerified: row.is_physically_verified ?? (row.status === 'approved' || row.status === 'approved_live'),
            verification_status: row.verification_status || (row.status === 'approved' || row.status === 'approved_live' ? 'verified' : 'pending'),
            verificationStatus: row.verification_status || (row.status === 'approved' || row.status === 'approved_live' ? 'verified' : 'pending'),
            verification_notes: row.verification_notes || '',
            verificationNotes: row.verification_notes || '',
            verification_evidence_urls: Array.isArray(row.verification_evidence_urls) ? row.verification_evidence_urls : [],
            createdAt: row.created_at || new Date().toISOString(),
            rejectionReason: row.rejection_reason,
          }));
          setFetchedListings(mapped);
        }
      } catch (err) {
        console.error('Exception fetching non-delisted admin listings:', err);
      }
    }

    fetchNonDelistedListings();

    return () => {
      isMounted = false;
    };
  }, []);

  // Manual trigger for Supabase health check
  const handleRunDiagnostics = () => {
    setShowDiagnosticsModal(true);
    setDiagnosticsRunKey((prev) => prev + 1);
  };

  // If a non-master admin somehow lands on 'admin-team', reset to pending-verifications
  const safeActiveTab = (!isMasterAdmin && activeTab === 'admin-team') ? 'pending-verifications' : activeTab;

  // 2. Client-Side Filter (Fallback):
  // Ensure the array explicitly filters out delisted items: listings.filter(listing => listing.status !== 'delisted')
  const activeListings = useMemo(() => {
    const source = fetchedListings.length > 0 ? fetchedListings : (Array.isArray(listings) ? listings : []);
    return source.filter((listing) => listing && listing.status !== 'delisted');
  }, [fetchedListings, listings]);

  // Strict Dynamic Counts matching user instructions:
  // For "All Listings": activeListings.length (strictly non-delisted)
  // For "Pending Verifications": activeListings.filter(l => l.verification_status === 'pending').length
  const pendingListings = useMemo(() => {
    return activeListings.filter(
      (listing) =>
        (listing.verification_status === 'pending' ||
        listing.verificationStatus === 'pending') &&
        listing.status !== 'rejected'
    );
  }, [activeListings]);

  // 4. Sync Tab Counts:
  // Ensure the number displayed on the "All Listings" tab accurately counts only properties that are NOT delisted
  const pendingCount = pendingListings.length;
  const totalListingsCount = activeListings.length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      {/* Admin Tab Menu */}
      <AdminHeader
        activeTab={safeActiveTab}
        onSelectTab={setActiveTab}
        session={session}
        pendingCount={pendingCount}
        totalListingsCount={totalListingsCount}
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
            listings={activeListings}
            onToggleBookingStatus={onToggleBookingStatus}
            onDeleteListing={(id) => {
              setFetchedListings((prev) => prev.filter((item) => item.id !== id));
              onDeleteListing(id);
            }}
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
    </div>
  );
};

export default AdminDashboard;

