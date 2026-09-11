import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Crown,
  Trash2,
  Mail,
  AlertCircle,
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';

interface AdminTeamTabProps {
  adminEmails: string[];
  masterAdminEmail: string;
  currentAdminEmail: string;
  onAddAdmin: (email: string) => void;
  onRevokeAdmin: (email: string) => void;
}

export const AdminTeamTab: React.FC<AdminTeamTabProps> = ({
  adminEmails,
  masterAdminEmail,
  currentAdminEmail,
  onAddAdmin,
  onRevokeAdmin,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isMaster = currentAdminEmail.toLowerCase() === masterAdminEmail.toLowerCase();

  // If not master admin, safety guard
  if (!isMaster) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-red-200 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold font-serif text-[#14231C]">
          Access Restricted
        </h3>
        <p className="text-xs text-[#6B756F] max-w-md mx-auto mt-1">
          Only the master administrator ({masterAdminEmail}) has authorization to manage the operational admin team.
        </p>
      </div>
    );
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (adminEmails.some((email) => email.toLowerCase() === trimmed)) {
      setErrorMessage('This email is already registered as an authorized admin.');
      return;
    }

    onAddAdmin(trimmed);
    setSuccessMessage(`Admin privileges successfully granted to ${trimmed}.`);
    setNewEmail('');
  };

  const handleRevoke = (emailToRevoke: string) => {
    if (emailToRevoke.toLowerCase() === masterAdminEmail.toLowerCase()) {
      alert('The Master Admin account cannot be revoked.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to revoke admin access for "${emailToRevoke}"? They will no longer be able to access the admin portal.`
    );
    if (confirmed) {
      onRevokeAdmin(emailToRevoke);
      setSuccessMessage(`Admin access revoked for ${emailToRevoke}.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#1B4332]/10 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#E8A33D]" />
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1B4332]">
                Admin Team Management
              </h2>
            </div>
            <p className="text-xs text-[#6B756F] mt-1 max-w-2xl leading-relaxed">
              Authorized administrators can review pending property verifications, inspect physical audit records, and manage live listings across Nigeria.
            </p>
          </div>

          <div className="px-4 py-2 rounded-xl bg-[#1B4332] text-white flex items-center gap-2 text-xs font-semibold shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#E8A33D]" />
            <span>Master Admin Level</span>
          </div>
        </div>
      </div>

      {/* Grid: Form on Left/Top, List on Right/Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grant New Admin Privileges Form */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-[#1B4332]/10 shadow-xs space-y-4 h-fit">
          <div className="flex items-center gap-2 text-sm font-bold font-serif text-[#1B4332] border-b border-[#1B4332]/10 pb-3">
            <UserPlus className="w-4 h-4 text-[#2D6A4F]" />
            <span>Authorize New Admin</span>
          </div>

          <p className="text-xs text-[#6B756F] leading-relaxed">
            Enter the email address of the team member. When they log in via the Auth Portal, the system will recognize them and route directly to this operations dashboard.
          </p>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="new-admin-email"
                className="block text-xs font-semibold text-[#14231C] mb-1"
              >
                Team Member Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B756F]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="new-admin-email"
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin.member@ileya.ng"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>
            </div>

            <button
              type="submit"
              id="submit-add-admin-btn"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#E8A33D] hover:bg-[#d99530] text-[#14231C] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Grant Admin Access</span>
            </button>
          </form>
        </div>

        {/* Active Admins List */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#1B4332]/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#1B4332]/10 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold font-serif text-[#1B4332]">
              <Users className="w-4 h-4 text-[#2D6A4F]" />
              <span>Authorized Admin Accounts</span>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-[#FBF6EC] border border-[#1B4332]/10 text-[#1B4332]">
              {adminEmails.length} Total
            </span>
          </div>

          <div className="space-y-3">
            {adminEmails.map((email) => {
              const isMasterAccount = email.toLowerCase() === masterAdminEmail.toLowerCase();

              return (
                <div
                  key={email}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isMasterAccount
                      ? 'bg-[#FBF6EC] border-[#E8A33D]/50 shadow-xs'
                      : 'bg-white border-[#1B4332]/10 hover:border-[#1B4332]/25'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isMasterAccount
                          ? 'bg-[#1B4332] text-[#E8A33D]'
                          : 'bg-[#2D6A4F]/10 text-[#2D6A4F]'
                      }`}
                    >
                      {isMasterAccount ? (
                        <Crown className="w-5 h-5" />
                      ) : (
                        <ShieldCheck className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-[#14231C] font-mono">
                          {email}
                        </span>
                        {isMasterAccount && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8A33D] text-[#14231C]">
                            Master
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#6B756F] block mt-0.5">
                        {isMasterAccount
                          ? 'Platform Owner • Root Authorization & Team Control'
                          : 'Operations Staff • Inspection & Directory Management'}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isMasterAccount ? (
                      <span className="text-[11px] font-semibold text-[#2D6A4F] bg-[#2D6A4F]/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Protected</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRevoke(email)}
                        id={`revoke-admin-${email.replace(/[@.]/g, '-')}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke Access</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
