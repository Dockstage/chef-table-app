import {
  Booking,
  CookingClass,
  CreateBookingInput,
  ProblemCode,
  PushTokenInput,
  ReviewInput,
  ScheduleQuery,
  StudioApiError,
} from '../domain/types';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const colorPattern = /^#[0-9a-f]{6}$/i;
const offsetDateTimePattern = /T.*(?:Z|[+-]\d{2}:\d{2})$/;
const levels = new Set(['beginner', 'advanced']);
const classStatuses = new Set(['scheduled', 'completed', 'cancelled']);
const bookingStatuses = new Set([
  'confirmed',
  'attended',
  'cancelled_by_client',
  'cancelled_by_studio',
]);
const equipmentOptions = new Set(['own', 'rental']);
const problemCodes = new Set<ProblemCode>([
  'INVALID_DATE_RANGE',
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'NOT_FOUND',
  'METHOD_NOT_ALLOWED',
  'CLASS_NOT_FOUND',
  'BOOKING_NOT_FOUND',
  'SLOT_FULL',
  'SLOT_CANCELLED',
  'SLOT_NOT_BOOKABLE',
  'DUPLICATE_BOOKING',
  'RENTAL_UNAVAILABLE',
  'IDEMPOTENCY_CONFLICT',
  'CANCELLATION_CLOSED',
  'BOOKING_NOT_ACTIVE',
  'REVIEW_NOT_ALLOWED',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'SERVICE_UNAVAILABLE',
]);

type JsonRecord = Record<string, unknown>;

