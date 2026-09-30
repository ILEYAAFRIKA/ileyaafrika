import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Building2,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

/**
 * Login Component (Login.jsx)
 * Clean, dedicated login page with generous whitespace, centered white card
 * on bg-gray-50, and brand-accented primary submit button.
 */
export const Login = ({ onNavigate, onSuccess }) => {
  const { setCurrentUser, loginUser } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Authenticate with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please verify and try again.');
        } else if (authError.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address before logging in.');
        } else {
          throw authError;
        }
      }

      if (!data?.user) {
        throw new Error('Authentication succeeded but no user session was returned.');
      }

      const uid = data.user.id;

      // 2. Query user profile from Supabase profiles table
      const { data: profileRecord } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      const userRole = profileRecord?.role || data.user.user_metadata?.role || 'guest';
      const userFullName =
        profileRecord?.full_name ||
        data.user.user_metadata?.full_name ||
        cleanEmail.split('@')[0];

      const sessionObj = {
        uid,
        fullName: userFullName,
        email: cleanEmail,
        role: userRole,
        isMasterAdmin: userRole === 'master_admin',
        isAuthenticated: true,
      };

      if (typeof setCurrentUser === 'function') {
        setCurrentUser(sessionObj);
      }
      try {
        window.localStorage.setItem('ileya_current_user', JSON.stringify(sessionObj));
      } catch {}

      if (typeof onSuccess === 'function') {
        onSuccess({
          role: userRole,
          fullName: userFullName,
          email: cleanEmail,
        });
      } else {
        // Navigate based on role
        if (userRole === 'admin' || userRole === 'master_admin') {
          handleNavigate('/admin-dashboard');
        } else if (userRole === 'host') {
          handleNavigate('/host-dashboard');
        } else {
          handleNavigate('/');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-gray-50 flex flex-col justify-center items-center px-6 py-16 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <button
            type="button"
            onClick={() => handleNavigate('/')}
            className="inline-flex items-center gap-2.5 mx-auto group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5 text-[#E8A33D]" />
            </div>
            <span className="font-serif font-bold text-2xl text-[#1B4332] tracking-tight">
              Ileya <span className="text-[#E8A33D]">Afrika</span>
            </span>
          </button>
          <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs text-gray-500 font-normal">
            Log in to manage your bookings and verified Nigerian stays.
          </p>
        </div>

        {/* Clean White Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-gray-100 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-gray-700"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-gray-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => handleNavigate('/forgot-password')}
                  className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 text-sm bg-white rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#1B4332] hover:bg-[#143427] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60 border border-[#E8A33D]/30"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#E8A33D]" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Log In</span>
                    <ArrowRight className="w-4 h-4 text-[#E8A33D]" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Bottom Switch Link */}
          <div className="pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => handleNavigate('/signup')}
                className="font-semibold text-gray-900 hover:underline transition-all cursor-pointer ml-1"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
