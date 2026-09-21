import { describe, expect, it } from 'vitest';

import { initialBookings, initialClasses } from '../src/data/fixtures';
import {
  canCancelBooking,
  canReview,
  filterClasses,
  getBookingTotal,
  getScheduleQuery,
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
  it('builds an exclusive 30-day API range from the local day boundary', () => {
    const now = new Date('2026-06-10T15:30:00+03:00');
    const query = getScheduleQuery(30, now);
    expect(new Date(query.to).getTime() - new Date(query.from).getTime()).toBe(
      30 * 24 * 3_600_000,
    );
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
});

