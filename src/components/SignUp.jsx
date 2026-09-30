import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Building2,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

/**
 * Sign-Up Component (SignUp.jsx)
 * Clean, dedicated registration page with generous whitespace, centered white card
 * on bg-gray-50, password confirmation validation, and profiles table role defaulting to 'guest'.
 */
export const SignUp = ({ onNavigate, onSuccess }) => {
  const { setCurrentUser } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

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

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Basic validation
    if (!cleanFullName || !cleanEmail || !password || !confirmPassword) {
      setErrorMsg('Please complete all fields to create your account.');
      return;
    }

    // 2. Strict Password Match Validation:
    // Verify that Password and Confirm Password exactly match.
    // If they don't, show a clear error text and do not submit.
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your password and try again.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 3. Register user with Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanFullName,
            role: 'guest',
          },
        },
      });

      if (authError) {
        if (authError.message.includes('User already registered') || authError.message.includes('already exists')) {
          throw new Error('An account with this email already exists. Please log in instead.');
        } else {
          throw authError;
        }
      }

      const registeredUser = data?.user;
      if (registeredUser) {
        // 4. Default user's role to 'guest' in the profiles table
        // Unified accounts so users do not need two emails
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: registeredUser.id,
              email: cleanEmail,
              full_name: cleanFullName,
              role: 'guest',
              updated_at: new Date().toISOString(),
            });

          if (profileError) {
            console.warn('Profile insert notice:', profileError.message);
          }
        } catch (profileErr) {
          console.warn('Profile persistence notice:', profileErr);
        }

        // Check if session was granted immediately (email confirmation disabled or auto-confirmed)
        if (data.session) {
          const sessionObj = {
            uid: registeredUser.id,
            fullName: cleanFullName,
            email: cleanEmail,
            role: 'guest',
            isMasterAdmin: false,
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
              role: 'guest',
              fullName: cleanFullName,
              email: cleanEmail,
            });
          } else {
            handleNavigate('/');
          }
        } else {
          // Email confirmation is required by Supabase project settings
          setSignupSuccess(true);
        }
      } else {
        throw new Error('Registration completed but no user record was returned.');
      }
    } catch (err) {
      console.error('Sign-up error:', err);
      setErrorMsg(err.message || 'An error occurred during registration. Please try again.');
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
            Create an account
          </h1>
          <p className="text-xs text-gray-500 font-normal">
            Join Ileya Afrika to browse, book, or host verified Nigerian homes.
          </p>
        </div>

        {/* Clean White Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-gray-100 space-y-6">
          {signupSuccess ? (
            /* Success confirmation screen */
            <div className="text-center space-y-4 py-4 animate-in zoom-in-95 duration-150">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-700" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Check your email</h2>
              <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                We've sent a verification link to <strong>{email}</strong>. Please confirm your email to activate your account.
              </p>
              <button
                type="button"
                onClick={() => handleNavigate('/login')}
                className="mt-4 w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#1B4332] hover:bg-[#143427] transition-all cursor-pointer shadow-xs"
              >
                Proceed to Log In
              </button>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <p className="leading-relaxed">{errorMsg}</p>
                </div>
              )}

              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-name"
                    className="block text-xs font-semibold text-gray-700"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Babatunde Adeleke"
                      className="w-full pl-10 pr-4 py-3 text-sm bg-white rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-email"
                    className="block text-xs font-semibold text-gray-700"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-email"
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

                {/* Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-password"
                    className="block text-xs font-semibold text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
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

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-confirm-password"
                    className="block text-xs font-semibold text-gray-700"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className={`w-full pl-10 pr-4 py-3 text-sm bg-white rounded-xl border text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                        confirmPassword && confirmPassword !== password
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                          : 'border-gray-200 focus:border-[#1B4332] focus:ring-[#1B4332]/20'
                      }`}
                    />
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-[11px] text-rose-600 mt-1">
                      Passwords do not match yet.
                    </p>
                  )}
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
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4 text-[#E8A33D]" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Bottom Switch Link */}
              <div className="pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleNavigate('/login')}
                    className="font-semibold text-gray-900 hover:underline transition-all cursor-pointer ml-1"
                  >
                    Log in
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUp;
