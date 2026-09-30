import React from 'react';
import {
  ClipboardList,
  Layers,
  Calendar,
  Users,
  Activity
} from 'lucide-react';
import { AdminViewTab, UserSession } from '../../types';

interface AdminHeaderProps {
  activeTab: AdminViewTab;
  onSelectTab: (tab: AdminViewTab) => void;
  session: UserSession | null;
  pendingCount: number;
  totalListingsCount: number;
  adminCount: number;
  bookingsCount?: number;
  isMasterAdmin: boolean;
  onLogout?: () => void;
  onRunDiagnostics?: () => void;
}

/**
 * AdminHeader: Local Dashboard Tab Menu
 * Minimalist design system:
 * - Clean white background with subtle gray bottom border (border-b border-gray-200)
 * - Inactive tabs: gray text (text-gray-500 hover:text-gray-700), no colored backgrounds
 * - Active tabs: brand green indicator ONLY (text-[#1B4332] border-b-2 border-[#1B4332])
 * - Generous whitespace and breathing room (gap-8, pb-2)
 * - No duplicate logos or global logout buttons (handled globally by Navbar.jsx)
 */
export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  onSelectTab,
  pendingCount,
  totalListingsCount,
  adminCount,
  bookingsCount = 0,
  isMasterAdmin,
  onRunDiagnostics,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 w-full font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 pb-4 gap-3">
          <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">
              Admin Operations
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Physical verification audit queue, property directory, and platform governance.
            </p>
          </div>

          {isMasterAdmin && onRunDiagnostics && (
            <button
              type="button"
              onClick={onRunDiagnostics}
              id="admin-header-diagnostics-btn"
              className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
              title="Open and Run Supabase System Diagnostics"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-700" />
              <span>System Diagnostics</span>
            </button>
          )}
        </div>

        {/* Sleek Horizontal Tab Menu (Strict Color System) */}
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
          {/* Tab 1: Pending Verifications */}
          <button
            type="button"
            onClick={() => onSelectTab('pending-verifications')}
            id="tab-pending-verifications"
            className={`pb-3 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'pending-verifications'
                ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Pending Verifications</span>
            <span className="text-[10px] text-gray-400 font-mono">({pendingCount})</span>
            {pendingCount > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'pending-verifications'
                    ? 'bg-[#1B4332]/10 text-[#1B4332]'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>

          {/* Tab 2: All Listings */}
          <button
            type="button"
            onClick={() => onSelectTab('all-listings')}
            id="tab-all-listings"
            className={`pb-3 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'all-listings'
                ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Listings</span>
            <span className="text-[10px] text-gray-400 font-mono">({totalListingsCount})</span>
          </button>

          {/* Tab 3: Bookings */}
          <button
            type="button"
            onClick={() => onSelectTab('bookings')}
            id="tab-bookings"
            className={`pb-3 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Bookings</span>
            {bookingsCount > 0 && (
              <span className="text-[10px] text-gray-400 font-mono">({bookingsCount})</span>
            )}
          </button>

          {/* Tab 4: Admin Team (Master Admin only) */}
          {isMasterAdmin && (
            <button
              type="button"
              onClick={() => onSelectTab('admin-team')}
              id="tab-admin-team"
              className={`pb-3 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'admin-team'
                  ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Admin Team</span>
              <span className="text-[10px] text-gray-400 font-mono">({adminCount})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
