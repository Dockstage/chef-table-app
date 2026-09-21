import { describe, expect, it } from 'vitest';

import { initialBookings, initialClasses } from '../src/data/fixtures';
import { MockStudioApi } from '../src/data/mockStudioApi';
import { StudioApiError } from '../src/domain/types';

describe('MockStudioApi booking invariants', () => {
  it('rejects a second active booking for the same client and class', async () => {
    const api = new MockStudioApi(initialClasses, initialBookings);

    await expect(
      api.createBooking({
        classId: initialBookings[0]!.classId,
        equipmentOption: 'own',
        allergyNotes: 'Нет',
      }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_BOOKING' } satisfies Partial<StudioApiError>);
  });

  it('returns SLOT_CANCELLED when booking a class cancelled by the studio', async () => {
    const api = new MockStudioApi(initialClasses, initialBookings);
    const cancelledClass = initialClasses.find((item) => item.status === 'cancelled')!;

    await expect(
      api.createBooking({
        classId: cancelledClass.id,
        equipmentOption: 'own',
        allergyNotes: 'Нет',
      }),
    ).rejects.toMatchObject({ code: 'SLOT_CANCELLED' } satisfies Partial<StudioApiError>);
  });

  it('decrements the seat count after a successful booking', async () => {
    const api = new MockStudioApi(initialClasses, []);
    const target = initialClasses[0]!;
    const before = target.availableSeats;

    await api.createBooking({
      classId: target.id,
      equipmentOption: 'rental',
      allergyNotes: '',
    });

    const updated = (await api.getClasses()).find((item) => item.id === target.id)!;
    expect(updated.availableSeats).toBe(before - 1);
  });

  it('rejects rental when no working kits are available', async () => {
    const api = new MockStudioApi(initialClasses, []);
    const target = initialClasses.find(
      (item) => item.status === 'scheduled' && item.availableRentalKits === 0,
    )!;

    await expect(
      api.createBooking({
        classId: target.id,
        equipmentOption: 'rental',
        allergyNotes: 'Нет',
      }),
    ).rejects.toMatchObject({ code: 'RENTAL_UNAVAILABLE' } satisfies Partial<StudioApiError>);
  });

  it('returns a rented kit to the available stock after cancellation', async () => {
    const api = new MockStudioApi(initialClasses, initialBookings);
    const rentalBooking = initialBookings.find(
      (item) => item.status === 'confirmed' && item.equipmentOption === 'rental',
    )!;
    const targetBefore = (await api.getClasses()).find(
      (item) => item.id === rentalBooking.classId,
    )!;

    await api.cancelBooking(rentalBooking.id);

    const targetAfter = (await api.getClasses()).find(
      (item) => item.id === rentalBooking.classId,
    )!;
    expect(targetAfter.availableRentalKits).toBe(targetBefore.availableRentalKits + 1);
  });

  it('accepts one review and rejects a repeated review', async () => {
    const api = new MockStudioApi(initialClasses, initialBookings);
    const attended = initialBookings.find((item) => item.status === 'attended')!;

    const updated = await api.submitReview({ bookingId: attended.id, rating: 5 });
    expect(updated.rating).toBe(5);
    await expect(api.submitReview({ bookingId: attended.id, rating: 4 })).rejects.toMatchObject({
      code: 'REVIEW_NOT_ALLOWED',
    });
  });
});
