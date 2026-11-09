import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 8080;

/**
 * Resolve the backend base URL.
 * 1. EXPO_PUBLIC_API_URL if set (e.g. a deployed server).
 * 2. The machine running the Expo dev server (works for physical phones on the same Wi-Fi).
 * 3. Android emulator loopback / localhost as a last resort.
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:${API_PORT}`;

  return Platform.OS === 'android' ? `http://10.0.2.2:${API_PORT}` : `http://localhost:${API_PORT}`;
}

export const API_BASE_URL = resolveBaseUrl();

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string>; signal?: AbortSignal } = {}
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError(`Cannot reach the server at ${API_BASE_URL}. Is the backend running?`);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (typeof data?.message === 'string') message = data.message;
    } catch {
      // response had no JSON body
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
