import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  LogOut,
  Calendar,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

/**
 * Navbar Component (Navbar.jsx)
 * Strict Role Separation:
 * - If Logged Out: "Become a Host" (/host-landing), "Log In" (/login), "Sign Up" (/signup)
 * - If Admin: ONLY "Admin Dashboard" and "Logout"
 * - If Host: ONLY "Host Dashboard" and "Logout"
 * - If Guest: ONLY "My Bookings" and "Logout"
 * - Absolutely NO "Switch to Host" or "Switch to Guest" buttons.
 * - Absolutely NO overlapping links between roles.
 */
export const Navbar = ({
  user: propUser,
  onNavigate: propOnNavigate,
  onLogout: propOnLogout,
}) => {
  let contextUser = null;
  let contextLogout = null;
  try {
    const context = useApp();
    contextUser = context?.currentUser;
    contextLogout = context?.logoutUser;
  } catch {}

  // Determine active user (props > context > localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    if (propUser !== undefined) return propUser;
    if (contextUser !== undefined) return contextUser;
    try {
      const stored = window.localStorage.getItem('ileya_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (propUser !== undefined) {
      setCurrentUser(propUser);
    } else if (contextUser !== undefined) {
      setCurrentUser(contextUser);
    }
  }, [propUser, contextUser]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Universal navigation helper
  const handleNavigate = (path) => {
    setIsMobileMenuOpen(false);

    if (typeof propOnNavigate === 'function') {
      propOnNavigate(path);
      return;
    }

    try {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      window.location.href = path;
    }
  };

  // Universal logout handler
  const handleLogout = async () => {
    setIsMobileMenuOpen(false);

    if (typeof propOnLogout === 'function') {
      propOnLogout();
      return;
    }

    if (typeof contextLogout === 'function') {
      await contextLogout();
    } else {
      try {
        window.localStorage.removeItem('ileya_current_user');
      } catch {}
      setCurrentUser(null);
    }

    handleNavigate('/login');
  };

  const isLoggedIn = !!currentUser;
  const userRole = (currentUser?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'master_admin' || !!currentUser?.isMasterAdmin;
  const isHost = userRole === 'host';
  const isGuest = isLoggedIn && !isAdmin && !isHost;

  const displayName =
    currentUser?.fullName ||
    currentUser?.full_name ||
    currentUser?.name ||
    (currentUser?.email ? currentUser.email.split('@')[0] : 'User');

  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 transition-all font-sans">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* Brand Logo (Left) */}
        <button
          type="button"
          onClick={() => handleNavigate('/')}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-[#1B4332] text-white flex items-center justify-center shadow-xs group-hover:bg-[#143427] transition-colors">
            <Building2 className="w-5 h-5 text-[#E8A33D]" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-xl sm:text-2xl text-[#1B4332] tracking-tight leading-none">
              Ileya <span className="text-[#E8A33D]">Afrika</span>
            </span>
            <span className="text-[10px] text-gray-500 font-sans tracking-wider uppercase mt-0.5 font-medium">
              home away from home
            </span>
          </div>
        </button>

        {/* Desktop Navigation Controls (Strict Role Separation) */}
        <div className="hidden md:flex items-center gap-3">
          {!isLoggedIn ? (
            /* 1. Logged Out View */
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleNavigate('/host-landing')}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3.5 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Become a Host
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('/login')}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3.5 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Log In
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('/signup')}
                className="text-sm font-semibold text-white bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98] px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer border border-[#E8A33D]/30"
              >
                Sign Up
              </button>
            </div>
          ) : isAdmin ? (
            /* 2. Admin View: ONLY "Admin Dashboard" and "Logout" */
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 pl-2 pr-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
                <div className="w-6 h-6 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs">
                  {userInitial}
                </div>
                <span className="text-xs font-semibold text-emerald-950 max-w-[130px] truncate">
                  {displayName}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-800 text-white">
                  Admin
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleNavigate('/admin-dashboard')}
                className="text-sm font-semibold text-gray-800 hover:text-[#1B4332] px-3.5 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1.5 border border-gray-200"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Admin Dashboard</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-gray-600 hover:text-rose-600 px-3.5 py-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : isHost ? (
            /* 3. Host View: ONLY "Host Dashboard" and "Logout" */
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 pl-2 pr-3 py-1 bg-gray-50 rounded-full border border-gray-200">
                <div className="w-6 h-6 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs">
                  {userInitial}
                </div>
                <span className="text-xs font-semibold text-gray-900 max-w-[130px] truncate">
                  {displayName}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#E8A33D] text-[#14231C]">
                  Host
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleNavigate('/host-dashboard')}
                className="text-sm font-semibold text-gray-800 hover:text-[#1B4332] px-3.5 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1.5 border border-gray-200"
              >
                <Building2 className="w-4 h-4 text-[#1B4332]" />
                <span>Host Dashboard</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-gray-600 hover:text-rose-600 px-3.5 py-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            /* 4. Guest View: ONLY "My Bookings" and "Logout" */
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 pl-2 pr-3 py-1 bg-gray-50 rounded-full border border-gray-200">
                <div className="w-6 h-6 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs">
                  {userInitial}
                </div>
                <span className="text-xs font-semibold text-gray-900 max-w-[130px] truncate">
                  {displayName}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleNavigate('/guest-dashboard')}
                className="text-sm font-semibold text-gray-800 hover:text-[#1B4332] px-3.5 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1.5 border border-gray-200"
              >
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>My Bookings</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-gray-600 hover:text-rose-600 px-3.5 py-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Strict Role Separation) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-5 space-y-4 shadow-xl animate-in slide-in-from-top-2">
          {!isLoggedIn ? (
            /* Logged Out Mobile View */
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleNavigate('/host-landing')}
                className="w-full text-left py-2.5 text-sm font-medium text-gray-800 hover:text-[#1B4332] border-b border-gray-50 cursor-pointer"
              >
                Become a Host
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('/login')}
                className="w-full text-left py-2.5 text-sm font-medium text-gray-800 hover:text-[#1B4332] border-b border-gray-50 cursor-pointer"
              >
                Log In
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('/signup')}
                className="w-full py-3 rounded-xl text-center font-semibold text-sm text-white bg-[#1B4332] hover:bg-[#143427] shadow-xs cursor-pointer mt-1"
              >
                Sign Up
              </button>
            </div>
          ) : (
            /* Logged In Mobile View */
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-9 h-9 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-sm">
                  {userInitial}
                </div>
                <div className="truncate">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {currentUser?.email || ''}
                  </p>
                  {isAdmin ? (
                    <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-800 text-white">
                      Admin
                    </span>
                  ) : isHost ? (
                    <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#E8A33D] text-[#14231C]">
                      Host
                    </span>
                  ) : null}
                </div>
              </div>

              {isAdmin ? (
                /* Admin Mobile: ONLY "Admin Dashboard" and "Logout" */
                <>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/admin-dashboard')}
                    className="w-full text-left py-2.5 text-sm font-semibold text-gray-800 hover:text-[#1B4332] flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Admin Dashboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left py-2.5 text-sm font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-2 border-t border-gray-100 pt-3 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : isHost ? (
                /* Host Mobile: ONLY "Host Dashboard" and "Logout" */
                <>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/host-dashboard')}
                    className="w-full text-left py-2.5 text-sm font-semibold text-gray-800 hover:text-[#1B4332] flex items-center gap-2 cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-[#1B4332]" />
                    <span>Host Dashboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left py-2.5 text-sm font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-2 border-t border-gray-100 pt-3 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                /* Guest Mobile: ONLY "My Bookings" and "Logout" */
                <>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/guest-dashboard')}
                    className="w-full text-left py-2.5 text-sm font-semibold text-gray-800 hover:text-[#1B4332] flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <span>My Bookings</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left py-2.5 text-sm font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-2 border-t border-gray-100 pt-3 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