function assertContract(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function record(value: unknown, name: string): JsonRecord {
  assertContract(typeof value === 'object' && value !== null && !Array.isArray(value), `${name}: object expected`);
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, keys: string[], name: string): void {
  const actual = Object.keys(value);
  assertContract(
    actual.length === keys.length && actual.every((key) => keys.includes(key)),
    `${name}: fields do not match the contract`,
  );
}

function text(value: unknown, name: string, min: number, max: number): string {
  assertContract(typeof value === 'string', `${name}: string expected`);
  assertContract(value.length >= min && value.length <= max, `${name}: invalid length`);
  return value;
}

function integer(value: unknown, name: string, minimum: number): number {
  assertContract(Number.isInteger(value) && (value as number) >= minimum, `${name}: invalid integer`);
  return value as number;
}

function uuid(value: unknown, name: string): string {
  const result = text(value, name, 1, 100);
  assertContract(uuidPattern.test(result), `${name}: UUID expected`);
  return result;
}

function dateTime(value: unknown, name: string): string {
  const result = text(value, name, 1, 100);
  assertContract(offsetDateTimePattern.test(result) && !Number.isNaN(Date.parse(result)), `${name}: offset date-time expected`);
  return result;
}

function nullableText(value: unknown, name: string, max: number): string | null {
  return value === null ? null : text(value, name, 0, max);
}

function parseChef(value: unknown) {
  const item = record(value, 'chef');
  exactKeys(item, ['id', 'name', 'role', 'rating', 'initials'], 'chef');
  assertContract(typeof item.rating === 'number' && item.rating >= 0 && item.rating <= 5, 'chef.rating: invalid number');
  return {
    id: uuid(item.id, 'chef.id'),
    name: text(item.name, 'chef.name', 1, 100),
    role: text(item.role, 'chef.role', 1, 100),
    rating: item.rating,
    initials: text(item.initials, 'chef.initials', 1, 4),
  };
}

export function parseCookingClass(value: unknown): CookingClass {
  const item = record(value, 'CookingClass');
  exactKeys(
    item,
    [
      'id', 'title', 'eyebrow', 'description', 'dishes', 'level', 'chef', 'startsAt',
      'durationMinutes', 'status', 'capacity', 'availableSeats', 'priceKopecks',
      'rentalPriceKopecks', 'availableRentalKits', 'address', 'accent', 'softAccent',
      'cancellationReason',
    ],
    'CookingClass',
  );
  assertContract(Array.isArray(item.dishes) && item.dishes.length > 0, 'dishes: non-empty array expected');
  assertContract(levels.has(item.level as string), 'level: invalid value');
  assertContract(classStatuses.has(item.status as string), 'status: invalid value');
  const accent = text(item.accent, 'accent', 7, 7);
  const softAccent = text(item.softAccent, 'softAccent', 7, 7);
  assertContract(colorPattern.test(accent) && colorPattern.test(softAccent), 'accent: hex color expected');
  const cancellationReason = nullableText(item.cancellationReason, 'cancellationReason', 500);
  assertContract(
    item.status === 'cancelled' ? Boolean(cancellationReason?.trim()) : cancellationReason === null,
    'cancellationReason: inconsistent with status',
  );
  return {
    id: uuid(item.id, 'id'),
    title: text(item.title, 'title', 1, 160),
    eyebrow: text(item.eyebrow, 'eyebrow', 0, 80),
    description: text(item.description, 'description', 0, 2000),
    dishes: item.dishes.map((dish, index) => text(dish, `dishes[${index}]`, 1, 160)),
    level: item.level as CookingClass['level'],
    chef: parseChef(item.chef),
    startsAt: dateTime(item.startsAt, 'startsAt'),
    durationMinutes: integer(item.durationMinutes, 'durationMinutes', 1),
    status: item.status as CookingClass['status'],
    capacity: integer(item.capacity, 'capacity', 1),
    availableSeats: integer(item.availableSeats, 'availableSeats', 0),
    priceKopecks: integer(item.priceKopecks, 'priceKopecks', 0),
    rentalPriceKopecks: integer(item.rentalPriceKopecks, 'rentalPriceKopecks', 0),
    availableRentalKits: integer(item.availableRentalKits, 'availableRentalKits', 0),
    address: text(item.address, 'address', 1, 300),
    accent,
    softAccent,
    cancellationReason,
  };
}

export function parseCookingClasses(value: unknown): CookingClass[] {
  assertContract(Array.isArray(value), 'CookingClass[] expected');
  return value.map(parseCookingClass);
}

export function parseBooking(value: unknown): Booking {
  const item = record(value, 'Booking');
  exactKeys(
    item,
    [
      'id', 'classId', 'status', 'equipmentOption', 'allergyNotes', 'totalPriceKopecks',
      'createdAt', 'studioCancellationReason', 'rating', 'reviewComment',
    ],
    'Booking',
  );
  assertContract(bookingStatuses.has(item.status as string), 'status: invalid value');
  assertContract(equipmentOptions.has(item.equipmentOption as string), 'equipmentOption: invalid value');
  const studioCancellationReason = nullableText(item.studioCancellationReason, 'studioCancellationReason', 500);
  assertContract(
    item.status === 'cancelled_by_studio'
      ? Boolean(studioCancellationReason?.trim())
      : studioCancellationReason === null,
    'studioCancellationReason: inconsistent with status',
  );
  assertContract(
    item.rating === null || (Number.isInteger(item.rating) && (item.rating as number) >= 1 && (item.rating as number) <= 5),
    'rating: invalid value',
  );
  return {
    id: uuid(item.id, 'id'),
    classId: uuid(item.classId, 'classId'),
    status: item.status as Booking['status'],
    equipmentOption: item.equipmentOption as Booking['equipmentOption'],
    allergyNotes: text(item.allergyNotes, 'allergyNotes', 0, 300),
    totalPriceKopecks: integer(item.totalPriceKopecks, 'totalPriceKopecks', 0),
    createdAt: dateTime(item.createdAt, 'createdAt'),
    studioCancellationReason,
    rating: item.rating as number | null,
    reviewComment: nullableText(item.reviewComment, 'reviewComment', 500),
  };
}

export function parseBookings(value: unknown): Booking[] {
  assertContract(Array.isArray(value), 'Booking[] expected');
  return value.map(parseBooking);
}

export function parseProblem(value: unknown, responseStatus: number) {
  const item = record(value, 'Problem');
  const allowed = ['status', 'code', 'message', 'traceId', 'fieldErrors'];
  assertContract(Object.keys(item).every((key) => allowed.includes(key)), 'Problem: unknown field');
  const status = integer(item.status, 'status', 400);
  assertContract(status <= 599 && status === responseStatus, 'status: inconsistent HTTP status');
  assertContract(problemCodes.has(item.code as ProblemCode), 'code: unknown problem code');
  if (item.traceId !== undefined) {
    assertContract(item.traceId === null || typeof item.traceId === 'string', 'traceId: invalid value');
  }
  if (item.fieldErrors !== undefined) {
    assertContract(Array.isArray(item.fieldErrors), 'fieldErrors: array expected');
    item.fieldErrors.forEach((value, index) => {
      const fieldError = record(value, `fieldErrors[${index}]`);
      exactKeys(fieldError, ['field', 'message'], `fieldErrors[${index}]`);
      text(fieldError.field, `fieldErrors[${index}].field`, 0, 500);
      text(fieldError.message, `fieldErrors[${index}].message`, 0, 500);
    });
  }
  return {
    status,
    code: item.code as ProblemCode,
    message: text(item.message, 'message', 1, 500),
  };
}

export function validateCreateBookingInput(input: CreateBookingInput): void {
  validateUuid(input.classId, 'classId');
  if (!equipmentOptions.has(input.equipmentOption)) {
    throw new StudioApiError('VALIDATION_ERROR', 'Некорректный вариант рабочего набора.', 422);
  }
  if (typeof input.allergyNotes !== 'string' || input.allergyNotes.length > 300) {
    throw new StudioApiError('VALIDATION_ERROR', 'Аллергии не должны превышать 300 символов.', 422);
  }
}

export function validateReviewInput(input: ReviewInput): void {
  validateUuid(input.bookingId, 'bookingId');
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new StudioApiError('VALIDATION_ERROR', 'Оценка должна быть целым числом от 1 до 5.', 422);
  }
  if (
    (input.comment !== undefined && typeof input.comment !== 'string') ||
    (input.comment?.length ?? 0) > 500
  ) {
    throw new StudioApiError('VALIDATION_ERROR', 'Комментарий не должен превышать 500 символов.', 422);
  }
}

