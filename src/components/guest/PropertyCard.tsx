import React from 'react';
import {
  ShieldCheck,
  MapPin,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  Zap,
  Droplets,
  Wifi,
  Waves
} from 'lucide-react';
import { PropertyListing } from '../../types';

interface PropertyCardProps {
  listing: PropertyListing;
  onSelectAndBook: (listing: PropertyListing) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  listing,
  onSelectAndBook,
}) => {
  const isAvailable = !listing.isBooked;

  const mainPhoto =
    (listing.photos && listing.photos.length > 0 && listing.photos[0]) ||
    (listing.images && listing.images.length > 0 && listing.images[0]) ||
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80';

  return (
    <div className="bg-white rounded-2xl border border-[#1B4332]/10 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group">
      {/* Property Image Container */}
      <div className="relative aspect-4/3 w-full bg-[#14231C] overflow-hidden">
        <img
          src={mainPhoto}
          alt={listing.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Physical Verification Badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#1B4332]/95 backdrop-blur-xs text-[#E8A33D] text-[11px] font-bold flex items-center gap-1.5 shadow-md border border-[#E8A33D]/30">
          <ShieldCheck className="w-3.5 h-3.5 text-[#E8A33D]" />
          <span>Physically Verified by Ileya</span>
        </div>

        {/* Live Availability Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 backdrop-blur-xs ${
              isAvailable
                ? 'bg-emerald-500/90 text-white border border-emerald-400/40'
                : 'bg-amber-500/90 text-white border border-amber-400/40'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAvailable ? 'bg-white animate-pulse' : 'bg-white'
              }`}
            />
            <span>{isAvailable ? 'Available Now' : 'Currently Booked'}</span>
          </span>
        </div>

        {/* Property Type Floating Pill */}
        <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium">
          {listing.propertyType}
        </div>
      </div>

      {/* Property Details Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Location Line */}
          <div className="flex items-center gap-1 text-xs font-semibold text-[#2D6A4F]">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#2D6A4F]" />
            <span className="truncate">
              {listing.cityArea}, {listing.state} State
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold font-serif text-[#14231C] line-clamp-1 group-hover:text-[#1B4332] transition-colors">
            {listing.title}
          </h3>

          {/* Brief Snippet */}
          <p className="text-xs text-[#6B756F] line-clamp-2 leading-relaxed">
            {listing.description}
          </p>

          {/* Key Amenities Preview */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {listing.amenities.slice(0, 3).map((amenity, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-[#FBF6EC] border border-[#1B4332]/10 text-[10px] font-medium text-[#1B4332]"
                >
                  {amenity}
                </span>
              ))}
              {listing.amenities.length > 3 && (
                <span className="text-[10px] text-[#6B756F] self-center">
                  +{listing.amenities.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer: Price & CTA */}
        <div className="pt-3 border-t border-[#1B4332]/10 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-[#6B756F] block">Daily Rate</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold font-serif text-[#1B4332]">
                ₦{listing.pricePerDay.toLocaleString()}
              </span>
              <span className="text-[11px] text-[#6B756F]">/ day</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectAndBook(listing)}
            id={`select-book-${listing.id}`}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E8A33D] hover:bg-[#d99530] text-[#14231C] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Select & Book</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
