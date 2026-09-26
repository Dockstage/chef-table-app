import { StudioApi } from '../domain/types';
import { HttpStudioApi } from './httpStudioApi';
import { MockStudioApi } from './mockStudioApi';

export function createStudioApi(): StudioApi {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  return baseUrl ? new HttpStudioApi(baseUrl) : new MockStudioApi();
}
