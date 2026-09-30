import React from 'react';
import {
  LayoutGrid,
  PlusCircle,
  CreditCard
} from 'lucide-react';
import { HostViewTab, UserSession } from '../../types';

interface HostHeaderProps {
  activeTab: HostViewTab;
  onSelectTab: (tab: HostViewTab) => void;
  session?: UserSession | null;
  onLogout?: () => void;
}

/**
 * HostHeader: Local Dashboard Tab Menu
 * Strict Minimalist Design System:
 * - Clean white background with subtle gray bottom border (border-b border-gray-200)
 * - Inactive tabs: simple gray text (text-gray-500 hover:text-gray-700), NO colored backgrounds
 * - Active tabs: brand green indicator ONLY (text-[#1B4332] border-b-2 border-[#1B4332])
 * - Lots of breathing room (gap-8, pb-2)
 * - Stripped of duplicate logos and logout actions (managed by Navbar.jsx)
 */
export const HostHeader: React.FC<HostHeaderProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 w-full font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Title Row */}
        <div className="pt-6 pb-4">
          <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">
            Host Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your properties, add new listings, and configure verified payout details.
          </p>
        </div>

        {/* Sleek Horizontal Tab Menu (Strict Colors) */}
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
          {/* Tab 1: My Properties */}
          <button
            type="button"
            id="tab-my-listings"
            onClick={() => onSelectTab('listings')}
            className={`pb-3 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'listings'
                ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>My Properties</span>
          </button>

          {/* Tab 2: Add Property */}
          <button
            type="button"
            id="tab-create-listing"
            onClick={() => onSelectTab('new-listing')}
            className={`pb-3 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'new-listing'
                ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Property</span>
          </button>

          {/* Tab 3: Payout Settings */}
          <button
            type="button"
            id="tab-payout-settings"
            onClick={() => onSelectTab('payout-settings')}
            className={`pb-3 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'payout-settings'
                ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payout Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostHeader;
