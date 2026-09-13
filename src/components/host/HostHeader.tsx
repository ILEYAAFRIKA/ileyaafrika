import React from 'react';
import {
  Building2,
  PlusCircle,
  CreditCard,
  LayoutGrid,
  LogOut,
  ShieldCheck,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { HostViewTab, UserSession } from '../../types';
import { BrandLogo } from '../common/BrandLogo';

interface HostHeaderProps {
  activeTab: HostViewTab;
  onSelectTab: (tab: HostViewTab) => void;
  session: UserSession | null;
  onLogout: () => void;
}

export const HostHeader: React.FC<HostHeaderProps> = ({
  activeTab,
  onSelectTab,
  session,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FBF6EC]/95 backdrop-blur-md border-b border-[#1B4332]/10 transition-colors w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4">
          {/* Logo and Partner Badge */}
          <div className="flex items-center gap-2 sm:gap-6 min-w-0 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 text-left group min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1B4332] flex items-center justify-center text-[#E8A33D] shadow-sm group-hover:scale-105 transition-transform shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <BrandLogo
                variant="light"
                badge="Host Partner"
                onClick={() => onSelectTab('listings')}
              />
            </div>

            {/* Navigation Tabs (Desktop) */}
            <nav className="hidden md:flex items-center gap-1 ml-4 border-l border-[#1B4332]/10 pl-5 shrink-0">
              <button
                type="button"
                id="tab-my-listings"
                onClick={() => onSelectTab('listings')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'listings'
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'text-[#14231C] hover:bg-[#1B4332]/5'
                }`}
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span>My Listings</span>
              </button>

              <button
                type="button"
                id="tab-payout-settings"
                onClick={() => onSelectTab('payout-settings')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'payout-settings'
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'text-[#14231C] hover:bg-[#1B4332]/5'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Payout Settings</span>
              </button>
            </nav>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Host Identity Pill */}
            {session && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#1B4332]/10 text-xs shadow-xs min-w-0">
                <div className="w-6 h-6 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  {session.fullName ? session.fullName.charAt(0).toUpperCase() : 'H'}
                </div>
                <div className="text-left min-w-0">
                  <span className="font-bold text-[#14231C] block leading-none truncate max-w-36">{session.fullName || 'Host Partner'}</span>
                  <span className="text-[10px] text-[#6B756F] leading-none truncate max-w-36 block mt-0.5">{session.email}</span>
                </div>
              </div>
            )}

            {/* Prominent Gold CTA */}
            <button
              type="button"
              id="cta-create-new-listing"
              onClick={() => onSelectTab('new-listing')}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#14231C] bg-[#E8A33D] hover:bg-[#d99530] active:scale-[0.98] transition-all shadow-md shadow-[#E8A33D]/20 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">+ Create New Listing</span>
              <span className="sm:hidden">+ New</span>
            </button>

            {/* Sign Out */}
            <button
              type="button"
              id="host-signout-btn"
              onClick={onLogout}
              title="Sign Out"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl border border-[#1B4332]/15 text-[#6B756F] hover:text-[#1B4332] hover:bg-white transition-all text-xs font-semibold cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around border-t border-[#1B4332]/10 py-2 w-full max-w-full overflow-x-hidden">
          <button
            type="button"
            onClick={() => onSelectTab('listings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${
              activeTab === 'listings' ? 'bg-[#1B4332] text-white' : 'text-[#14231C]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span>My Listings</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('payout-settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${
              activeTab === 'payout-settings' ? 'bg-[#1B4332] text-white' : 'text-[#14231C]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span>Payout Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
