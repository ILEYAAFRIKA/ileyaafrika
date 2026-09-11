import React from 'react';
import {
  Building2,
  ShieldCheck,
  ClipboardList,
  Layers,
  Users,
  LogOut,
  Sparkles,
  CreditCard
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
  onLogout: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  onSelectTab,
  session,
  pendingCount,
  totalListingsCount,
  adminCount,
  bookingsCount = 0,
  isMasterAdmin,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#1B4332] text-white border-b border-[#2D6A4F] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-[#E8A33D] shadow-sm border border-[#E8A33D]/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-serif text-white tracking-tight">
                  Ileya
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E8A33D] text-[#14231C]">
                  {isMasterAdmin ? 'Master Admin' : 'Operations Admin'}
                </span>
              </div>
              <p className="text-[11px] text-[#FBF6EC]/70 hidden sm:block">
                Physical Verification & Property Oversight Center
              </p>
            </div>
          </div>

          {/* User Email & Logout Action */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-white flex items-center justify-end gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#E8A33D]" />
                <span className="truncate max-w-[200px]">{session?.email || 'emmanuelolarinde53@gmail.com'}</span>
              </div>
              <span className="text-[11px] text-[#FBF6EC]/70">
                {isMasterAdmin ? 'Full Authorization' : 'Operations Staff'}
              </span>
            </div>

            <button
              onClick={onLogout}
              id="admin-signout-btn"
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar border-t border-[#2D6A4F]/60 pt-2 pb-2">
          {/* Tab 1: Pending Verifications */}
          <button
            type="button"
            onClick={() => onSelectTab('pending-verifications')}
            id="tab-pending-verifications"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'pending-verifications'
                ? 'bg-[#E8A33D] text-[#14231C] shadow-sm'
                : 'text-[#FBF6EC]/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Pending Verifications</span>
            {pendingCount > 0 ? (
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'pending-verifications'
                    ? 'bg-[#14231C] text-[#E8A33D]'
                    : 'bg-[#E8A33D] text-[#14231C]'
                }`}
              >
                {pendingCount}
              </span>
            ) : (
              <span className="text-[10px] opacity-60">0</span>
            )}
          </button>

          {/* Tab 2: All Listings (Geographical Directory) */}
          <button
            type="button"
            onClick={() => onSelectTab('all-listings')}
            id="tab-all-listings"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all-listings'
                ? 'bg-[#E8A33D] text-[#14231C] shadow-sm'
                : 'text-[#FBF6EC]/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Listings Directory</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === 'all-listings'
                  ? 'bg-[#14231C] text-[#E8A33D]'
                  : 'bg-white/15 text-white'
              }`}
            >
              {totalListingsCount}
            </span>
          </button>

          {/* Tab 3: Bookings Manager */}
          <button
            type="button"
            onClick={() => onSelectTab('bookings')}
            id="tab-bookings-manager"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-[#E8A33D] text-[#14231C] shadow-sm'
                : 'text-[#FBF6EC]/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Bookings Manager</span>
            {bookingsCount > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'bookings'
                    ? 'bg-[#14231C] text-[#E8A33D]'
                    : 'bg-[#E8A33D] text-[#14231C]'
                }`}
              >
                {bookingsCount}
              </span>
            )}
          </button>

          {/* Tab 4: Admin Team Management (Master Admin Only) */}
          {isMasterAdmin && (
            <button
              type="button"
              onClick={() => onSelectTab('admin-team')}
              id="tab-admin-team"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'admin-team'
                  ? 'bg-[#E8A33D] text-[#14231C] shadow-sm'
                  : 'text-[#FBF6EC]/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Admin Team Management</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'admin-team'
                    ? 'bg-[#14231C] text-[#E8A33D]'
                    : 'bg-white/15 text-white'
                }`}
              >
                {adminCount}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
