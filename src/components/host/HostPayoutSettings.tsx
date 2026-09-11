import React, { useState } from 'react';
import {
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  ArrowRight,
  Info,
  DollarSign,
  Landmark
} from 'lucide-react';
import { BankPayoutDetails } from '../../types';
import { NIGERIAN_BANKS } from '../../data/nigerianData';

interface HostPayoutSettingsProps {
  bankDetails: BankPayoutDetails;
  onSaveBankDetails: (updated: BankPayoutDetails) => void;
  onNavigateToListings: () => void;
}

export const HostPayoutSettings: React.FC<HostPayoutSettingsProps> = ({
  bankDetails,
  onSaveBankDetails,
  onNavigateToListings,
}) => {
  const [bankName, setBankName] = useState(bankDetails.bankName);
  const [accountNumber, setAccountNumber] = useState(bankDetails.accountNumber);
  const [accountName, setAccountName] = useState(bankDetails.accountName);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-resolve / verify account simulation when 10 digits are entered
  const handleAccountNumberChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 10);
    setAccountNumber(cleaned);
    setIsSaved(false);

    if (cleaned.length === 10) {
      setIsVerifying(true);
      setErrorMsg(null);
      setTimeout(() => {
        setIsVerifying(false);
        // If account name is empty, provide realistic resolution
        if (!accountName || accountName === bankDetails.accountName) {
          setAccountName('ADEWALE BABATUNDE O.');
        }
      }, 500);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!bankName) {
      setErrorMsg('Please select your Nigerian bank.');
      return;
    }
    if (accountNumber.length !== 10) {
      setErrorMsg('Nigerian NUBAN account number must be exactly 10 digits.');
      return;
    }
    if (!accountName.trim()) {
      setErrorMsg('Please provide the registered bank account name.');
      return;
    }

    onSaveBankDetails({
      bankName,
      accountNumber,
      accountName: accountName.trim().toUpperCase(),
      isVerified: true
    });

    setIsSaved(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header Info */}
      <div className="bg-white rounded-2xl shadow-xl shadow-[#1B4332]/5 border border-[#1B4332]/10 p-6 sm:p-10">
        <div className="flex items-start justify-between border-b border-[#1B4332]/10 pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B4332]/5 text-[#1B4332] text-xs font-semibold mb-2">
              <Landmark className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>Direct Bank Settlement</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif tracking-tight">
              Bank & Payout Settings
            </h2>
            <p className="mt-1.5 text-sm text-[#6B756F]">
              Enter your designated Nigerian bank account details where short-let booking payouts will be deposited.
            </p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-[#E8A33D]/15 text-[#1B4332] flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6 text-[#E8A33D]" />
          </div>
        </div>

        {/* Success Alert */}
        {isSaved && (
          <div className="mb-6 p-4 rounded-xl bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 text-[#1B4332] flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#2D6A4F] shrink-0" />
            <div>
              <p className="text-xs font-bold">Payout account updated successfully!</p>
              <p className="text-[11px] text-[#6B756F]">All future earnings will automatically settle into this account.</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Nigerian Bank Name Dropdown */}
          <div>
            <label className="block text-xs font-bold text-[#14231C] mb-1.5">
              Nigerian Bank Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B756F]">
                <Building className="w-4 h-4" />
              </div>
              <select
                required
                value={bankName}
                onChange={(e) => {
                  setBankName(e.target.value);
                  setIsSaved(false);
                }}
                className="w-full pl-10 pr-4 py-3 text-sm font-semibold bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all"
              >
                <option value="">Select your bank...</option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Account Number (10 Digits) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#14231C]">
                Account Number (10 Digits NUBAN) <span className="text-red-500">*</span>
              </label>
              {isVerifying && (
                <span className="text-[11px] font-semibold text-[#2D6A4F] flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
                  Resolving NUBAN...
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B756F]">
                <CreditCard className="w-4 h-4" />
              </div>
              <input
                type="text"
                maxLength={10}
                required
                value={accountNumber}
                onChange={(e) => handleAccountNumberChange(e.target.value)}
                placeholder="0123456789"
                className="w-full pl-10 pr-4 py-3 text-base font-mono font-bold tracking-wider bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all"
              />
            </div>
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-xs font-bold text-[#14231C] mb-1.5">
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={accountName}
              onChange={(e) => {
                setAccountName(e.target.value);
                setIsSaved(false);
              }}
              placeholder="e.g. ADEWALE BABATUNDE O."
              className="w-full px-3.5 py-3 text-sm font-bold uppercase bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332] transition-all"
            />
            <p className="mt-1 text-[11px] text-[#6B756F]">
              Must match the legal name on your bank account for instant NIBSS settlement.
            </p>
          </div>

          {/* Explicit Helper Note from prompt */}
          <div className="p-4 rounded-xl bg-[#FBF6EC] border border-[#1B4332]/15 text-[#14231C] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B4332]">
              <Info className="w-4 h-4 text-[#2D6A4F]" />
              <span>Automatic Settlement Notice</span>
            </div>
            <p className="text-xs text-[#6B756F] leading-relaxed">
              Payouts are remitted to this account automatically after every verified guest checkout, minus Ileya&apos;s platform commission.
            </p>
          </div>

          {/* Commission & Security Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white border border-[#1B4332]/10 rounded-xl">
              <span className="font-bold text-[#1B4332]">Ileya Host Commission:</span>
              <p className="text-[#6B756F] text-[11px] mt-0.5">
                Standard 10% platform fee covers payment processing, 24/7 physical verification, and guest support.
              </p>
            </div>
            <div className="p-3 bg-white border border-[#1B4332]/10 rounded-xl">
              <span className="font-bold text-[#1B4332]">Bank-Grade Security:</span>
              <p className="text-[#6B756F] text-[11px] mt-0.5">
                All banking data is encrypted and securely routed via CBN-licensed payment switches.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#1B4332]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onNavigateToListings}
              className="text-xs font-bold text-[#1B4332] hover:underline cursor-pointer"
            >
              ← Back to My Listings
            </button>

            <button
              type="submit"
              id="save-payout-btn"
              className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold text-[#14231C] bg-[#E8A33D] hover:bg-[#d99530] active:scale-[0.99] transition-all shadow-md shadow-[#E8A33D]/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Verify Payout Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
