import {
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
import {
  parseBooking,
  parseBookings,
  parseCookingClass,
  parseCookingClasses,
  parseProblem,
  validateCreateBookingInput,
  validatePushTokenInput,
  validateReviewInput,
  validateScheduleQuery,
  validateUuid,
} from './apiValidation';

export class HttpStudioApi implements StudioApi {
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    private readonly fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
    private readonly getAccessToken?: () => Promise<string | undefined>,
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    parseResponse?: (value: unknown) => T,
  ): Promise<T> {
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
        try {
          const problem = parseProblem(await response.json(), response.status);
          throw new StudioApiError(problem.code, problem.message, problem.status);
        } catch (error) {
          if (error instanceof StudioApiError) throw error;
          throw new StudioApiError(
            'INVALID_RESPONSE',
            `Сервер вернул некорректное описание ошибки ${response.status}.`,
            response.status,
          );
        }
      }
      if (response.status === 204) return undefined as T;
      try {
        const payload: unknown = await response.json();
        return parseResponse ? parseResponse(payload) : (payload as T);
      } catch (error) {
        if (error instanceof StudioApiError) throw error;
        throw new StudioApiError(
          'INVALID_RESPONSE',
          'Сервер вернул данные, не соответствующие API-контракту.',
          response.status,
        );
      }
    } catch (error) {
      if (error instanceof StudioApiError) throw error;
      throw new StudioApiError(
        'NETWORK_ERROR',
        'Не удалось связаться со студией. Проверьте интернет и повторите попытку.',
      );
    }
  }

  async getClasses(query: ScheduleQuery = getScheduleQuery(7)): Promise<CookingClass[]> {
    validateScheduleQuery(query);
    const params = new URLSearchParams({ from: query.from, to: query.to });
    if (query.level) params.set('level', query.level);
    return await this.request(`/classes?${params.toString()}`, {}, parseCookingClasses);
  }

  async getClass(classId: string): Promise<CookingClass> {
    validateUuid(classId, 'classId');
    return await this.request(`/classes/${encodeURIComponent(classId)}`, {}, parseCookingClass);
  }

  async getBookings(): Promise<Booking[]> {
    return await this.request('/bookings', {}, parseBookings);
  }

  async createBooking(input: CreateBookingInput, idempotencyKey: string): Promise<Booking> {
    validateCreateBookingInput(input);
    validateUuid(idempotencyKey, 'Idempotency-Key');
    return await this.request(
      '/bookings',
      {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(input),
      },
      parseBooking,
    );
  }

  async cancelBooking(bookingId: string): Promise<Booking> {
    validateUuid(bookingId, 'bookingId');
    return await this.request(
      `/bookings/${encodeURIComponent(bookingId)}/cancel`,
      { method: 'POST' },
      parseBooking,
    );
  }

  async submitReview(input: ReviewInput): Promise<Booking> {
    validateReviewInput(input);
    const { bookingId, ...body } = input;
    return await this.request(
      `/bookings/${encodeURIComponent(bookingId)}/review`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      parseBooking,
    );
  }

  async registerPushToken(input: PushTokenInput): Promise<void> {
    validatePushTokenInput(input);
    return await this.request('/push-tokens', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
}
