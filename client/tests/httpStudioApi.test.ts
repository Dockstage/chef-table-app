import { describe, expect, it, vi } from 'vitest';

import { HttpStudioApi } from '../src/data/httpStudioApi';
import { initialBookings, initialClasses } from '../src/data/fixtures';

describe('HttpStudioApi contract', () => {
  it('sends the selected date range as query parameters', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify([initialClasses[0]]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    const api = new HttpStudioApi('https://studio.example/v1/', fetchMock as typeof fetch);

    await api.getClasses({
      from: '2026-06-01T00:00:00.000Z',
      to: '2026-06-15T00:00:00.000Z',
      level: 'advanced',
    });

    expect(String(fetchMock.mock.calls[0]![0])).toContain(
      '/classes?from=2026-06-01T00%3A00%3A00.000Z&to=2026-06-15T00%3A00%3A00.000Z&level=advanced',
    );
  });

  it('reuses the supplied idempotency key after a lost response', async () => {
    const idempotencyKey = 'ca79a4d3-8b9c-4d32-a818-7c14a0cc46ad';
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockRejectedValueOnce(new TypeError('Response was lost')).mockResolvedValueOnce(
      new Response(JSON.stringify(initialBookings[0]), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const api = new HttpStudioApi('https://studio.example/v1', fetchMock as typeof fetch);

    const input = {
      classId: initialClasses[0]!.id,
      equipmentOption: 'own',
      allergyNotes: 'Нет',
    } as const;

    await expect(api.createBooking(input, idempotencyKey)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
    await api.createBooking(input, idempotencyKey);

    const keys = fetchMock.mock.calls.map((call) =>
      new Headers((call[1] as RequestInit).headers).get('Idempotency-Key'),
    );
    expect(keys).toEqual([idempotencyKey, idempotencyKey]);
  });

  it('maps an API problem to StudioApiError', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            status: 409,
            code: 'RENTAL_UNAVAILABLE',
            message: 'Наборы закончились.',
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        ),
    );
    const api = new HttpStudioApi('https://studio.example/v1', fetchMock as typeof fetch);

    await expect(
      api.createBooking(
        {
          classId: initialClasses[0]!.id,
          equipmentOption: 'rental',
          allergyNotes: '',
        },
        '9b8a0f6b-7710-4fd0-aa95-22b05906a701',
      ),
    ).rejects.toMatchObject({ code: 'RENTAL_UNAVAILABLE', message: 'Наборы закончились.' });
  });

  it('registers a native push token with the backend', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(null, { status: 204 }),
    );
    const api = new HttpStudioApi('https://studio.example/v1', fetchMock as typeof fetch);

    await api.registerPushToken({ token: 'device-token', platform: 'android' });

    expect(String(fetchMock.mock.calls[0]![0])).toBe('https://studio.example/v1/push-tokens');
    expect(fetchMock.mock.calls[0]![1]?.body).toBe(
      JSON.stringify({ token: 'device-token', platform: 'android' }),
    );
  });

  it('rejects a success payload that does not match the OpenAPI DTO', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify([{ id: initialClasses[0]!.id }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    const api = new HttpStudioApi('https://studio.example/v1', fetchMock as typeof fetch);

    await expect(api.getClasses()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('rejects an unknown problem code instead of trusting the payload', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: 409, code: 'UNKNOWN', message: 'Ошибка.' }), {
          status: 409,
          headers: { 'Content-Type': 'application/problem+json' },
        }),
    );
    const api = new HttpStudioApi('https://studio.example/v1', fetchMock as typeof fetch);

    await expect(api.getBookings()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('validates commands before making a request', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const api = new HttpStudioApi('https://studio.example/v1', fetchMock as typeof fetch);

    await expect(
      api.createBooking(
        {
          classId: initialClasses[0]!.id,
          equipmentOption: 'own',
          allergyNotes: 'а'.repeat(301),
        },
        'ca79a4d3-8b9c-4d32-a818-7c14a0cc46ad',
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    await expect(
      api.submitReview({ bookingId: initialBookings[0]!.id, rating: 6 }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    await expect(api.registerPushToken({ token: '', platform: 'ios' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
