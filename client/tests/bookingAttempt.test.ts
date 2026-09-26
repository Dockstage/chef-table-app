import { describe, expect, it, vi } from 'vitest';

import { getOrCreateBookingAttempt } from '../src/features/booking/bookingAttempt';

const input = {
  classId: 'class-1',
  equipmentOption: 'own' as const,
  allergyNotes: 'Орехи',
};

describe('booking attempt', () => {
  it('keeps one idempotency key when the same payload is retried', () => {
    const keyFactory = vi.fn(() => 'key-1');
    const first = getOrCreateBookingAttempt(input, null, keyFactory);
    const retry = getOrCreateBookingAttempt(input, first, keyFactory);

    expect(retry.idempotencyKey).toBe('key-1');
    expect(keyFactory).toHaveBeenCalledTimes(1);
  });

  it('starts a new attempt after the payload changes', () => {
    const keyFactory = vi.fn().mockReturnValueOnce('key-1').mockReturnValueOnce('key-2');
    const first = getOrCreateBookingAttempt(input, null, keyFactory);
    const changed = getOrCreateBookingAttempt(
      { ...input, equipmentOption: 'rental' },
      first,
      keyFactory,
    );

    expect(changed.idempotencyKey).toBe('key-2');
    expect(keyFactory).toHaveBeenCalledTimes(2);
  });
});