export function validateScheduleQuery(query: ScheduleQuery): void {
  const from = typeof query.from === 'string' ? Date.parse(query.from) : Number.NaN;
  const to = typeof query.to === 'string' ? Date.parse(query.to) : Number.NaN;
  if (
    typeof query.from !== 'string' ||
    typeof query.to !== 'string' ||
    !offsetDateTimePattern.test(query.from) ||
    !offsetDateTimePattern.test(query.to) ||
    Number.isNaN(from) ||
    Number.isNaN(to) ||
    from >= to ||
    (query.level !== undefined && !levels.has(query.level))
  ) {
    throw new StudioApiError('INVALID_DATE_RANGE', 'Некорректный период расписания.', 400);
  }
}

export function validatePushTokenInput(input: PushTokenInput): void {
  if (typeof input.token !== 'string' || input.token.length < 1 || input.token.length > 4096) {
    throw new StudioApiError('VALIDATION_ERROR', 'Некорректный push-токен.', 422);
  }
  if (input.platform !== 'android' && input.platform !== 'ios') {
    throw new StudioApiError('VALIDATION_ERROR', 'Некорректная push-платформа.', 422);
  }
}

export function validateUuid(value: string, field: string): void {
  try {
    uuid(value, field);
  } catch {
    throw new StudioApiError('VALIDATION_ERROR', `Некорректный идентификатор: ${field}.`, 422);
  }
}
