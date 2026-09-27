import { Booking, CookingClass, EquipmentOption, Level, ScheduleQuery } from './types';

export const CANCELLATION_DEADLINE_HOURS = 12;
export const STUDIO_TIME_ZONE = 'Europe/Moscow';

const studioDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: STUDIO_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const studioDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: STUDIO_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function dateParts(date: Date, includeTime = false): Record<string, number> {
  const formatter = includeTime ? studioDateTimeFormatter : studioDateFormatter;
  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
}

export function getStudioDateKey(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const { year, month, day } = dateParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function addStudioCalendarDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day! + days));
  return date.toISOString().slice(0, 10);
}

export function getStudioDateTimeIso(
  dateKey: string,
  hour = 0,
  minute = 0,
): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const wanted = Date.UTC(year!, month! - 1, day!, hour, minute);
  let timestamp = wanted;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = dateParts(new Date(timestamp), true);
    const observed = Date.UTC(
      parts.year!,
      parts.month! - 1,
      parts.day!,
      parts.hour!,
      parts.minute!,
      parts.second!,
    );
    timestamp += wanted - observed;
  }

  return new Date(timestamp).toISOString();
}

export function getStudioDateKeys(days: number, now = new Date()): string[] {
  const first = getStudioDateKey(now);
  return Array.from({ length: days }, (_, index) => addStudioCalendarDays(first, index));
}

export function getScheduleQuery(days: number, now = new Date()): ScheduleQuery {
  const fromDate = getStudioDateKey(now);
  const toDate = addStudioCalendarDays(fromDate, days);
  return {
    from: getStudioDateTimeIso(fromDate),
    to: getStudioDateTimeIso(toDate),
  };
}

export function getBookingTotal(
  cookingClass: CookingClass,
  equipment: EquipmentOption,
): number {
  return (
    cookingClass.priceKopecks +
    (equipment === 'rental' ? cookingClass.rentalPriceKopecks : 0)
  );
}

export function canCancelBooking(
  booking: Booking,
  cookingClass: CookingClass,
  now = new Date(),
): boolean {
  if (booking.status !== 'confirmed') return false;
  const deadlineMs =
    new Date(cookingClass.startsAt).getTime() -
    CANCELLATION_DEADLINE_HOURS * 60 * 60 * 1000;
  return now.getTime() <= deadlineMs;
}

export function hoursUntilClass(cookingClass: CookingClass, now = new Date()): number {
  return Math.max(
    0,
    Math.floor((new Date(cookingClass.startsAt).getTime() - now.getTime()) / 3_600_000),
  );
}

export function isBookable(cookingClass: CookingClass): boolean {
  return cookingClass.status === 'scheduled' && cookingClass.availableSeats > 0;
}

export function filterClasses(
  classes: CookingClass[],
  dateKey: string,
  level: Level | 'all',
): CookingClass[] {
  return classes
    .filter((item) => getStudioDateKey(item.startsAt) === dateKey)
    .filter((item) => level === 'all' || item.level === level)
    .filter((item) => item.status === 'scheduled')
    .sort(
      (first, second) =>
        new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime(),
    );
}

export function canReview(booking: Booking): boolean {
  return booking.status === 'attended' && booking.rating === null;
}

export function filterBookings(
  bookings: Booking[],
  filter: 'upcoming' | 'history',
): Booking[] {
  return bookings.filter((booking) =>
    filter === 'upcoming'
      ? booking.status === 'confirmed'
      : booking.status === 'attended' ||
        booking.status === 'cancelled_by_client' ||
        booking.status === 'cancelled_by_studio',
  );
}

export function formatMoney(kopecks: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(kopecks / 100)} ₽`;
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: STUDIO_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: STUDIO_TIME_ZONE,
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date(iso));
}
