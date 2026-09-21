export type Level = 'beginner' | 'advanced';
export type ClassStatus = 'scheduled' | 'cancelled' | 'completed';
export type EquipmentOption = 'own' | 'rental';
export type BookingStatus =
  | 'confirmed'
  | 'attended'
  | 'cancelled_by_client'
  | 'cancelled_by_studio';

export type Chef = {
  id: string;
  name: string;
  role: string;
  rating: number;
  initials: string;
};

export type CookingClass = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  dishes: string[];
  level: Level;
  chef: Chef;
  startsAt: string;
  durationMinutes: number;
  status: ClassStatus;
  capacity: number;
  availableSeats: number;
  priceKopecks: number;
  rentalPriceKopecks: number;
  availableRentalKits: number;
  address: string;
  accent: string;
  softAccent: string;
  cancellationReason?: string;
};

export type Booking = {
  id: string;
  classId: string;
  status: BookingStatus;
  equipmentOption: EquipmentOption;
  allergyNotes: string;
  totalPriceKopecks: number;
  createdAt: string;
  studioCancellationReason?: string;
  rating?: number;
};

export type ScheduleQuery = {
  from: string;
  to: string;
  level?: Level;
};

export type CreateBookingInput = {
  classId: string;
  equipmentOption: EquipmentOption;
  allergyNotes: string;
};

export type ReviewInput = {
  bookingId: string;
  rating: number;
  comment?: string;
};

export type ApiErrorCode =
  | 'SLOT_FULL'
  | 'SLOT_CANCELLED'
  | 'DUPLICATE_BOOKING'
  | 'RENTAL_UNAVAILABLE'
  | 'CANCELLATION_CLOSED'
  | 'REVIEW_NOT_ALLOWED';

export class StudioApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'StudioApiError';
  }
}

export interface StudioApi {
  getClasses(query?: ScheduleQuery): Promise<CookingClass[]>;
  getClass(classId: string): Promise<CookingClass>;
  getBookings(): Promise<Booking[]>;
  createBooking(input: CreateBookingInput): Promise<Booking>;
  cancelBooking(bookingId: string): Promise<Booking>;
  submitReview(input: ReviewInput): Promise<Booking>;
}

