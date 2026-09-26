import { describe, expect, it, vi } from 'vitest';

import { initialBookings, initialClasses } from '../src/data/fixtures';
import { loadStudioSnapshot } from '../src/features/schedule/loadStudioSnapshot';

const query = {
  from: '2026-09-27T00:00:00.000Z',
  to: '2026-10-04T00:00:00.000Z',
};

describe('loadStudioSnapshot', () => {
  it('keeps bookings when the schedule request fails', async () => {
    const api = {
      getClasses: vi.fn().mockRejectedValue(new Error('schedule offline')),
      getBookings: vi.fn().mockResolvedValue([initialBookings[0]]),
      getClass: vi.fn().mockResolvedValue(initialClasses[4]),
    };

    const result = await loadStudioSnapshot(api, query, []);

    expect(result.scheduleResult.status).toBe('rejected');
    expect(result.bookingsResult).toMatchObject({ status: 'fulfilled' });
    expect(result.detailResults).toHaveLength(1);
  });

  it('returns partial class details without rejecting the whole snapshot', async () => {
    const api = {
      getClasses: vi.fn().mockResolvedValue([]),
      getBookings: vi.fn().mockResolvedValue(initialBookings.slice(0, 2)),
      getClass: vi
        .fn()
        .mockResolvedValueOnce(initialClasses[4])
        .mockRejectedValueOnce(new Error('archived class unavailable')),
    };

    const result = await loadStudioSnapshot(api, query, []);

    expect(result.bookingsResult.status).toBe('fulfilled');
    expect(result.detailResults.map((item) => item.status)).toEqual([
      'fulfilled',
      'rejected',
    ]);
  });
});
