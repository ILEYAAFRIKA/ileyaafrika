import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileCheck,
  Grid,
  Image as ImageIcon,
  CheckCircle2,
  MapPin,
  ExternalLink,
  Info
} from 'lucide-react';

export interface VerificationEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  verification_evidence_urls?: string[];
  verificationEvidenceUrls?: string[];
  evidenceUrls?: string[];
  verification_notes?: string;
  verificationNotes?: string;
  propertyTitle?: string;
  propertyLocation?: string;
}

export const VerificationEvidenceModal: React.FC<VerificationEvidenceModalProps> = ({
  isOpen,
  onClose,
  verification_evidence_urls,
  verificationEvidenceUrls,
  evidenceUrls,
  verification_notes,
  verificationNotes,
  propertyTitle = 'Verified Property',
  propertyLocation,
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Consolidate evidence URLs
  const rawUrls =
    verification_evidence_urls ||
    verificationEvidenceUrls ||
    evidenceUrls ||
    [];

  // Filter valid string URLs
  const photos = rawUrls.filter((url): url is string => typeof url === 'string' && url.trim().length > 0);

  const notes = verification_notes || verificationNotes || '';

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxUrl) {
          setLightboxUrl(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, lightboxUrl, onClose]);

  if (!isOpen) return null;

  const isVideo = (url: string) => {
    const clean = url.toLowerCase().split('?')[0];
    return clean.endsWith('.mp4') || clean.endsWith('.mov') || clean.endsWith('.webm') || clean.endsWith('.m4v');
  };

  const nextPhoto = () => {
    if (photos.length === 0) return;
    setActivePhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    if (photos.length === 0) return;
    setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div
      id="verification-evidence-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#1B4332]/15 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4.5 border-b border-[#1B4332]/10 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B4332] text-[#E8A33D] flex items-center justify-center shrink-0 shadow-sm border border-[#E8A33D]/30">
              <ShieldCheck className="w-5 h-5 text-[#E8A33D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-serif text-[#1B4332]">
                  Physical Verification Evidence
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide border border-emerald-300">
                  Verified
                </span>
              </div>
              <p className="text-xs text-[#6B756F] truncate max-w-xs sm:max-w-md">
                {propertyTitle} {propertyLocation ? `• ${propertyLocation}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {photos.length > 1 && (
              <div className="hidden sm:inline-flex p-1 bg-[#FBF6EC] rounded-xl border border-[#1B4332]/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#1B4332] text-white shadow-xs'
                      : 'text-[#14231C] hover:text-[#1B4332]'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('carousel')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === 'carousel'
                      ? 'bg-[#1B4332] text-white shadow-xs'
                      : 'text-[#14231C] hover:text-[#1B4332]'
                  }`}
                  title="Carousel View"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Slide</span>
                </button>
              </div>
            )}

            <button
              type="button"
              id="close-verification-evidence-modal"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#FBF6EC] hover:bg-[#1B4332]/10 text-[#14231C] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
          {/* Trust Banner (Exact Requirement) */}
          <div className="bg-[#FBF6EC] rounded-2xl p-4 sm:p-5 border border-[#1B4332]/15 shadow-xs relative overflow-hidden">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#2D6A4F]/15 text-[#2D6A4F] flex items-center justify-center shrink-0 mt-0.5 border border-[#2D6A4F]/20">
                <CheckCircle2 className="w-5 h-5 text-[#2D6A4F]" />
              </div>
              <div className="space-y-1 text-left flex-1">
                <p className="text-sm sm:text-base font-semibold text-[#14231C] leading-snug">
                  "These photos were taken on-site by Ileya Afrika agents to guarantee this property matches its description and meets our quality standards."
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#2D6A4F] font-medium">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#E8A33D]" /> 24/7 Guaranteed Power Audited
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#E8A33D]" /> Running Water Pressure Tested
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#E8A33D]" /> Access Security Inspected
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* On-Site Inspector Notes */}
          {notes && (
            <div className="bg-white rounded-xl p-4 border border-[#1B4332]/10 shadow-xs flex items-start gap-3">
              <FileCheck className="w-5 h-5 text-[#E8A33D] shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-[#1B4332] uppercase tracking-wider text-[10px] block">
                  Agent Physical Inspection Notes:
                </span>
                <p className="text-[#14231C] leading-relaxed italic">
                  "{notes}"
                </p>
              </div>
            </div>
          )}

          {/* Evidence Photos & Videos */}
          {photos.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#FBF6EC]/50 border border-dashed border-[#1B4332]/20 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#14231C]">
                  Physical Inspection Completed
                </h4>
                <p className="text-xs text-[#6B756F] max-w-md mx-auto">
                  This property was inspected on-site by certified Ileya Afrika field agents. Media records are verified and synced with our central trust database.
                </p>
              </div>
            </div>
          ) : viewMode === 'carousel' ? (
            /* Carousel View */
            <div className="space-y-4">
              <div className="relative aspect-16/10 sm:aspect-16/9 w-full rounded-2xl overflow-hidden bg-black shadow-lg">
                {isVideo(photos[activePhotoIndex]) ? (
                  <video
                    src={photos[activePhotoIndex]}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={photos[activePhotoIndex]}
                    alt={`Verification evidence ${activePhotoIndex + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                )}

                {/* Nav Arrows */}
                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevPhoto}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextPhoto}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/75 text-white text-xs font-mono backdrop-blur-xs">
                      {activePhotoIndex + 1} / {photos.length}
                    </div>
                  </>
                )}

                {/* Badge Overlay */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#1B4332]/90 backdrop-blur-xs text-[#E8A33D] text-xs font-bold flex items-center gap-1.5 border border-[#E8A33D]/30 shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>On-Site Agent Capture</span>
                </div>
              </div>

              {/* Thumbnails Row */}
              {photos.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {photos.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActivePhotoIndex(index)}
                      className={`relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        activePhotoIndex === index
                          ? 'border-[#E8A33D] ring-2 ring-[#E8A33D]/30'
                          : 'border-[#1B4332]/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Thumb ${index + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Responsive Image Grid */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#6B756F]">
                <span className="font-semibold text-[#14231C]">
                  Audited On-Site Assets ({photos.length})
                </span>
                <span>Click any asset to zoom</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((url, idx) => {
                  const videoItem = isVideo(url);
                  return (
                    <div
                      key={idx}
                      onClick={() => setLightboxUrl(url)}
                      className="group relative aspect-4/3 rounded-2xl overflow-hidden bg-black/5 border border-[#1B4332]/15 shadow-xs hover:shadow-md transition-all cursor-pointer"
                    >
                      {videoItem ? (
                        <video
                          src={url}
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={url}
                          alt={`Verification evidence file ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                      )}

                      {/* Top Overlay Badge */}
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#E8A33D]" />
                        <span>Audit Photo #{idx + 1}</span>
                      </div>

                      {/* Hover Fullscreen Icon */}
                      <div className="absolute inset-0 bg-[#1B4332]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-xs flex items-center justify-center text-white shadow-md">
                          <Maximize2 className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#1B4332]/10 bg-[#FBF6EC]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B756F]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
            <span>Audit conducted in accordance with Ileya Afrika Physical Standards</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#1B4332] text-white font-bold hover:bg-[#143427] transition-all cursor-pointer shadow-xs"
          >
            Close Evidence Viewer
          </button>
        </div>
      </div>

      {/* Fullscreen Lightbox for Grid View clicks */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {isVideo(lightboxUrl) ? (
              <video
                src={lightboxUrl}
                controls
                autoPlay
                className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain"
              />
            ) : (
              <img
                src={lightboxUrl}
                alt="Enlarged verification evidence"
                referrerPolicy="no-referrer"
                className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
