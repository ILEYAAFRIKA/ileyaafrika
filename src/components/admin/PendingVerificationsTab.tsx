import React, { useState } from 'react';
import {
  ClipboardCheck,
  MapPin,
  Building2,
  Phone,
  CreditCard,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  AlertCircle,
  Eye,
  ChevronRight
} from 'lucide-react';
import { PropertyListing } from '../../types';

interface PendingVerificationsTabProps {
  pendingListings: PropertyListing[];
  onApproveListing: (id: string, inspectionNotes?: string) => void;
  onRejectListing: (id: string, reason: string) => void;
}

export const PendingVerificationsTab: React.FC<PendingVerificationsTabProps> = ({
  pendingListings,
  onApproveListing,
  onRejectListing,
}) => {
  const [rejectingListingId, setRejectingListingId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);

  // Helper to format Nigerian phone numbers for WhatsApp API
  const getCleanWhatsAppLink = (phoneStr: string) => {
    let cleaned = phoneStr.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.slice(1);
    } else if (!cleaned.startsWith('234') && cleaned.length === 10) {
      cleaned = '234' + cleaned;
    }
    const message = encodeURIComponent('Hello, this is Ileya Verification Team');
    return `https://wa.me/${cleaned}?text=${message}`;
  };

  const handleOpenRejectModal = (id: string) => {
    setRejectingListingId(id);
    setRejectionReasonInput('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingListingId) return;
    const reason = rejectionReasonInput.trim() || 'Property did not meet Ileya physical verification standards.';
    onRejectListing(rejectingListingId, reason);
    setRejectingListingId(null);
    setRejectionReasonInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#1B4332]/10 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E8A33D] animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1B4332]">
                Pending Physical Verifications
              </h2>
            </div>
            <p className="text-xs text-[#6B756F] mt-1 max-w-2xl leading-relaxed">
              Every short-let apartment listed on Ileya must undergo physical on-ground inspection by our operations team in Lagos, Abuja, Port Harcourt, or Ibadan before it goes live to guests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-[#FBF6EC] border border-[#1B4332]/10 text-center">
              <span className="block text-2xl font-bold text-[#1B4332] font-mono">
                {pendingListings.length}
              </span>
              <span className="text-[11px] font-semibold text-[#6B756F]">
                Queue Total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Queue List */}
      {pendingListings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 sm:p-16 text-center border border-[#1B4332]/10 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center mx-auto mb-4 border border-[#2D6A4F]/20">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#14231C] font-serif">
            No Pending Verifications
          </h3>
          <p className="text-xs text-[#6B756F] max-w-md mx-auto mt-2 leading-relaxed">
            The verification approval queue is currently empty. As soon as hosts submit new short-let properties, they will appear here for physical inspection scheduling and approval.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingListings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-2xl border border-[#1B4332]/15 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-5 sm:p-7">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left: Photos & Main Info */}
                  <div className="flex-1 space-y-4">
                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#E8A33D]/20 text-[#14231C] border border-[#E8A33D]/40 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#E8A33D]" />
                        <span>Awaiting Physical Inspection</span>
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1B4332]/10 text-[#1B4332]">
                        {listing.propertyType}
                      </span>
                      <span className="text-xs font-mono text-[#6B756F]">
                        ID: {listing.id}
                      </span>
                      <span className="text-xs text-[#6B756F] ml-auto">
                        Submitted: {listing.createdAt}
                      </span>
                    </div>

                    {/* Title & Location */}
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#14231C] font-serif">
                        {listing.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-[#6B756F] mt-1">
                        <MapPin className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                        <span>
                          {listing.streetAddress}, {listing.cityArea}, <strong>{listing.state}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Price Banner */}
                    <div className="inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-xl bg-[#FBF6EC] border border-[#1B4332]/10">
                      <span className="text-xs font-semibold text-[#6B756F]">Daily Rate:</span>
                      <span className="text-base font-bold text-[#1B4332] font-mono">
                        ₦{listing.pricePerDay.toLocaleString()}
                      </span>
                      <span className="text-xs text-[#6B756F]">/ night</span>
                    </div>

                    {/* Amenities list */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B756F] block mb-1.5">
                        Claimed Amenities ({listing.amenities.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {listing.amenities.map((amenity, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#FBF6EC] border border-[#1B4332]/10 text-[#14231C]"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Photos Preview Strip */}
                    {((listing.photos && listing.photos.length > 0) || (listing.images && listing.images.length > 0)) && (
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B756F] block mb-1.5">
                          Uploaded Photos ({(listing.photos || listing.images || []).length}):
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {(listing.photos || listing.images || []).map((imgUrl, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setPreviewPhotoModal(imgUrl)}
                              className="relative w-20 h-16 rounded-xl overflow-hidden border border-[#1B4332]/15 hover:opacity-90 shrink-0 cursor-pointer group"
                            >
                              <img
                                src={imgUrl}
                                alt={`Property photo ${i + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-[#1B4332]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="w-4 h-4" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Host Verification & Bank Details Box */}
                  <div className="w-full lg:w-80 bg-[#FBF6EC] rounded-xl p-5 border border-[#1B4332]/10 space-y-4 shrink-0">
                    <div className="border-b border-[#1B4332]/10 pb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F] block mb-1">
                        Host Information
                      </span>
                      <p className="text-sm font-bold text-[#14231C]">
                        {listing.hostFullName || 'Host Adewale'}
                      </p>
                      <p className="text-xs text-[#6B756F] truncate">
                        {listing.hostEmail || 'host@ileya.ng'}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-[#1B4332] font-mono mt-1 font-semibold">
                        <Phone className="w-3.5 h-3.5 text-[#2D6A4F]" />
                        <span>{listing.hostWhatsApp}</span>
                      </div>
                    </div>

                    {/* Host Bank Settlement Details */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F] flex items-center gap-1 mb-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-[#2D6A4F]" />
                        <span>NUBAN Settlement Account</span>
                      </span>
                      <div className="bg-white rounded-lg p-3 border border-[#1B4332]/10 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[#6B756F]">Bank:</span>
                          <strong className="text-[#14231C] text-right">
                            {listing.hostBankDetails?.bankName || 'Guaranty Trust Bank (GTBank)'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B756F]">Account No:</span>
                          <strong className="text-[#1B4332] font-mono">
                            {listing.hostBankDetails?.accountNumber || '0123456789'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B756F]">Account Name:</span>
                          <strong className="text-[#14231C] text-right">
                            {listing.hostBankDetails?.accountName || 'ADEWALE BABATUNDE O.'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Actions Group */}
                    <div className="space-y-2 pt-2">
                      {/* WhatsApp Trigger Button */}
                      <a
                        href={getCleanWhatsAppLink(listing.hostWhatsApp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        id={`whatsapp-btn-${listing.id}`}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Message Host on WhatsApp</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </a>

                      {/* Approve & Publish Button */}
                      <button
                        type="button"
                        onClick={() => onApproveListing(listing.id)}
                        id={`approve-btn-${listing.id}`}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#E8A33D] hover:bg-[#d99530] text-[#14231C] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#14231C]" />
                        <span>Approve & Publish</span>
                      </button>

                      {/* Reject Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenRejectModal(listing.id)}
                        id={`reject-btn-${listing.id}`}
                        className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Listing</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingListingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14231C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#1B4332]/10 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold font-serif text-[#14231C]">
                  Reject Property Submission
                </h4>
                <span className="text-xs text-[#6B756F]">
                  Listing ID: {rejectingListingId}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#6B756F] leading-relaxed">
              Please specify the reason for rejection. This feedback helps the host address any issues regarding physical inspection or required safety standards.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#14231C] mb-1.5">
                  Rejection Reason
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="e.g. Generator backup not functioning during physical inspection; or inaccurate address coordinates."
                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-[#1B4332]/20 text-[#14231C] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1B4332]/10">
                <button
                  type="button"
                  onClick={() => setRejectingListingId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B756F] hover:bg-gray-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer shadow-sm"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhotoModal && (
        <div
          onClick={() => setPreviewPhotoModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14231C]/80 backdrop-blur-xs cursor-pointer"
        >
          <div className="max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-black border border-white/20 p-2">
            <img
              src={previewPhotoModal}
              alt="Listing enlarged"
              referrerPolicy="no-referrer"
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
