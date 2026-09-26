import { Booking } from '../domain/types';
import { StudioCancellationNotification } from './pushPayload';

export function findCancelledBooking(
  bookings: Booking[],
  payload: StudioCancellationNotification,
): Booking | undefined {
  return bookings.find(
    (item) => item.id === payload.bookingId && item.status === 'cancelled_by_studio',
  );
}
