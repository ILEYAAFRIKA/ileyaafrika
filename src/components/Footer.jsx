import React from 'react';
import { Building2, ShieldCheck, Heart, MapPin, Globe } from 'lucide-react';

/**
 * Footer Component (Footer.jsx)
 * Clean Airbnb-style footer with bg-gray-50, generous padding (py-12 px-6),
 * subtle top border, and three distinct link columns (Support, Company, Legal).
 */
export const Footer = ({ onNavigate }) => {
  const handleLinkClick = (e, path) => {
    e.preventDefault();
    if (typeof onNavigate === 'function') {
      onNavigate(path);
      return;
    }
    try {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      window.location.href = path;
    }
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-12 px-6 text-gray-600">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-gray-200/70">
          {/* Brand Intro Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#1B4332] text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-4 h-4 text-[#E8A33D]" />
              </div>
              <span className="font-serif font-bold text-lg text-[#1B4332]">
                Ileya <span className="text-[#E8A33D]">Afrika</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
              Nigeria's physical verification standard for short-let homes. Every apartment is inspected on-site for guaranteed 24/7 power, borehole water pressure, and gated security.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>100% Physical On-Site Audits</span>
            </div>
          </div>

          {/* Column 1: Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 font-sans">
              Support
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="/help"
                  onClick={(e) => handleLinkClick(e, '/help')}
                  className="text-gray-600 hover:text-gray-900 transition-colors inline-block"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleLinkClick(e, '/contact')}
                  className="text-gray-600 hover:text-gray-900 transition-colors inline-block"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="/cancellation-options"
                  onClick={(e) => handleLinkClick(e, '/cancellation-options')}
                  className="text-gray-600 hover:text-gray-900 transition-colors inline-block"
                >
                  Cancellation Options
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 font-sans">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="/about"
                  onClick={(e) => handleLinkClick(e, '/about')}
                  className="text-gray-600 hover:text-gray-900 transition-colors inline-block"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/how-it-works"
                  onClick={(e) => handleLinkClick(e, '/how-it-works')}
                  className="text-gray-600 hover:text-gray-900 transition-colors inline-block"
                >
                  How Ileya Afrika Works
                </a>
              </li>
              <li>
                <a
                  href="/host-landing"
                  onClick={(e) => handleLinkClick(e, '/host-landing')}
                  className="text-gray-600 hover:text-gray-900 transition-colors inline-block"
                >
                  Partner as a Host
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 font-sans">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => handleLinkClick(e, '/privacy')}
                  className="text-gray-600 hover:text-gray-900 transition-colors inline-block"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => handleLinkClick(e, '/terms')}
                  className="text-gray-600 hover:text-gray-900 transition-colors inline-block"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-Footer Bar with Copyright and Region */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-center sm:text-left">
            <span>© {new Date().getFullYear()} Ileya Afrika, Inc. All rights reserved.</span>
            <span className="hidden sm:inline">•</span>
            <span>Operating across Lagos, Abuja, Port Harcourt, and Ibadan.</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-gray-700">
              <Globe className="w-3.5 h-3.5" />
              <span>English (NG)</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1 font-semibold text-gray-900 font-mono">
              <span>₦ NGN</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
