import {
  ApiErrorCode,
  Booking,
  CookingClass,
  CreateBookingInput,
  ReviewInput,
  ScheduleQuery,
  StudioApi,
  StudioApiError,
} from '../domain/types';
import { getScheduleQuery } from '../domain/policies';

type ErrorPayload = { code?: ApiErrorCode; message?: string };

function createIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `booking-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
}
