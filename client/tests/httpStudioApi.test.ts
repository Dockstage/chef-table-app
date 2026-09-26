import { describe, expect, it, vi } from 'vitest';

import { HttpStudioApi } from '../src/data/httpStudioApi';
import { initialClasses } from '../src/data/fixtures';

describe('HttpStudioApi contract', () => {
  it('sends the selected date range as query parameters', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
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
      new Response(JSON.stringify({ id: 'booking-1' }), {
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
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(
        JSON.stringify({ code: 'RENTAL_UNAVAILABLE', message: 'Наборы закончились.' }),
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
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(null, { status: 204 }),
    );
    const api = new HttpStudioApi('https://studio.example/v1', fetchMock as typeof fetch);

    await api.registerPushToken({ token: 'device-token', platform: 'android' });

    expect(String(fetchMock.mock.calls[0]![0])).toBe('https://studio.example/v1/push-tokens');
    expect(fetchMock.mock.calls[0]![1]?.body).toBe(
      JSON.stringify({ token: 'device-token', platform: 'android' }),
    );
  });
});
