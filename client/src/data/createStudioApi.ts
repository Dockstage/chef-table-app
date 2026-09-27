import { StudioApi } from '../domain/types';
import { HttpStudioApi } from './httpStudioApi';
import { MockStudioApi } from './mockStudioApi';

type StudioApiEnvironment = {
  mode?: string;
  baseUrl?: string;
  devBearerToken?: string;
};

const expoEnvironment: StudioApiEnvironment = {
  mode: process.env.EXPO_PUBLIC_API_MODE,
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  devBearerToken: process.env.EXPO_PUBLIC_DEV_BEARER_TOKEN,
};

export function createStudioApi(
  environment: StudioApiEnvironment = expoEnvironment,
  fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
): StudioApi {
  const mode = environment.mode?.trim().toLowerCase();

  if (mode === 'mock') return new MockStudioApi();
  if (mode !== 'http') {
    throw new Error('EXPO_PUBLIC_API_MODE должен быть равен http или mock.');
  }

  const baseUrl = environment.baseUrl?.trim();
  if (!baseUrl) throw new Error('Для режима http задайте EXPO_PUBLIC_API_BASE_URL.');

  const devBearerToken = environment.devBearerToken?.trim();
  if (!devBearerToken) {
    throw new Error('Для режима http задайте EXPO_PUBLIC_DEV_BEARER_TOKEN.');
  }

  return new HttpStudioApi(baseUrl, fetchImpl, async () => devBearerToken);
}
