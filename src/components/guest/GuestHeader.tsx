import React from 'react';
import {
  Building2,
  Compass,
  ShieldCheck,
  LogOut,
  User,
  Luggage,
  Sparkles
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
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#1B4332]/10 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#1B4332] flex items-center justify-center text-[#E8A33D] shadow-md shadow-[#1B4332]/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-serif tracking-tight text-[#1B4332]">
                Ileya
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#E8A33D]/20 text-[#14231C] border border-[#E8A33D]/40">
                Guest Portal
              </span>
            </div>
            <p className="text-[11px] text-[#6B756F] hidden sm:block">
              Physically Verified Nigerian Short-Lets & Serviced Apartments
            </p>
          </div>
        </div>

        {/* Center Tabbed Navigation: Explore vs My Bookings */}
        <nav className="flex items-center p-1.5 rounded-2xl bg-[#FBF6EC] border border-[#1B4332]/10">
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
            <Compass className="w-4 h-4" />
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
            <Luggage className="w-4 h-4" />
            <span>My Bookings</span>
            {bookingsCount > 0 && (
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
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

        {/* User Profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-bold text-[#14231C] truncate max-w-[140px]">
              {session?.fullName || 'Valued Guest'}
            </span>
            <span className="text-[11px] text-[#6B756F] truncate max-w-[140px]">
              {session?.email || 'guest@ileya.ng'}
            </span>
          </div>

          <div className="w-9 h-9 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>

          <button
            type="button"
            onClick={onLogout}
            id="guest-logout-btn"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-[#1B4332]/20 text-[#1B4332] hover:bg-[#1B4332] hover:text-white transition-all cursor-pointer shadow-xs"
            title="Sign Out of Ileya"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
