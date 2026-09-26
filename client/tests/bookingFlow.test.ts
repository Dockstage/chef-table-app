import { describe, expect, it, vi } from 'vitest';

import { initialClasses } from '../src/data/fixtures';
import {
  executeBooking,
  finalizeBookingCreation,
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
};

describe('booking flow', () => {
  it('applies a successful mutation before a failed refresh', async () => {
    const events: string[] = [];
    const status = await finalizeBookingCreation(
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
});
