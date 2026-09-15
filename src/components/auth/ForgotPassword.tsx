import React, { useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Building2,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

interface ForgotPasswordProps {
  onNavigate: (path: string) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use exact redirectTo requested: https://ileyaafrika.onrender.com/update-password
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: 'https://ileyaafrika.onrender.com/update-password',
      });

      if (error) {
        throw error;
      }

      setSubmittedEmail(trimmedEmail);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Password reset request error:', err);
      const msg = err?.message || 'Failed to send password reset email. Please try again.';
      if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
        setErrorMsg('Too many password reset requests. Please wait a few minutes before trying again.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!submittedEmail) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(submittedEmail, {
        redirectTo: 'https://ileyaafrika.onrender.com/update-password',
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to resend reset link.');
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
            {/* Header / Icon */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#E8A33D]/10 text-[#E8A33D] mx-auto flex items-center justify-center mb-3">
                <KeyRound className="w-6 h-6 text-[#1B4332]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif tracking-tight">
                Forgot Password
              </h1>
              <p className="mt-2 text-sm text-[#6B756F] leading-relaxed">
                {isSubmitted
                  ? 'Check your inbox for password recovery instructions.'
                  : 'Enter your registered email address and we will send you a secure link to reset your password.'}
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {/* Success State */}
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5"
              >
                <div className="p-4 rounded-xl bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#2D6A4F]/20 text-[#2D6A4F] mx-auto flex items-center justify-center mb-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#2D6A4F]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1B4332]">Check your email</h3>
                  <p className="text-xs text-[#6B756F] mt-1.5 leading-relaxed">
                    We have sent a password reset link to:
                  </p>
                  <p className="text-xs font-semibold text-[#14231C] mt-1 bg-white px-3 py-1.5 rounded-lg border border-[#1B4332]/10 inline-block">
                    {submittedEmail}
                  </p>
                  <p className="text-[11px] text-[#6B756F] mt-2.5">
                    Click the link in the email to set a new password. If you do not see it within a few minutes, check your spam or junk folder.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => onNavigate('/login')}
                    className="w-full py-3 px-6 rounded-xl font-bold text-[#14231C] bg-[#E8A33D] hover:bg-[#d99530] transition-all shadow-md shadow-[#E8A33D]/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Return to Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleResend}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#1B4332] hover:bg-[#1B4332]/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                    <span>Resend reset email</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Request Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="forgot-password-email"
                    className="block text-xs font-semibold text-[#14231C] mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B756F]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="forgot-password-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoFocus
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    id="forgot-password-submit-btn"
                    disabled={isSubmitting}
                    className="w-full py-3 px-6 rounded-xl font-bold text-[#14231C] bg-[#E8A33D] hover:bg-[#d99530] active:scale-[0.99] transition-all shadow-md shadow-[#E8A33D]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-[#14231C] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('/login')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] hover:text-[#2D6A4F] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Login</span>
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
