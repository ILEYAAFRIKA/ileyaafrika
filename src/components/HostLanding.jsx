import React from 'react';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Zap,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Users,
  CalendarCheck
} from 'lucide-react';

/**
 * HostLanding Component (HostLanding.jsx)
 * Public marketing and onboarding page for prospective hosts.
 */
export const HostLanding = ({ onNavigate, user }) => {
  const handleStartHosting = () => {
    if (user?.role === 'host') {
      if (typeof onNavigate === 'function') onNavigate('/host-dashboard');
    } else {
      if (typeof onNavigate === 'function') onNavigate('/login');
    }
  };

  return (
    <div className="bg-white min-h-screen text-gray-900 font-sans">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 via-white to-white py-16 sm:py-24 px-6 border-b border-gray-100">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Ileya Afrika Host Partnership Program</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-900 tracking-tight leading-[1.15]">
            Turn your Nigerian property into <br className="hidden sm:inline" />
            a <span className="text-[#1B4332]">high-earning verified stay</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Join Nigeria's first physically verified short-let ecosystem. We audit your home on-site for 24/7 power, borehole water, and security, unlocking premium travelers willing to pay top rates.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleStartHosting}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#E8A33D]/30"
            >
              <span>{user?.role === 'host' ? 'Go to Host Dashboard' : 'Become a Host Today'}</span>
              <ArrowRight className="w-4 h-4 text-[#E8A33D]" />
            </button>

            {!user && (
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('/login')}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm transition-all cursor-pointer"
              >
                Already have an account? Log in
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Why Host With Us Grid */}
      <section className="py-16 sm:py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
            Why short-let hosts choose Ileya Afrika
          </h2>
          <p className="text-sm text-gray-500">
            Designed specifically for the Nigerian hospitality market.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#1B4332] text-[#E8A33D] flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 font-serif">Verified Trust Badge</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Our operations inspectors physically audit your generator, running water, and security. Guests book with total confidence knowing your listing has passed rigorous on-site checks.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <CreditCard className="w-6 h-6 text-emerald-200" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 font-serif">Direct NUBAN Payouts</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Never wait for foreign wire transfers. Receive your rental income directly in Nigerian Naira to any registered commercial bank account with transparent transaction history.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#E8A33D] text-[#14231C] flex items-center justify-center shadow-xs font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 font-serif">Higher Occupancy Rates</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Diaspora returnees, corporate executives, and verified guests choose Ileya Afrika because they know power and security are guaranteed, resulting in longer stays and higher repeat bookings.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works: 3 Simple Steps */}
      <section className="py-16 px-6 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Simple 3-Step Onboarding
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
              How to get your apartment live
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
              <span className="text-2xl font-bold font-mono text-[#1B4332]">01</span>
              <h4 className="text-base font-bold text-gray-900">Create Host Account</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Register as a host partner, provide your WhatsApp number for guest inquiries, and submit your NUBAN bank details.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
              <span className="text-2xl font-bold font-mono text-[#1B4332]">02</span>
              <h4 className="text-base font-bold text-gray-900">Schedule Physical Audit</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Our local operations team in Lagos, Abuja, Port Harcourt, or Ibadan visits your apartment to inspect power backups and amenities.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
              <span className="text-2xl font-bold font-mono text-[#1B4332]">03</span>
              <h4 className="text-base font-bold text-gray-900">Receive Bookings</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Your listing is tagged "Verified" on the public directory. Accept reservations and enjoy automated payouts.
              </p>
            </div>
          </div>

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={handleStartHosting}
              className="px-8 py-3.5 rounded-full bg-[#1B4332] hover:bg-[#143427] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HostLanding;
