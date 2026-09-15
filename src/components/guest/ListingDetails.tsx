import React from 'react';
import { BookingModal } from './BookingModal';
import { PropertyListing, GuestBooking } from '../../types';

export interface ListingDetailsProps {
  listing: PropertyListing;
  guestFullName?: string;
  guestEmail?: string;
  initialCheckInDate?: Date | null;
  initialCheckOutDate?: Date | null;
  onClose: () => void;
  onConfirmBooking?: (bookingData: GuestBooking | any) => void;
}

/**
 * ListingDetails Component (with Interactive "Verified by Ileya Afrika" Badge & Verification Evidence Modal)
 */
export const ListingDetails: React.FC<ListingDetailsProps> = ({
  listing,
  guestFullName = 'Guest',
  guestEmail = 'guest@ileya.ng',
  initialCheckInDate,
  initialCheckOutDate,
  onClose,
  onConfirmBooking = () => {},
}) => {
  return (
    <BookingModal
      listing={listing}
      guestFullName={guestFullName}
      guestEmail={guestEmail}
      initialCheckInDate={initialCheckInDate}
      initialCheckOutDate={initialCheckOutDate}
      onClose={onClose}
      onConfirmBooking={onConfirmBooking}
    />
  );
};

export default ListingDetails;
