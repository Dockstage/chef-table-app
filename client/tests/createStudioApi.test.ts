import { describe, expect, it, vi } from 'vitest';

import { initialClasses } from '../src/data/fixtures';
import { createStudioApi } from '../src/data/createStudioApi';
import { MockStudioApi } from '../src/data/mockStudioApi';

describe('createStudioApi', () => {
  it('uses mock data only when mock mode is explicit', () => {
    expect(createStudioApi({ mode: 'mock' })).toBeInstanceOf(MockStudioApi);
    expect(() => createStudioApi({})).toThrow('EXPO_PUBLIC_API_MODE');
  });

  it('requires the backend URL and development token in http mode', () => {
    expect(() => createStudioApi({ mode: 'http' })).toThrow('EXPO_PUBLIC_API_BASE_URL');
    expect(() => createStudioApi({ mode: 'http', baseUrl: 'http://127.0.0.1:8000/v1' })).toThrow(
      'EXPO_PUBLIC_DEV_BEARER_TOKEN',
    );
  });

  it('wires the configured development token into backend requests', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify([initialClasses[0]]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    const api = createStudioApi(
      {
        mode: 'http',
        baseUrl: 'http://127.0.0.1:8000/v1',
        devBearerToken: 'local-development-token',
      },
      fetchMock as typeof fetch,
    );

    await api.getClasses({
      from: '2026-06-01T00:00:00.000Z',
      to: '2026-06-15T00:00:00.000Z',
    });

    const headers = new Headers(fetchMock.mock.calls[0]![1]?.headers);
    expect(headers.get('Authorization')).toBe('Bearer local-development-token');
  });
});
