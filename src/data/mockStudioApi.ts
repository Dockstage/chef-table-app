import { canCancelBooking, getBookingTotal } from '../domain/policies';
import {
  Booking,
  CookingClass,
  CreateBookingInput,
  ReviewInput,
  StudioApi,
  StudioApiError,
} from '../domain/types';
import { initialBookings, initialClasses } from './fixtures';

const wait = (milliseconds = 260) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export class MockStudioApi implements StudioApi {
  private classes: CookingClass[];
  private bookings: Booking[];

  constructor(
    classes: CookingClass[] = initialClasses,
    bookings: Booking[] = initialBookings,
  ) {
    this.classes = structuredClone(classes);
    this.bookings = structuredClone(bookings);
  }

  async getClasses(): Promise<CookingClass[]> {
    await wait();
    return structuredClone(this.classes);
  }

  async getBookings(): Promise<Booking[]> {
    await wait(180);
    return structuredClone(this.bookings);
  }

  async createBooking(input: CreateBookingInput): Promise<Booking> {
    await wait(420);
    const cookingClass = this.classes.find((item) => item.id === input.classId);
    if (!cookingClass) {
      throw new StudioApiError('SLOT_FULL', 'Класс больше не доступен.');
    }
    if (cookingClass.status === 'cancelled') {
      throw new StudioApiError(
        'SLOT_CANCELLED',
        'Студия отменила этот класс. Выберите другой слот.',
      );
    }
    if (cookingClass.availableSeats <= 0) {
      throw new StudioApiError('SLOT_FULL', 'Место уже заняли. Обновили расписание.');
    }

    const hasActiveBooking = this.bookings.some(
      (booking) => booking.classId === input.classId && booking.status === 'confirmed',
    );
    if (hasActiveBooking) {
      throw new StudioApiError(
        'DUPLICATE_BOOKING',
        'Вы уже записаны на этот класс. Проверьте раздел «Мои записи».',
      );
    }

    const booking: Booking = {
      id: `booking-${Date.now()}`,
      classId: cookingClass.id,
      status: 'confirmed',
      equipmentOption: input.equipmentOption,
      allergyNotes: input.allergyNotes.trim() || 'Нет аллергий',
      totalPriceKopecks: getBookingTotal(cookingClass, input.equipmentOption),
      createdAt: new Date().toISOString(),
    };
    this.bookings.unshift(booking);
    cookingClass.availableSeats -= 1;
    return structuredClone(booking);
  }

  async cancelBooking(bookingId: string): Promise<Booking> {
    await wait();
    const booking = this.bookings.find((item) => item.id === bookingId);
    if (!booking) throw new Error('Booking not found');
    const cookingClass = this.classes.find((item) => item.id === booking.classId);
    if (!cookingClass || !canCancelBooking(booking, cookingClass)) {
      throw new StudioApiError(
        'CANCELLATION_CLOSED',
        'Онлайн-отмена закрывается за 12 часов до начала.',
      );
    }
    booking.status = 'cancelled_by_client';
    cookingClass.availableSeats = Math.min(
      cookingClass.capacity,
      cookingClass.availableSeats + 1,
    );
    return structuredClone(booking);
  }

  async submitReview(input: ReviewInput): Promise<Booking> {
    await wait();
    const booking = this.bookings.find((item) => item.id === input.bookingId);
    if (
      !booking ||
      booking.status !== 'attended' ||
      booking.rating !== undefined ||
      !Number.isInteger(input.rating) ||
      input.rating < 1 ||
      input.rating > 5
    ) {
      throw new StudioApiError('REVIEW_NOT_ALLOWED', 'Эту запись нельзя оценить.');
    }
    booking.rating = input.rating;
    return structuredClone(booking);
  }
}
