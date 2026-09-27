import { describe, expect, it } from 'vitest';

import { initialBookings, initialClasses } from '../src/data/fixtures';
import {
  canCancelBooking,
  canReview,
  filterClasses,
  filterBookings,
  formatTime,
  getBookingTotal,
  getScheduleQuery,
  getStudioDateKey,
  getStudioDateTimeIso,
  isBookable,
} from '../src/domain/policies';

describe('booking price', () => {
  const cookingClass = initialClasses[0]!;

  it('uses base price when the guest brings equipment', () => {
    expect(getBookingTotal(cookingClass, 'own')).toBe(cookingClass.priceKopecks);
  });

  it('adds the rental tariff exactly once', () => {
    expect(getBookingTotal(cookingClass, 'rental')).toBe(
      cookingClass.priceKopecks + cookingClass.rentalPriceKopecks,
    );
  });
});

describe('schedule policy', () => {
  it('builds an exclusive 30-day API range from the Moscow day boundary', () => {
    const now = new Date('2026-06-09T21:30:00Z');
    const query = getScheduleQuery(30, now);
    expect(query).toEqual({
      from: '2026-06-09T21:00:00.000Z',
      to: '2026-07-09T21:00:00.000Z',
    });
  });

  it('groups and formats a timestamp by the studio timezone', () => {
    const startsAt = '2026-10-03T21:30:00Z';
    const classAfterMoscowMidnight = { ...initialClasses[0]!, startsAt };

    expect(getStudioDateKey(startsAt)).toBe('2026-10-04');
    expect(getStudioDateTimeIso('2026-10-04', 0, 30)).toBe(
      '2026-10-03T21:30:00.000Z',
    );
    expect(formatTime(startsAt)).toBe('00:30');
    expect(filterClasses([classAfterMoscowMidnight], '2026-10-04', 'all')).toEqual([
      classAfterMoscowMidnight,
    ]);
    expect(filterClasses([classAfterMoscowMidnight], '2026-10-03', 'all')).toEqual([]);
  });

  it('keeps the selected date while applying a level filter', () => {
    const date = initialClasses[1]!.startsAt.slice(0, 10);
    const result = filterClasses(initialClasses, date, 'advanced');
    expect(result).toHaveLength(1);
    expect(result[0]!.level).toBe('advanced');
    expect(result[0]!.startsAt.slice(0, 10)).toBe(date);
  });

  it('does not expose a cancelled class as bookable', () => {
    const cancelled = initialClasses.find((item) => item.status === 'cancelled')!;
    expect(isBookable(cancelled)).toBe(false);
  });
});

describe('cancellation and review policy', () => {
  const cookingClass = initialClasses[4]!;
  const booking = initialBookings[0]!;

  it('allows cancellation exactly at the 12-hour deadline', () => {
    const now = new Date(new Date(cookingClass.startsAt).getTime() - 12 * 3_600_000);
    expect(canCancelBooking(booking, cookingClass, now)).toBe(true);
  });

  it('blocks cancellation one millisecond after the deadline', () => {
    const now = new Date(new Date(cookingClass.startsAt).getTime() - 12 * 3_600_000 + 1);
    expect(canCancelBooking(booking, cookingClass, now)).toBe(false);
  });

  it('allows only an unrated attended booking to be reviewed', () => {
    expect(canReview(initialBookings[1]!)).toBe(true);
    expect(canReview(initialBookings[0]!)).toBe(false);
  });

  it('keeps a studio-cancelled booking in history, not upcoming', () => {
    const cancelledByStudio = initialBookings.find(
      (item) => item.status === 'cancelled_by_studio',
    )!;
    expect(filterBookings(initialBookings, 'upcoming')).not.toContain(cancelledByStudio);
    expect(filterBookings(initialBookings, 'history')).toContain(cancelledByStudio);
  });
});

