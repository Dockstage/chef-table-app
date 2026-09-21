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

  it('adds an idempotency key to booking requests', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ id: 'booking-1' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const api = new HttpStudioApi('https://studio.example/v1', fetchMock as typeof fetch);

    await api.createBooking({
      classId: initialClasses[0]!.id,
      equipmentOption: 'own',
      allergyNotes: 'Нет',
    });

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(new Headers(init.headers).get('Idempotency-Key')).toBeTruthy();
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
      api.createBooking({
        classId: initialClasses[0]!.id,
        equipmentOption: 'rental',
        allergyNotes: '',
      }),
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
