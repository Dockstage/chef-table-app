import { describe, expect, it, vi } from 'vitest';

import { initialClasses } from '../src/data/fixtures';
import {
  executeBooking,
  executeCancellation,
  finalizeBookingMutation,
  replaceCookingClass,
  upsertBooking,
} from '../src/features/booking/bookingFlow';
import { Booking, StudioApiError } from '../src/domain/types';

const input = {
  classId: initialClasses[0]!.id,
  equipmentOption: 'own' as const,
  allergyNotes: 'Орехи',
};

const booking: Booking = {
  id: 'booking-new',
  classId: input.classId,
  status: 'confirmed',
  equipmentOption: 'own',
  allergyNotes: input.allergyNotes,
  totalPriceKopecks: 450000,
  createdAt: '2026-09-27T12:00:00.000Z',
  studioCancellationReason: null,
  rating: null,
  reviewComment: null,
};

describe('booking flow', () => {
  it('applies a successful mutation before a failed refresh', async () => {
    const events: string[] = [];
    const status = await finalizeBookingMutation(
      booking,
      () => events.push('created'),
      async () => {
        events.push('refresh');
        throw new Error('offline');
      },
    );

    expect(events).toEqual(['created', 'refresh']);
    expect(status).toBe('stale');
  });

  it('refreshes the selected class after a booking conflict', async () => {
    const latestClass = { ...initialClasses[0]!, availableSeats: 0 };
    const api = {
      createBooking: vi.fn().mockRejectedValue(new StudioApiError('SLOT_FULL', 'Мест нет.')),
      getClass: vi.fn().mockResolvedValue(latestClass),
    };

    const result = await executeBooking(api, input, 'attempt-1');

    expect(result).toEqual({
      kind: 'rejected',
      error: expect.objectContaining({ code: 'SLOT_FULL' }),
      latestClass,
    });
    expect(api.getClass).toHaveBeenCalledWith(input.classId);
  });

  it('updates local data without duplicating the created booking', () => {
    expect(upsertBooking([booking], booking)).toEqual([booking]);
    const latestClass = { ...initialClasses[0]!, availableSeats: 0 };
    expect(replaceCookingClass(initialClasses, latestClass)[0]).toEqual(latestClass);
  });

  it('applies cancellation before reporting a stale refresh', async () => {
    const cancelled = { ...booking, status: 'cancelled_by_client' as const };
    const applied: Booking[] = [];

    const status = await finalizeBookingMutation(
      cancelled,
      (updated) => applied.push(updated),
      async () => Promise.reject(new Error('offline')),
    );

    expect(applied).toEqual([cancelled]);
    expect(status).toBe('stale');
  });

  it('loads the latest booking after a repeated cancellation conflict', async () => {
    const cancelled = { ...booking, status: 'cancelled_by_client' as const };
    const api = {
      cancelBooking: vi
        .fn()
        .mockRejectedValue(new StudioApiError('BOOKING_NOT_ACTIVE', 'Статус уже изменился.')),
      getBookings: vi.fn().mockResolvedValue([cancelled]),
    };

    const result = await executeCancellation(api, booking.id);

    expect(result).toEqual({
      kind: 'rejected',
      error: expect.objectContaining({ code: 'BOOKING_NOT_ACTIVE' }),
      latestBooking: cancelled,
    });
    expect(api.getBookings).toHaveBeenCalledOnce();
  });

  it('applies a saved review before reporting a stale refresh', async () => {
    const reviewed = { ...booking, status: 'attended' as const, rating: 5 };
    const applied: Booking[] = [];

    const status = await finalizeBookingMutation(
      reviewed,
      (updated) => applied.push(updated),
      async () => Promise.reject(new Error('offline')),
    );

    expect(applied).toEqual([reviewed]);
    expect(status).toBe('stale');
  });
});
