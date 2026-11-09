import Constants from 'expo-constants';
import { Platform } from 'react-native';

const BACKEND_PORT = 8080;
const TIMEOUT_MS = 20000;

/**
 * Where the Spring backend lives. Set EXPO_PUBLIC_API_URL to override (e.g. a deployed server).
 * Otherwise use the same machine that serves the JS bundle, so a phone on the LAN running
 * Expo Go reaches the backend on the developer's computer.
 */
export function apiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  if (Platform.OS === 'web') {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host}:${BACKEND_PORT}`;
  }
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (devHost) return `http://${devHost}:${BACKEND_PORT}`;
  return Platform.OS === 'android' ? `http://10.0.2.2:${BACKEND_PORT}` : `http://localhost:${BACKEND_PORT}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { Accept: 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError("Can't reach the CamPaws server. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  const body = text ? safeJson(text) : undefined;
  if (!res.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Request failed (${res.status}).`;
    throw new ApiError(message, res.status);
  }
  return body as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/** Mirrors backend DogProfileResponse. */
export type DogProfileDto = {
  dogId: number;
  name: string;
  temperament: string | null;
  canBePetted: boolean;
  campusFrequency: string | null;
  photoUrl: string | null;
  likeCount: number;
  photoUrls: string[] | null;
  furColor: string | null;
  location: string | null;
  about: string | null;
  pettingPolicy: 'ask' | 'yes' | 'no' | null;
  addedBy: string | null;
  /** Last-seen location (PostGIS-backed). Both null when unknown. */
  latitude: number | null;
  longitude: number | null;
};

/** Mirrors backend DogProfileRequest. */
export type DogProfileRequestDto = {
  name: string;
  temperament?: string;
  campusFrequency?: string;
  photoUrls: string[];
  furColor?: string;
  location?: string;
  about?: string;
  pettingPolicy: 'ask' | 'yes' | 'no';
  canBePetted: boolean;
  addedBy?: string;
  /** Send both or neither. On update, omitting them keeps the saved location. */
  latitude?: number;
  longitude?: number;
};

export const api = {
  listDogs: (q?: string) => request<DogProfileDto[]>(`/api/dogs${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  /** Dogs last seen within radiusMeters (default 1 km) of a point, closest first. */
  nearbyDogs: (lat: number, lng: number, radiusMeters = 1000) =>
    request<DogProfileDto[]>(
      `/api/dogs/nearby?${new URLSearchParams({ lat: String(lat), lng: String(lng), radiusMeters: String(radiusMeters) })}`,
    ),
  getDog: (id: string) => request<DogProfileDto>(`/api/dogs/${encodeURIComponent(id)}`),
  createDog: (body: DogProfileRequestDto) => request<DogProfileDto>('/api/dogs', json('POST', body)),
  updateDog: (id: string, body: DogProfileRequestDto) =>
    request<DogProfileDto>(`/api/dogs/${encodeURIComponent(id)}`, json('PUT', body)),
  likeDog: (id: string) => request<DogProfileDto>(`/api/dogs/${encodeURIComponent(id)}/likes`, { method: 'POST' }),
  findDuplicates: (name: string, furColor?: string, ignoreDogId?: string) => {
    const params = new URLSearchParams({ name });
    if (furColor) params.set('furColor', furColor);
    if (ignoreDogId) params.set('ignoreDogId', ignoreDogId);
    return request<DogProfileDto[]>(`/api/dogs/duplicates?${params.toString()}`);
  },
  /** Uploads a local image (file://, content://, blob: or data: URI) and returns its public URL. */
  uploadPhoto: async (uri: string): Promise<string> => {
    if (/^https?:\/\//i.test(uri)) return uri;
    const form = new FormData();
    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      form.append('file', blob, `photo.${extensionFor(blob.type)}`);
    } else {
      const type = mimeFromUri(uri);
      // React Native's FormData accepts { uri, name, type } file parts.
      form.append('file', { uri, name: `photo.${extensionFor(type)}`, type } as unknown as Blob);
    }
    const { url } = await request<{ url: string }>('/api/photos', { method: 'POST', body: form });
    return url;
  },
};

function mimeFromUri(uri: string): string {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  if (ext === 'heif') return 'image/heif';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

function extensionFor(mime: string): string {
  return { 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif', 'image/gif': 'gif' }[mime] ?? 'jpg';
}
