import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  User,
  LogOut,
  Calendar,
  Sparkles,
  ChevronDown,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

/**
 * Navbar Component (Navbar.jsx)
 * Responsive, sticky top navigation bar with a clean Airbnb-style aesthetic,
 * extensive whitespace, subtle borders, and dynamic authentication controls.
 */
export const Navbar = ({
  user: propUser,
  onNavigate: propOnNavigate,
  onLogout: propOnLogout,
}) => {
  // Gracefully read from AppContext if available
  let contextUser = null;
  let contextLogout = null;
  try {
    const context = useApp();
    contextUser = context?.currentUser;
    contextLogout = context?.logoutUser;
  } catch {
    // Rendered outside AppProvider; will fallback to props/localStorage
  }

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

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Universal navigation helper
  const handleNavigate = (path) => {
    setIsProfileMenuOpen(false);
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
    setIsProfileMenuOpen(false);
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
  const displayName =
    currentUser?.fullName ||
    currentUser?.full_name ||
    currentUser?.name ||
    (currentUser?.email ? currentUser.email.split('@')[0] : 'Guest');

  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 transition-all">
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

        {/* Desktop Navigation Controls (Right side - Dynamic Auth) */}
        <div className="hidden md:flex items-center gap-4">
          {!isLoggedIn ? (
            /* Logged Out View */
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
          ) : (
            /* Logged In View */
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleNavigate('/host')}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3.5 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E8A33D]" />
                <span>Switch to Hosting</span>
              </button>

              {/* Profile Dropdown Container */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 pl-3 pr-3.5 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-xs transition-all bg-white text-gray-800 text-sm font-medium cursor-pointer"
                  aria-expanded={isProfileMenuOpen}
                >
                  <div className="w-7 h-7 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs">
                    {userInitial}
                  </div>
                  <span className="truncate max-w-[120px]">{displayName}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-150 ${
                      isProfileMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {currentUser?.email || 'Logged in'}
                      </p>
                      {currentUser?.role && (
                        <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E8A33D]/20 text-[#1B4332]">
                          {currentUser.role}
                        </span>
                      )}
                    </div>

                    <div className="py-1 text-xs text-gray-700">
                      <button
                        type="button"
                        onClick={() => handleNavigate('/guest-dashboard')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span>My Bookings</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNavigate('/host')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5 text-gray-500" />
                        <span>Host Dashboard</span>
                      </button>

                      {currentUser?.role === 'admin' || currentUser?.role === 'master_admin' ? (
                        <button
                          type="button"
                          onClick={() => handleNavigate('/admin-dashboard')}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer text-[#1B4332] font-semibold"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Admin Control</span>
                        </button>
                      ) : null}
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-medium text-gray-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                title="Logout from session"
              >
                Logout
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

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-5 space-y-4 shadow-xl animate-in slide-in-from-top-2">
          {!isLoggedIn ? (
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
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-9 h-9 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-sm">
                  {userInitial}
                </div>
                <div className="truncate">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {currentUser?.email || 'Authenticated user'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleNavigate('/host')}
                className="w-full text-left py-2 text-sm font-medium text-gray-800 hover:text-[#1B4332] flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#E8A33D]" />
                <span>Switch to Hosting</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('/guest-dashboard')}
                className="w-full text-left py-2 text-sm font-medium text-gray-800 hover:text-[#1B4332] flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>My Bookings</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left py-2.5 text-sm font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-2 border-t border-gray-100 mt-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
