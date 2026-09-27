import { describe, expect, it } from 'vitest';

import {
  isStudioCancellationNotification,
  parseStudioCancellationNotification,
} from '../src/notifications/pushPayload';
import { findCancelledBooking } from '../src/notifications/cancellationRouting';
import { initialBookings } from '../src/data/fixtures';

const validPayload = {
  type: 'class_cancelled',
  bookingId: '30000000-0000-4000-8000-000000000003',
  reason: 'Поставка продуктов задерживается',
} as const;

describe('push notification routing', () => {
  it('recognizes a studio cancellation event', () => {
    expect(isStudioCancellationNotification(validPayload)).toBe(true);
    expect(parseStudioCancellationNotification(validPayload)).toEqual(validPayload);
  });

  it.each([
    null,
    [],
    { type: 'marketing', bookingId: validPayload.bookingId, reason: 'Акция' },
    { type: 'class_cancelled', reason: validPayload.reason },
    { type: 'class_cancelled', bookingId: 'booking-1', reason: validPayload.reason },
    { type: 'class_cancelled', bookingId: validPayload.bookingId, reason: '   ' },
    { ...validPayload, reason: 'а'.repeat(501) },
    { ...validPayload, extra: true },
  ])('ignores malformed or unrelated payload: %j', (payload) => {
    expect(isStudioCancellationNotification(payload)).toBe(false);
  });

  it('selects only the cancelled booking addressed by bookingId', () => {
    const cancelled = initialBookings.find((item) => item.status === 'cancelled_by_studio')!;
    const payload = { ...validPayload, bookingId: cancelled.id };

    expect(findCancelledBooking(initialBookings, payload)).toEqual(cancelled);
    expect(
      findCancelledBooking(initialBookings, {
        ...payload,
        bookingId: initialBookings.find((item) => item.status === 'confirmed')!.id,
      }),
    ).toBeUndefined();
  });
});
