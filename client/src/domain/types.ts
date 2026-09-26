export type Level = 'beginner' | 'advanced';
export type ClassStatus = 'scheduled' | 'cancelled' | 'completed';
export type EquipmentOption = 'own' | 'rental';
export type PushPlatform = 'android' | 'ios';
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
  cancellationReason: string | null;
};

export type Booking = {
  id: string;
  classId: string;
  status: BookingStatus;
  equipmentOption: EquipmentOption;
  allergyNotes: string;
  totalPriceKopecks: number;
  createdAt: string;
  studioCancellationReason: string | null;
  rating: number | null;
  reviewComment: string | null;
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

export type PushTokenInput = {
  token: string;
  platform: PushPlatform;
};

export type ProblemCode =
  | 'INVALID_DATE_RANGE'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'CLASS_NOT_FOUND'
  | 'BOOKING_NOT_FOUND'
  | 'SLOT_FULL'
  | 'SLOT_CANCELLED'
  | 'SLOT_NOT_BOOKABLE'
  | 'DUPLICATE_BOOKING'
  | 'RENTAL_UNAVAILABLE'
  | 'IDEMPOTENCY_CONFLICT'
  | 'CANCELLATION_CLOSED'
  | 'BOOKING_NOT_ACTIVE'
  | 'REVIEW_NOT_ALLOWED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

export type ApiErrorCode = ProblemCode | 'NETWORK_ERROR' | 'INVALID_RESPONSE';

export class StudioApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'StudioApiError';
  }
}

export interface StudioApi {
  getClasses(query?: ScheduleQuery): Promise<CookingClass[]>;
  getClass(classId: string): Promise<CookingClass>;
  getBookings(): Promise<Booking[]>;
  createBooking(input: CreateBookingInput, idempotencyKey: string): Promise<Booking>;
  cancelBooking(bookingId: string): Promise<Booking>;
  submitReview(input: ReviewInput): Promise<Booking>;
  registerPushToken(input: PushTokenInput): Promise<void>;
}
