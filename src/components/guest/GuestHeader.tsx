import React, { useState } from 'react';
import {
  Building2,
  Compass,
  ShieldCheck,
  LogOut,
  LogIn,
  User,
  Luggage,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { UserSession, GuestViewTab } from '../../types';

interface GuestHeaderProps {
  activeTab: GuestViewTab;
  onSelectTab: (tab: GuestViewTab) => void;
  session: UserSession | null;
  onLogout: () => void;
  verifiedCount: number;
  availableCount: number;
  bookingsCount: number;
}

export const GuestHeader: React.FC<GuestHeaderProps> = ({
  activeTab,
  onSelectTab,
  session,
  onLogout,
  verifiedCount,
  availableCount,
  bookingsCount,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#1B4332]/10 shadow-xs w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#1B4332] flex items-center justify-center text-[#E8A33D] shadow-md shadow-[#1B4332]/20 shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xl font-bold font-serif tracking-tight text-[#1B4332] leading-none">
                Ileya
              </span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-[#E8A33D]/20 text-[#14231C] border border-[#E8A33D]/40 leading-none shrink-0">
                Guest Portal
              </span>
            </div>
            <p className="text-[11px] text-[#6B756F] hidden sm:block truncate mt-0.5">
              Physically Verified Nigerian Short-Lets & Serviced Apartments
            </p>
          </div>
        </div>

        {/* Center Tabbed Navigation: Explore vs My Bookings (Desktop) */}
        <nav className="hidden md:flex items-center p-1.5 rounded-2xl bg-[#FBF6EC] border border-[#1B4332]/10 shrink-0">
          <button
            type="button"
            id="tab-explore-btn"
            onClick={() => onSelectTab('explore')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'explore'
                ? 'bg-[#1B4332] text-white shadow-xs'
                : 'text-[#6B756F] hover:text-[#14231C] hover:bg-white/60'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>Explore</span>
          </button>

          <button
            type="button"
            id="tab-my-bookings-btn"
            onClick={() => onSelectTab('my-bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'my-bookings'
                ? 'bg-[#1B4332] text-white shadow-xs'
                : 'text-[#6B756F] hover:text-[#14231C] hover:bg-white/60'
            }`}
          >
            <Luggage className="w-4 h-4 shrink-0" />
            <span>My Bookings</span>
            {bookingsCount > 0 && (
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                  activeTab === 'my-bookings'
                    ? 'bg-[#E8A33D] text-[#14231C]'
                    : 'bg-[#2D6A4F] text-white'
                }`}
              >
                {bookingsCount}
              </span>
            )}
          </button>
        </nav>

        {/* User Profile, Action Buttons & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Desktop User Info */}
          <div className="hidden lg:flex flex-col text-right min-w-0">
            <span className="text-xs font-bold text-[#14231C] truncate max-w-36">
              {session?.fullName || 'Valued Guest'}
            </span>
            <span className="text-[11px] text-[#6B756F] truncate max-w-36">
              {session?.email || 'guest@ileya.ng'}
            </span>
          </div>

          <div className="hidden sm:flex w-9 h-9 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>

          <button
            type="button"
            onClick={onLogout}
            id="guest-logout-btn"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-[#1B4332]/20 text-[#1B4332] hover:bg-[#1B4332] hover:text-white transition-all cursor-pointer shadow-xs shrink-0"
            title={session?.isAuthenticated ? 'Sign Out of Ileya' : 'Sign In to Ileya'}
          >
            {session?.isAuthenticated ? (
              <>
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Sign Out</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>Sign In</span>
              </>
            )}
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            id="guest-mobile-menu-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-[#FBF6EC] border border-[#1B4332]/15 text-[#1B4332] hover:bg-[#1B4332]/10 transition-all cursor-pointer shrink-0"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 shrink-0" />
            ) : (
              <Menu className="w-5 h-5 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {isMobileMenuOpen && (
        <div
          id="guest-mobile-menu"
          className="md:hidden border-t border-[#1B4332]/10 bg-white/98 backdrop-blur-md px-4 py-3 space-y-3 w-full max-w-full overflow-x-hidden"
        >
          {/* Navigation buttons */}
          <div className="flex flex-col gap-1.5 w-full">
            <button
              type="button"
              id="mobile-tab-explore-btn"
              onClick={() => {
                onSelectTab('explore');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'bg-[#FBF6EC] text-[#14231C] hover:bg-[#1B4332]/5'
              }`}
            >
              <span className="flex items-center gap-2">
                <Compass className="w-4 h-4 shrink-0" />
                <span>Explore Verified Stays</span>
              </span>
            </button>

            <button
              type="button"
              id="mobile-tab-my-bookings-btn"
              onClick={() => {
                onSelectTab('my-bookings');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeTab === 'my-bookings'
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'bg-[#FBF6EC] text-[#14231C] hover:bg-[#1B4332]/5'
              }`}
            >
              <span className="flex items-center gap-2">
                <Luggage className="w-4 h-4 shrink-0" />
                <span>My Bookings</span>
              </span>
              {bookingsCount > 0 && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    activeTab === 'my-bookings'
                      ? 'bg-[#E8A33D] text-[#14231C]'
                      : 'bg-[#2D6A4F] text-white'
                  }`}
                >
                  {bookingsCount} {bookingsCount === 1 ? 'booking' : 'bookings'}
                </span>
              )}
            </button>
          </div>

          {/* Mobile User Profile & Logout */}
          <div className="pt-2.5 border-t border-[#1B4332]/10 flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 truncate">
                <span className="text-xs font-bold text-[#14231C] block truncate">
                  {session?.fullName || 'Valued Guest'}
                </span>
                <span className="text-[10px] text-[#6B756F] block truncate">
                  {session?.email || 'guest@ileya.ng'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onLogout();
              }}
              id="mobile-guest-logout-btn"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#1B4332]/5 border border-[#1B4332]/15 text-[#1B4332] hover:bg-[#1B4332] hover:text-white transition-all cursor-pointer shrink-0"
            >
              {session?.isAuthenticated ? (
                <>
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>Sign Out</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
