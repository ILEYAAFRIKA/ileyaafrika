import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  MapPin,
  ArrowRight,
  KeyRound,
  Loader2
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

interface UpdatePasswordProps {
  onNavigate: (path: string) => void;
  onSuccessToast?: (msg: string) => void;
}

export const UpdatePassword: React.FC<UpdatePasswordProps> = ({
  onNavigate,
  onSuccessToast,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState<boolean>(true);

  // Verify that an active recovery session or recovery token exists
  useEffect(() => {
    let isMounted = true;

    async function checkAuthRecoverySession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Supabase often sets the session via the URL hash (#access_token=...&type=recovery)
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        const hasRecoveryToken = hash.includes('type=recovery') || hash.includes('access_token') || search.includes('code=');

        if (session || hasRecoveryToken) {
          if (isMounted) setIsSessionValid(true);
        } else {
          // In some cases Supabase takes a few milliseconds to parse hash tokens from URL
          setTimeout(async () => {
            const { data: { session: delayedSession } } = await supabase.auth.getSession();
            if (isMounted) {
              setIsSessionValid(!!delayedSession || window.location.hash.includes('access_token'));
              setCheckingSession(false);
            }
          }, 600);
          return;
        }
      } catch (err) {
        console.warn('Session verification notice:', err);
      } finally {
        if (isMounted) setCheckingSession(false);
      }
    }

    checkAuthRecoverySession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        if (isMounted) {
          setIsSessionValid(true);
          setCheckingSession(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify and try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update password with Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);

      // Sign out recovery session to allow fresh login with new credentials
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }

      if (onSuccessToast) {
        onSuccessToast('Password updated successfully! You can now log in with your new credentials.');
      }

      // Redirect to /login after brief success acknowledgement
      setTimeout(() => {
        onNavigate('/login?reset=success');
      }, 1200);
    } catch (err: any) {
      console.error('Update password error:', err);
      const msg = err?.message || 'Failed to update password. Your recovery link may have expired.';
      if (msg.includes('Auth session missing') || msg.includes('jwt') || msg.includes('expired')) {
        setErrorMsg('Your password reset session has expired. Please request a new link.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 bg-[#FBF6EC] text-[#14231C]">
      {/* Top Brand Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between gap-2 overflow-x-hidden">
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#1B4332] flex items-center justify-center text-[#E8A33D] shadow-sm shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <BrandLogo variant="light" badge="Verified Stays" />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-[#6B756F] shrink-0">
          <MapPin className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0" />
          <span className="hidden sm:inline">Nigeria (Lagos • Abuja • Port Harcourt • Ibadan)</span>
          <span className="sm:hidden">Nigeria</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center my-6">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#FFFFFF] rounded-2xl shadow-xl shadow-[#1B4332]/5 border border-[#1B4332]/10 p-6 sm:p-8"
          >
            {/* Header Icon */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#1B4332]/10 text-[#1B4332] mx-auto flex items-center justify-center mb-3">
                <KeyRound className="w-6 h-6 text-[#1B4332]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif tracking-tight">
                Update Password
              </h1>
              <p className="mt-2 text-sm text-[#6B756F] leading-relaxed">
                Create a strong new password to secure your Ileya Afrika account.
              </p>
            </div>

            {/* Session Checking Indicator */}
            {checkingSession ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-7 h-7 text-[#E8A33D] animate-spin mb-3" />
                <p className="text-xs text-[#6B756F]">Verifying reset authorization link...</p>
              </div>
            ) : !isSessionValid && !isSuccess ? (
              /* Invalid/Expired Session Warning */
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold text-amber-950">
                      Reset Link Expired or Invalid
                    </strong>
                    <p className="mt-1 leading-relaxed text-amber-900/90">
                      Security reset links expire after a short period or once used. Please request a new password reset link.
                    </p>
                  </div>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigate('/forgot-password')}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[#1B4332] text-white hover:bg-[#2D6A4F] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Request New Reset Link</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : isSuccess ? (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 text-center py-2"
              >
                <div className="w-12 h-12 rounded-full bg-[#2D6A4F]/20 text-[#2D6A4F] mx-auto flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6 text-[#2D6A4F]" />
                </div>
                <h3 className="text-base font-bold text-[#1B4332]">Password Updated!</h3>
                <p className="text-xs text-[#6B756F] leading-relaxed">
                  Your password has been changed successfully. Redirecting to login...
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('/login?reset=success')}
                    className="w-full py-3 px-6 rounded-xl font-bold text-[#14231C] bg-[#E8A33D] hover:bg-[#d99530] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#E8A33D]/25"
                  >
                    <span>Proceed to Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Alert */}
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}

                {/* New Password */}
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-xs font-semibold text-[#14231C] mb-1.5"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B756F]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                  <span className="text-[11px] text-[#6B756F] mt-1 block">
                    Must be at least 6 characters
                  </span>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-semibold text-[#14231C] mb-1.5"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B756F]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-sm bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B756F] hover:text-[#14231C] cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    id="update-password-submit-btn"
                    disabled={isSubmitting}
                    className="w-full py-3 px-6 rounded-xl font-bold text-[#14231C] bg-[#E8A33D] hover:bg-[#d99530] active:scale-[0.99] transition-all shadow-md shadow-[#E8A33D]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-[#14231C] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Save New Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </main>

      {/* Trust & Verification Footer */}
      <footer className="w-full max-w-md mx-auto text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-[#6B756F]">
          <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
          <span>Ileya Afrika physically inspects and verifies every listing in Nigeria</span>
        </div>
      </footer>
    </div>
  );
};
