import {
  Booking,
  CookingClass,
  CreateBookingInput,
  StudioApi,
  StudioApiError,
} from '../../domain/types';

type BookingApi = Pick<StudioApi, 'createBooking' | 'getClass'>;
type CancellationApi = Pick<StudioApi, 'cancelBooking' | 'getBookings'>;

export type BookingExecutionResult =
  | { kind: 'created'; booking: Booking }
  | { kind: 'rejected'; error: unknown; latestClass?: CookingClass };

export type CancellationExecutionResult =
  | { kind: 'cancelled'; booking: Booking }
  | { kind: 'rejected'; error: unknown; latestBooking?: Booking };

const refreshableConflictCodes = new Set([
  'SLOT_FULL',
  'SLOT_CANCELLED',
  'RENTAL_UNAVAILABLE',
]);

export async function executeBooking(
  api: BookingApi,
  input: CreateBookingInput,
  idempotencyKey: string,
): Promise<BookingExecutionResult> {
  try {
    return { kind: 'created', booking: await api.createBooking(input, idempotencyKey) };
  } catch (error) {
    if (error instanceof StudioApiError && refreshableConflictCodes.has(error.code)) {
      try {
        return { kind: 'rejected', error, latestClass: await api.getClass(input.classId) };
      } catch {
        // The original booking conflict is more useful than a secondary refresh failure.
      }
    }
    return { kind: 'rejected', error };
  }
}

export async function executeCancellation(
  api: CancellationApi,
  bookingId: string,
): Promise<CancellationExecutionResult> {
  try {
    return { kind: 'cancelled', booking: await api.cancelBooking(bookingId) };
  } catch (error) {
    if (error instanceof StudioApiError && error.code === 'BOOKING_NOT_ACTIVE') {
      try {
        const bookings = await api.getBookings();
        return {
          kind: 'rejected',
          error,
          latestBooking: bookings.find((item) => item.id === bookingId),
        };
      } catch {
        // Keep the actionable cancellation conflict if the follow-up read fails.
      }
    }
    return { kind: 'rejected', error };
  }
}

export function upsertBooking(bookings: Booking[], booking: Booking): Booking[] {
  return [booking, ...bookings.filter((item) => item.id !== booking.id)];
}

export function replaceCookingClass(
  classes: CookingClass[],
  latestClass: CookingClass,
): CookingClass[] {
  return classes.map((item) => (item.id === latestClass.id ? latestClass : item));
}

export async function finalizeBookingMutation(
  booking: Booking,
  applyBooking: (booking: Booking) => void,
  refresh: () => Promise<void>,
): Promise<'refreshed' | 'stale'> {
  applyBooking(booking);
  try {
    await refresh();
    return 'refreshed';
  } catch {
    return 'stale';
  }
}
