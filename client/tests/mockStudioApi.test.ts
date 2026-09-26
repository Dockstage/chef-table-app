import { describe, expect, it } from 'vitest';

import { initialBookings, initialClasses } from '../src/data/fixtures';
import { MockStudioApi } from '../src/data/mockStudioApi';
import { StudioApiError } from '../src/domain/types';

describe('MockStudioApi booking invariants', () => {
  it('returns classes inside the requested extended date range', async () => {
    const api = new MockStudioApi(initialClasses, initialBookings);
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 14);

    const classes = await api.getClasses({ from: from.toISOString(), to: to.toISOString() });
    expect(classes.some((item) => item.title === 'Хлеб на закваске')).toBe(true);
    expect(classes.some((item) => item.title === 'Грузинское застолье')).toBe(false);
  });

  it('rejects a second active booking for the same client and class', async () => {
    const api = new MockStudioApi(initialClasses, initialBookings);

    await expect(
      api.createBooking(
        {
          classId: initialBookings[0]!.classId,
          equipmentOption: 'own',
          allergyNotes: 'Нет',
        },
        'attempt-1',
      ),
    ).rejects.toMatchObject({ code: 'DUPLICATE_BOOKING' } satisfies Partial<StudioApiError>);
  });

  it('returns SLOT_CANCELLED when booking a class cancelled by the studio', async () => {
    const api = new MockStudioApi(initialClasses, initialBookings);
    const cancelledClass = initialClasses.find((item) => item.status === 'cancelled')!;

    await expect(
      api.createBooking(
        {
          classId: cancelledClass.id,
          equipmentOption: 'own',
          allergyNotes: 'Нет',
        },
        'attempt-2',
      ),
    ).rejects.toMatchObject({ code: 'SLOT_CANCELLED' } satisfies Partial<StudioApiError>);
  });

  it('decrements the seat count after a successful booking', async () => {
    const api = new MockStudioApi(initialClasses, []);
    const target = initialClasses[0]!;
    const before = target.availableSeats;

    await api.createBooking(
      {
        classId: target.id,
        equipmentOption: 'rental',
        allergyNotes: '',
      },
      'attempt-3',
    );

    const updated = (await api.getClasses()).find((item) => item.id === target.id)!;
    expect(updated.availableSeats).toBe(before - 1);
  });

  it('rejects rental when no working kits are available', async () => {
    const api = new MockStudioApi(initialClasses, []);
    const target = initialClasses.find(
      (item) => item.status === 'scheduled' && item.availableRentalKits === 0,
    )!;

    await expect(
      api.createBooking(
        {
          classId: target.id,
          equipmentOption: 'rental',
          allergyNotes: 'Нет',
        },
        'attempt-4',
      ),
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

    const updated = await api.submitReview({
      bookingId: attended.id,
      rating: 5,
      comment: 'Понятно объясняет технику.',
    });
    expect(updated.rating).toBe(5);
    expect(updated.reviewComment).toBe('Понятно объясняет технику.');
    await expect(api.submitReview({ bookingId: attended.id, rating: 4 })).rejects.toMatchObject({
      code: 'REVIEW_NOT_ALLOWED',
    });
  });

  it.each([0, 6, 1.5])('rejects an out-of-range rating: %s', async (rating) => {
    const api = new MockStudioApi(initialClasses, initialBookings);
    const attended = initialBookings.find((item) => item.status === 'attended')!;

    await expect(api.submitReview({ bookingId: attended.id, rating })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('accepts empty/500-character comments and rejects 501 characters', async () => {
    const attended = initialBookings.find((item) => item.status === 'attended')!;
    const emptyCommentApi = new MockStudioApi(initialClasses, initialBookings);
    const withoutComment = await emptyCommentApi.submitReview({
      bookingId: attended.id,
      rating: 5,
      comment: '',
    });
    expect(withoutComment.reviewComment).toBeNull();

    const acceptedApi = new MockStudioApi(initialClasses, initialBookings);
    const updated = await acceptedApi.submitReview({
      bookingId: attended.id,
      rating: 1,
      comment: 'а'.repeat(500),
    });
    expect(updated.reviewComment).toHaveLength(500);

    const rejectedApi = new MockStudioApi(initialClasses, initialBookings);
    await expect(
      rejectedApi.submitReview({
        bookingId: attended.id,
        rating: 5,
        comment: 'а'.repeat(501),
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('accepts 300 allergy characters and rejects 301', async () => {
    const acceptedApi = new MockStudioApi(initialClasses, []);
    const accepted = await acceptedApi.createBooking(
      {
        classId: initialClasses[0]!.id,
        equipmentOption: 'own',
        allergyNotes: 'а'.repeat(300),
      },
      'attempt-allergy-limit-accepted',
    );
    expect(accepted.allergyNotes).toHaveLength(300);

    const rejectedApi = new MockStudioApi(initialClasses, []);

    await expect(
      rejectedApi.createBooking(
        {
          classId: initialClasses[0]!.id,
          equipmentOption: 'own',
          allergyNotes: 'а'.repeat(301),
        },
        'attempt-allergy-limit',
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});
