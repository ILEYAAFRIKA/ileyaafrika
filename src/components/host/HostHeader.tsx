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
    <header className="sticky top-0 z-30 bg-[#FBF6EC]/95 backdrop-blur-md border-b border-[#1B4332]/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo and Partner Badge */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onSelectTab('listings')}
              className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1B4332] flex items-center justify-center text-[#E8A33D] shadow-sm group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold tracking-tight text-[#1B4332] font-serif">
                    Ileya
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8A33D]/20 text-[#1B4332] border border-[#E8A33D]/30">
                    Host Partner
                  </span>
                </div>
                <p className="text-[11px] text-[#6B756F] hidden sm:block">
                  Verified Short-Let Management
                </p>
              </div>
            </button>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 ml-4 border-l border-[#1B4332]/10 pl-5">
              <button
                type="button"
                id="tab-my-listings"
                onClick={() => onSelectTab('listings')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'listings'
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'text-[#14231C] hover:bg-[#1B4332]/5'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>My Listings</span>
              </button>

              <button
                type="button"
                id="tab-payout-settings"
                onClick={() => onSelectTab('payout-settings')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'payout-settings'
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'text-[#14231C] hover:bg-[#1B4332]/5'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Payout Settings</span>
              </button>
            </nav>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            {/* Host Identity Pill */}
            {session && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#1B4332]/10 text-xs shadow-xs">
                <div className="w-6 h-6 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-[10px]">
                  {session.fullName ? session.fullName.charAt(0).toUpperCase() : 'H'}
                </div>
                <div className="text-left">
                  <span className="font-bold text-[#14231C] block leading-none truncate max-w-[150px]">{session.fullName || 'Host Partner'}</span>
                  <span className="text-[10px] text-[#6B756F] leading-none truncate max-w-[150px] block mt-0.5">{session.email}</span>
                </div>
              </div>
            )}

            {/* Prominent Gold CTA */}
            <button
              type="button"
              id="cta-create-new-listing"
              onClick={() => onSelectTab('new-listing')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#14231C] bg-[#E8A33D] hover:bg-[#d99530] active:scale-[0.98] transition-all shadow-md shadow-[#E8A33D]/20 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Create New Listing</span>
            </button>

            {/* Sign Out */}
            <button
              type="button"
              id="host-signout-btn"
              onClick={onLogout}
              title="Sign Out"
              className="flex items-center gap-1.5 p-2.5 sm:px-3 sm:py-2 rounded-xl border border-[#1B4332]/15 text-[#6B756F] hover:text-[#1B4332] hover:bg-white transition-all text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around border-t border-[#1B4332]/10 py-2">
          <button
            type="button"
            onClick={() => onSelectTab('listings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'listings' ? 'bg-[#1B4332] text-white' : 'text-[#14231C]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>My Listings</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('payout-settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'payout-settings' ? 'bg-[#1B4332] text-white' : 'text-[#14231C]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payout Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
