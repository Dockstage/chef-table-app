import { Booking, CookingClass, EquipmentOption, Level } from './types';

export const CANCELLATION_DEADLINE_HOURS = 12;

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
    .filter((item) => item.startsAt.slice(0, 10) === dateKey)
    .filter((item) => level === 'all' || item.level === level)
    .filter((item) => item.status === 'scheduled')
    .sort(
      (first, second) =>
        new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime(),
    );
}

export function canReview(booking: Booking): boolean {
  return booking.status === 'attended' && booking.rating === undefined;
}

export function formatMoney(kopecks: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(kopecks / 100)} ₽`;
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date(iso));
}

