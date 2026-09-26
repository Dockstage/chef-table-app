import {
  ApiErrorCode,
  Booking,
  CookingClass,
  CreateBookingInput,
  ReviewInput,
  PushTokenInput,
  ScheduleQuery,
  StudioApi,
  StudioApiError,
} from '../domain/types';
import { getScheduleQuery } from '../domain/policies';

type ErrorPayload = { code?: ApiErrorCode; message?: string };

function createIdempotencyKey(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

export class HttpStudioApi implements StudioApi {
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    private readonly fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
    private readonly getAccessToken?: () => Promise<string | undefined>,
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    try {
      const token = await this.getAccessToken?.();
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init.headers,
        },
      });
      if (!response.ok) {
        const problem = (await response.json().catch(() => ({}))) as ErrorPayload;
        throw new StudioApiError(
          problem.code ?? 'NETWORK_ERROR',
          problem.message ?? `Сервер вернул ошибку ${response.status}.`,
        );
      }
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof StudioApiError) throw error;
      throw new StudioApiError(
        'NETWORK_ERROR',
        'Не удалось связаться со студией. Проверьте интернет и повторите попытку.',
      );
    }
  }

  getClasses(query: ScheduleQuery = getScheduleQuery(7)): Promise<CookingClass[]> {
    const params = new URLSearchParams({ from: query.from, to: query.to });
    if (query.level) params.set('level', query.level);
    return this.request(`/classes?${params.toString()}`);
  }

  getClass(classId: string): Promise<CookingClass> {
    return this.request(`/classes/${encodeURIComponent(classId)}`);
  }

  getBookings(): Promise<Booking[]> {
    return this.request('/bookings');
  }

  createBooking(input: CreateBookingInput): Promise<Booking> {
    return this.request('/bookings', {
      method: 'POST',
      headers: { 'Idempotency-Key': createIdempotencyKey() },
      body: JSON.stringify(input),
    });
  }

  cancelBooking(bookingId: string): Promise<Booking> {
    return this.request(`/bookings/${encodeURIComponent(bookingId)}/cancel`, {
      method: 'POST',
    });
  }

  submitReview(input: ReviewInput): Promise<Booking> {
    const { bookingId, ...body } = input;
    return this.request(`/bookings/${encodeURIComponent(bookingId)}/review`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  registerPushToken(input: PushTokenInput): Promise<void> {
    return this.request('/push-tokens', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
}
