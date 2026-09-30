import React from 'react';
import {
  Compass,
  Luggage
} from 'lucide-react';
import { GuestViewTab, UserSession } from '../../types';

interface GuestHeaderProps {
  activeTab: GuestViewTab;
  onSelectTab: (tab: GuestViewTab) => void;
  session?: UserSession | null;
  onLogout?: () => void;
  verifiedCount?: number;
  availableCount?: number;
  bookingsCount?: number;
}

/**
 * GuestHeader: Local Dashboard Tab Menu
 * Strict Minimalist Design System:
 * - Clean white background with subtle gray bottom border (border-b border-gray-200)
 * - Inactive tabs: simple gray text (text-gray-500 hover:text-gray-700), NO colored backgrounds
 * - Active tabs: brand green indicator ONLY (text-[#1B4332] border-b-2 border-[#1B4332])
 * - Lots of breathing room (gap-8, pb-2)
 * - Stripped of duplicate global logos and logout buttons (managed by Navbar.jsx)
 */
export const GuestHeader: React.FC<GuestHeaderProps> = ({
  activeTab,
  onSelectTab,
  bookingsCount = 0,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 w-full font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Title Row */}
        <div className="pt-6 pb-4">
          <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">
            Guest Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Discover physically verified Nigerian properties and manage your active reservations.
          </p>
        </div>

        {/* Sleek Horizontal Tab Menu (Strict Colors) */}
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
          {/* Tab 1: Explore Stays */}
          <button
            type="button"
            id="tab-explore-btn"
            onClick={() => onSelectTab('explore')}
            className={`pb-3 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'explore'
                ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Explore Properties</span>
          </button>

          {/* Tab 2: My Bookings */}
          <button
            type="button"
            id="tab-my-bookings-btn"
            onClick={() => onSelectTab('my-bookings')}
            className={`pb-3 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'my-bookings'
                ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
            }`}
          >
            <Luggage className="w-4 h-4" />
            <span>My Bookings</span>
            {bookingsCount > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'my-bookings'
                    ? 'bg-[#1B4332]/10 text-[#1B4332]'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {bookingsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestHeader;
