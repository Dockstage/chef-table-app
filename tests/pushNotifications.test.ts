import { describe, expect, it } from 'vitest';

import { isStudioCancellationNotification } from '../src/notifications/pushPayload';

describe('push notification routing', () => {
  it('recognizes a studio cancellation event', () => {
    expect(
      isStudioCancellationNotification({
        type: 'class_cancelled',
        bookingId: 'booking-1',
      }),
    ).toBe(true);
  });

  it('ignores unrelated notifications', () => {
    expect(isStudioCancellationNotification({ type: 'marketing' })).toBe(false);
  });
});
