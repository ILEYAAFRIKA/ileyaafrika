import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Sparkles,
  Loader2,
  Calendar,
  Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

/**
 * HostLanding Component (HostLanding.jsx)
 * Beautiful marketing landing page detailing the benefits of hosting on Ileya Afrika.
 * Includes:
 * - Hero section with bold headline: "Earn money sharing your space in Nigeria"
 * - 3-column "How it works" section (Setup, Welcome Guests, Get Paid)
 * - "Start Hosting" CTA Logic:
 *   - If NOT logged in: redirects to /signup.
 *   - If logged in (as guest): executes Supabase .update() on profiles table to change role to 'host',
 *     then redirects to /host (the Host Dashboard).
 */
export const HostLanding = ({ onNavigate, user: propUser }) => {
  let contextUser = null;
  let contextSetUser = null;
  try {
    const context = useApp();
    contextUser = context?.currentUser;
    contextSetUser = context?.setCurrentUser;
  } catch {}

  const currentUser = propUser !== undefined ? propUser : contextUser;
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleNavigate = (path) => {
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

  // "Start Hosting" CTA Logic
  const handleStartHosting = async () => {
    // 1. If NOT logged in: redirect to /signup
    if (!currentUser || !currentUser.isAuthenticated) {
      handleNavigate('/signup');
      return;
    }

    // 2. If logged in as guest: update role in profiles table to 'host'
    if (currentUser.role !== 'host' && currentUser.role !== 'master_admin') {
      setIsUpgrading(true);
      try {
        const uid = currentUser.uid || currentUser.id;
        if (uid) {
          const { error } = await supabase
            .from('profiles')
            .update({
              role: 'host',
              updated_at: new Date().toISOString(),
            })
            .eq('id', uid);

          if (error) {
            console.warn('Supabase profile update warning:', error.message);
          }
        }

        // Update local session
        const updatedSession = { ...currentUser, role: 'host' };
        if (typeof contextSetUser === 'function') {
          contextSetUser(updatedSession);
        }
        try {
          window.localStorage.setItem('ileya_current_user', JSON.stringify(updatedSession));
        } catch {}

        // Redirect to /host (Host Dashboard)
        handleNavigate('/host');
      } catch (err) {
        console.error('Error updating profile role to host:', err);
        handleNavigate('/host');
      } finally {
        setIsUpgrading(false);
      }
    } else {
      // Already a host or master admin
      handleNavigate('/host');
    }
  };

  return (
    <div className="bg-white min-h-screen text-gray-900 font-sans">
      {/* 1. Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 via-white to-white py-16 sm:py-24 px-6 border-b border-gray-100">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Host with Confidence on Ileya Afrika</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-900 tracking-tight leading-[1.15]">
            Earn money sharing <br className="hidden sm:inline" />
            your space in <span className="text-[#1B4332]">Nigeria</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Turn your apartment or villa into a high-yield short-let. Our operations team physically verifies your 24/7 power and security, attracting diaspora guests willing to pay premium nightly rates.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleStartHosting}
              disabled={isUpgrading}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#E8A33D]/30 disabled:opacity-75"
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#E8A33D]" />
                  <span>Upgrading account to Host...</span>
                </>
              ) : (
                <>
                  <span>Start Hosting</span>
                  <ArrowRight className="w-4 h-4 text-[#E8A33D]" />
                </>
              )}
            </button>

            {!currentUser && (
              <button
                type="button"
                onClick={() => handleNavigate('/login')}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm transition-all cursor-pointer"
              >
                Log in to existing host account
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Key Benefits */}
      <section className="py-16 sm:py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
            Why list your property on Ileya Afrika?
          </h2>
          <p className="text-sm text-gray-500 font-normal">
            Tailored specifically for Nigerian property owners and high-value diaspora travelers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#1B4332] text-[#E8A33D] flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 font-serif">Verified Trust Badge</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Our on-site physical audit certifies your generator, treated borehole water, and estate security. Listings with the Verified badge experience up to 3× higher conversion.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <CreditCard className="w-6 h-6 text-emerald-200" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 font-serif">Direct NUBAN Payouts</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Receive your rental income directly in Nigerian Naira to any commercial bank account without foreign exchange deductions or delays.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#E8A33D] text-[#14231C] flex items-center justify-center shadow-xs font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 font-serif">Higher Nightly Returns</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Diaspora visitors and corporate executives pay premium rates for verified reliability. Enjoy high occupancy during seasonal rushes and steady demand year-round.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Three-Column "How It Works" Section */}
      <section className="py-16 sm:py-20 px-6 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Straightforward Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
              How it works
            </h2>
            <p className="text-sm text-gray-500 font-normal">
              Three simple steps to start earning with your Nigerian property.
            </p>
          </div>

          {/* 3 Columns: Setup, Welcome Guests, Get Paid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1: Setup */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-900 flex items-center justify-center font-bold text-base font-mono">
                  01
                </div>
                <h3 className="text-lg font-bold text-gray-900 font-serif">1. Setup</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Sign up, input your property details (location, nightly rate, amenities), and upload photos. Connect your WhatsApp contact and Nigerian bank NUBAN for payouts.
                </p>
              </div>
              <ul className="text-xs text-gray-500 space-y-1.5 pt-2 border-t border-gray-50">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Instant property draft creation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Free on-site inspection scheduling</span>
                </li>
              </ul>
            </div>

            {/* Column 2: Welcome Guests */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1B4332] text-[#E8A33D] flex items-center justify-center font-bold text-base font-mono">
                  02
                </div>
                <h3 className="text-lg font-bold text-gray-900 font-serif">2. Welcome Guests</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Once our team completes the physical inspection, your apartment goes live with the official "Verified" badge. Guests can book available calendar dates instantly.
                </p>
              </div>
              <ul className="text-xs text-gray-500 space-y-1.5 pt-2 border-t border-gray-50">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Verified badge credibility</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Direct WhatsApp guest contact</span>
                </li>
              </ul>
            </div>

            {/* Column 3: Get Paid */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-base font-mono border border-emerald-200">
                  03
                </div>
                <h3 className="text-lg font-bold text-gray-900 font-serif">3. Get Paid</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Earn securely with escrow-backed booking settlements. Funds are deposited automatically into your registered NUBAN bank account with full transaction transparency.
                </p>
              </div>
              <ul className="text-xs text-gray-500 space-y-1.5 pt-2 border-t border-gray-50">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Automated bank settlement</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Zero hidden transaction charges</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom CTA Box */}
          <div className="text-center pt-6">
            <button
              type="button"
              onClick={handleStartHosting}
              disabled={isUpgrading}
              className="px-8 py-4 rounded-xl bg-[#1B4332] hover:bg-[#143427] text-white font-bold text-sm shadow-md transition-all cursor-pointer border border-[#E8A33D]/30"
            >
              {isUpgrading ? 'Upgrading account...' : 'Start Hosting with Ileya Afrika'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HostLanding;
