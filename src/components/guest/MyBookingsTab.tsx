import React from 'react';
import {
  Calendar,
  Compass,
  Clock,
  CheckCircle2,
  Building2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Luggage
} from 'lucide-react';
import { GuestBooking } from '../../types';
import { BookingHistoryCard } from './BookingHistoryCard';

interface MyBookingsTabProps {
  myBookings: GuestBooking[];
  onExploreClick: () => void;
}

export const MyBookingsTab: React.FC<MyBookingsTabProps> = ({
  myBookings,
  onExploreClick,
}) => {
  const today = new Date().toISOString().split('T')[0];

  // Deduplicate bookings array by unique booking id to guarantee React renders each item once
  const uniqueBookings = React.useMemo(() => {
    const seen = new Set<string>();
    return myBookings.filter((b) => {
      if (!b?.id || seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });
  }, [myBookings]);

  // Split into Upcoming Trips vs Past Bookings based on checkout date
  const upcomingTrips = uniqueBookings.filter((b) => b.checkOutDate >= today);
  const pastBookings = uniqueBookings.filter((b) => b.checkOutDate < today);

  // If no bookings at all, render the requested empty state
  if (uniqueBookings.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 sm:p-16 border border-[#1B4332]/10 text-center shadow-xs space-y-5 max-w-2xl mx-auto my-6">
        <div className="w-16 h-16 rounded-2xl bg-[#FBF6EC] text-[#2D6A4F] flex items-center justify-center mx-auto shadow-inner">
          <Luggage className="w-8 h-8 text-[#2D6A4F]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold font-serif text-[#1B4332]">
            You haven't booked any apartments yet.
          </h2>
          <p className="text-xs text-[#6B756F] leading-relaxed max-w-md mx-auto">
            Discover physically verified Nigerian short-lets with guaranteed power backup, treated water supply, and gated security across Lagos, Abuja, and more.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={onExploreClick}
            id="explore-verified-stays-btn"
            className="px-6 py-3 rounded-xl text-xs font-bold bg-[#E8A33D] hover:bg-[#d99530] text-[#14231C] transition-all inline-flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Verified Stays</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#1B4332]/10 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Luggage className="w-5 h-5 text-[#E8A33D]" />
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1B4332]">
                My Booking History
              </h2>
            </div>
            <p className="text-xs text-[#6B756F] mt-1 max-w-2xl leading-relaxed">
              Track your confirmed reservations, access direct navigation coordinates, and message verified hosts anytime.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20">
              {upcomingTrips.length} Upcoming
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-[#FBF6EC] text-[#14231C] border border-[#1B4332]/10">
              {pastBookings.length} Past
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Upcoming Trips */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1B4332]/10 pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#2D6A4F]" />
            <h3 className="text-base font-bold font-serif text-[#1B4332]">
              Upcoming Trips
            </h3>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#2D6A4F]/10 text-[#2D6A4F]">
            {upcomingTrips.length}
          </span>
        </div>

        {upcomingTrips.length > 0 ? (
          <div className="space-y-4">
            {upcomingTrips.map((booking) => (
              <BookingHistoryCard
                key={booking.id}
                booking={booking}
                isPast={false}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-white border border-[#1B4332]/10 text-center text-xs text-[#6B756F]">
            <span>No upcoming trips scheduled.</span>
          </div>
        )}
      </section>

      {/* Section 2: Past Bookings */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-[#1B4332]/10 pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#6B756F]" />
            <h3 className="text-base font-bold font-serif text-[#1B4332]">
              Past Bookings
            </h3>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
            {pastBookings.length}
          </span>
        </div>

        {pastBookings.length > 0 ? (
          <div className="space-y-4">
            {pastBookings.map((booking) => (
              <BookingHistoryCard
                key={booking.id}
                booking={booking}
                isPast={true}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-white border border-[#1B4332]/10 text-center text-xs text-[#6B756F]">
            <span>No past stays recorded yet.</span>
          </div>
        )}
      </section>
    </div>
  );
};
