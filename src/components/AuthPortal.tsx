import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import {
  ShieldCheck,
  User,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  MapPin,
  ArrowLeft,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { UserRole, AuthMode } from '../types';
import { useApp, MASTER_ADMIN_EMAIL } from '../context/AppContext';
import { saveUserDocToSupabase, getUserFromSupabase } from '../lib/supabaseService';

interface AuthPortalProps {
  onSuccess: (data: { role: UserRole; fullName: string; email: string }) => void;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  adminEmails?: string[];
}

/**
 * Format Supabase / General Auth Error Codes into friendly user messages
 */
function getAuthErrorMessage(error: any): string {
  const msg = error?.message || '';
  if (msg.includes('User already registered') || msg.includes('already exists')) {
    return 'An account with this email already exists. Please log in instead.';
  }
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_grant')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (msg.includes('Password should be at least')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
    return 'Too many attempts. Please wait a few moments before trying again.';
  }
  return msg || 'An error occurred during authentication. Please try again.';
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  onSuccess,
  onNavigate,
  adminEmails = [MASTER_ADMIN_EMAIL],
}) => {
  const { adminEmails: globalAdmins, setCurrentUser } = useApp();

  const [role, setRole] = useState<UserRole>('guest');
  const [mode, setMode] = useState<AuthMode>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeAdminEmails = globalAdmins && globalAdmins.length > 0 ? globalAdmins : adminEmails;

  // Handle Form Submission (Sign Up, Log In, or Reset Password)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim().toLowerCase();

    // -------------------------------------------------------------
    // FLOW 1: Reset Password
    // -------------------------------------------------------------
    if (mode === 'reset-password') {
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }

      setIsSubmitting(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
        if (error) throw error;
        setSuccessMsg('Password reset instructions sent! Check your inbox.');
      } catch (err: any) {
        console.error('Password reset error:', err);
        setErrorMsg(getAuthErrorMessage(err));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // -------------------------------------------------------------
    // Validation for Sign Up & Log In
    // -------------------------------------------------------------
    if (mode === 'signup' && !fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        // -------------------------------------------------------------
        // FLOW 2: Supabase Auth Sign Up
        // -------------------------------------------------------------
        const isMaster = trimmedEmail === MASTER_ADMIN_EMAIL.toLowerCase() || trimmedEmail === 'emmanuelolarinde53@gmail.com';
        const isAdmin = activeAdminEmails.some(
          (a) => a.toLowerCase() === trimmedEmail
        );
        const determinedRole: UserRole = isMaster ? 'master_admin' : (isAdmin ? 'admin' : role);

        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: password,
          options: {
            data: {
              fullName: fullName.trim(),
              role: determinedRole,
            },
          },
        });

        if (error) throw error;

        const supaUser = data.user;
        const uid = supaUser?.id || `user-${Date.now()}`;

        // Store user document in Supabase users table
        await saveUserDocToSupabase({
          id: uid,
          uid,
          email: trimmedEmail,
          role: determinedRole,
          fullName: fullName.trim(),
          createdAt: new Date().toISOString()
        });

        // Set App Context User Session
        const session = {
          uid,
          fullName: fullName.trim(),
          email: trimmedEmail,
          role: determinedRole,
          isMasterAdmin: isMaster,
          isAuthenticated: true,
          emailVerified: supaUser?.email_confirmed_at ? true : false,
        };
        setCurrentUser(session);

        // Route to appropriate view
        if (determinedRole === 'master_admin' || determinedRole === 'admin') {
          if (onNavigate) onNavigate('/admin-dashboard');
        } else if (determinedRole === 'guest') {
          if (onNavigate) onNavigate('/guest-dashboard');
        } else {
          if (onNavigate) onNavigate('/host-dashboard');
        }

        onSuccess({
          role: determinedRole,
          fullName: fullName.trim(),
          email: trimmedEmail,
        });

      } else {
        // -------------------------------------------------------------
        // FLOW 3: Supabase Auth Log In
        // -------------------------------------------------------------
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: password,
        });

        if (error) throw error;

        const supaUser = data.user;
        const uid = supaUser?.id || `user-${Date.now()}`;

        // Fetch User Profile from Supabase to determine role
        let dbUser = await getUserFromSupabase(uid);
        if (!dbUser && trimmedEmail) {
          dbUser = await getUserFromSupabase(trimmedEmail);
        }
        
        const isMaster = trimmedEmail === MASTER_ADMIN_EMAIL.toLowerCase() || trimmedEmail === 'emmanuelolarinde53@gmail.com';
        const isAdmin = activeAdminEmails.some(
          (a) => a.toLowerCase() === trimmedEmail
        );

        let determinedRole: UserRole = 'guest';
        if (isMaster) {
          determinedRole = 'master_admin';
        } else if (isAdmin) {
          determinedRole = 'admin';
        } else if (dbUser?.role) {
          determinedRole = dbUser.role;
        } else if (supaUser?.user_metadata?.role) {
          determinedRole = supaUser.user_metadata.role;
        }

        const userDisplayName =
          dbUser?.fullName ||
          supaUser?.user_metadata?.fullName ||
          (isMaster
            ? 'Emmanuel Olarinde (Master Admin)'
            : isAdmin
            ? 'Operations Admin'
            : trimmedEmail.split('@')[0]);

        const session = {
          uid,
          fullName: userDisplayName,
          email: trimmedEmail,
          role: determinedRole,
          isMasterAdmin: isMaster,
          isAuthenticated: true,
          emailVerified: supaUser?.email_confirmed_at ? true : false,
        };
        setCurrentUser(session);

        // Automatic redirect according to Role
        if (determinedRole === 'master_admin' || determinedRole === 'admin') {
          if (onNavigate) onNavigate('/admin-dashboard');
        } else if (determinedRole === 'host') {
          if (onNavigate) onNavigate('/host-dashboard');
        } else {
          if (onNavigate) onNavigate('/guest-dashboard');
        }

        onSuccess({
          role: determinedRole,
          fullName: userDisplayName,
          email: trimmedEmail,
        });
      }
    } catch (err: any) {
      console.error('Supabase Auth error:', err);
      setErrorMsg(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 bg-[#FBF6EC] text-[#14231C]">
      {/* Top Brand Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#1B4332] flex items-center justify-center text-[#E8A33D] shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-extrabold tracking-tight text-[#1B4332] font-serif">
              Ileya
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1B4332]/10 text-[#1B4332]">
              Verified Stays
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-[#6B756F]">
          <MapPin className="w-3.5 h-3.5 text-[#2D6A4F]" />
          <span>Nigeria (Lagos • Abuja • Port Harcourt • Ibadan)</span>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center my-6">
        <div className="w-full max-w-md">
          {/* Main Auth Card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#FFFFFF] rounded-2xl shadow-xl shadow-[#1B4332]/5 border border-[#1B4332]/10 p-6 sm:p-8"
          >
            {/* Header copy */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B4332]/5 text-[#1B4332] text-xs font-semibold mb-3">
                <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
                <span>Physical Verification Guaranteed</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif tracking-tight">
                {mode === 'reset-password' ? 'Reset Password' : 'Welcome to Ileya'}
              </h1>
              <p className="mt-1.5 text-sm text-[#6B756F]">
                {mode === 'reset-password'
                  ? 'Enter your registered email address to receive password reset instructions.'
                  : role === 'guest'
                  ? 'Find physically inspected & verified apartments.'
                  : 'List your verified short-let apartment with trust.'}
              </p>
            </div>

            {/* Step 1: Role Toggle (Hidden when in reset-password mode) */}
            {mode !== 'reset-password' && (
              <div className="mb-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B756F] mb-2 text-center">
                  Select Your Account Type
                </label>
                <div
                  id="role-toggle-group"
                  role="radiogroup"
                  aria-label="User Account Role"
                  className="grid grid-cols-2 p-1.5 bg-[#FBF6EC] rounded-xl border border-[#1B4332]/10 relative"
                >
                  {/* Guest Button */}
                  <button
                    type="button"
                    id="role-toggle-guest"
                    onClick={() => setRole('guest')}
                    className={`relative z-10 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      role === 'guest'
                        ? 'bg-[#1B4332] text-white shadow-md'
                        : 'text-[#14231C] hover:text-[#1B4332]'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>I&apos;m a Guest</span>
                  </button>

                  {/* Host Button */}
                  <button
                    type="button"
                    id="role-toggle-host"
                    onClick={() => setRole('host')}
                    className={`relative z-10 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      role === 'host'
                        ? 'bg-[#1B4332] text-white shadow-md'
                        : 'text-[#14231C] hover:text-[#1B4332]'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>I&apos;m a Host</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Mode Toggle (Sign Up vs Log In vs Reset Mode) */}
            {mode !== 'reset-password' ? (
              <div className="flex items-center justify-between border-b border-[#1B4332]/10 pb-3 mb-6">
                <div className="flex gap-4">
                  <button
                    type="button"
                    id="auth-mode-signup"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className={`text-sm font-bold pb-2 relative transition-colors cursor-pointer ${
                      mode === 'signup'
                        ? 'text-[#1B4332]'
                        : 'text-[#6B756F] hover:text-[#14231C]'
                    }`}
                  >
                    Sign Up
                    {mode === 'signup' && (
                      <motion.div
                        layoutId="mode-underline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E8A33D]"
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    id="auth-mode-login"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className={`text-sm font-bold pb-2 relative transition-colors cursor-pointer ${
                      mode === 'login'
                        ? 'text-[#1B4332]'
                        : 'text-[#6B756F] hover:text-[#14231C]'
                    }`}
                  >
                    Log In
                    {mode === 'login' && (
                      <motion.div
                        layoutId="mode-underline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E8A33D]"
                      />
                    )}
                  </button>
                </div>

                <span className="text-xs font-medium text-[#2D6A4F] bg-[#2D6A4F]/10 px-2 py-0.5 rounded">
                  Role: {role === 'guest' ? 'Guest' : 'Host'}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between border-b border-[#1B4332]/10 pb-3 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] hover:text-[#2D6A4F] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </button>
                <span className="text-xs font-medium text-[#E8A33D] bg-[#E8A33D]/10 px-2 py-0.5 rounded">
                  Password Recovery
                </span>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {/* Success Message Alert */}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#2D6A4F]" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name field (Sign Up only) */}
              <AnimatePresence initial={false}>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <label
                      htmlFor="full-name-input"
                      className="block text-xs font-semibold text-[#14231C] mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B756F]">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="full-name-input"
                        type="text"
                        required={mode === 'signup'}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={role === 'guest' ? 'e.g. Tunde Adeyemi' : 'e.g. Ngozi Okafor'}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="email-input"
                  className="block text-xs font-semibold text-[#14231C] mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B756F]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password (Hidden in reset-password mode) */}
              {mode !== 'reset-password' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password-input"
                      className="block text-xs font-semibold text-[#14231C]"
                    >
                      Password
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        id="forgot-password-btn"
                        onClick={() => {
                          setMode('reset-password');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-xs font-semibold text-[#2D6A4F] hover:text-[#1B4332] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B756F]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-sm bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B756F] hover:text-[#14231C] cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button (Gold CTA) */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="auth-submit-btn"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 rounded-xl font-bold text-[#14231C] bg-[#E8A33D] hover:bg-[#d99530] active:scale-[0.99] transition-all shadow-md shadow-[#E8A33D]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-[#14231C] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'reset-password' ? (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Send Reset Link</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {mode === 'signup'
                              ? `Create ${role === 'guest' ? 'Guest' : 'Host'} Account`
                              : `Log In as ${role === 'guest' ? 'Guest' : 'Host'}`}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Route preview destination indicator */}
            {mode !== 'reset-password' && (
              <div className="mt-5 p-3 rounded-xl bg-[#FBF6EC] border border-[#1B4332]/10 text-center">
                <p className="text-xs text-[#6B756F]">
                  On submit, you will be routed to:{' '}
                  <strong className="font-mono text-[#1B4332] bg-white px-1.5 py-0.5 rounded border border-[#1B4332]/10">
                    {email.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() || activeAdminEmails.some(a => a.toLowerCase() === email.trim().toLowerCase())
                      ? '/admin-dashboard'
                      : role === 'guest'
                      ? '/guest-dashboard'
                      : '/host-dashboard'}
                  </strong>
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Trust & Verification Footer Note */}
      <footer className="w-full max-w-md mx-auto text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-[#6B756F]">
          <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
          <span>Ileya physically inspects and verifies every listing in Nigeria</span>
        </div>
      </footer>
    </div>
  );
};
