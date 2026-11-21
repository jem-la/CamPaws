import { fetch as expoFetch } from 'expo/fetch';
import Constants from 'expo-constants';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

import { getToken } from '@/lib/session';

const BACKEND_PORT = 8080;
const TIMEOUT_MS = 20000;
const UPLOAD_TIMEOUT_MS = 90000;
// Shrink photos before upload so they're quick on phone networks.
const PHOTO_MAX_WIDTH = 1280;

// EXPO_PUBLIC_API_URL overrides this. Otherwise use the machine serving the JS bundle, so a phone on the LAN reaches the dev backend.
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

// Phone uploads need expo/fetch to send an expo-file-system File in the FormData.
const sendMultipart = (url: string, init: RequestInit): Promise<Response> =>
  expoFetch(url, init as Parameters<typeof expoFetch>[1]) as unknown as Promise<Response>;

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const base = apiBaseUrl();
  let res: Response;
  try {
    const send = Platform.OS !== 'web' && init.body instanceof FormData ? sendMultipart : fetch;
    res = await send(`${base}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    const timedOut = controller.signal.aborted;
    throw new ApiError(
      timedOut
        ? `The CamPaws server at ${base} took too long to respond. Check your connection and try again.`
        : "Can't reach the CamPaws server.",
    );
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
  // null for unclaimed sample dogs
  ownerId: number | null;
  latitude: number | null;
  longitude: number | null;
};

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
  /** Send both or neither. On update, omitting them keeps the saved location. */
  latitude?: number;
  longitude?: number;
};

export type DogPhotoMatchDto = { dog: DogProfileDto; similarity: number };

export type UserDto = { userId: number; email: string; displayName: string };
export type AuthDto = { token: string; user: UserDto };
export type SignUpBody = {
  email: string;
  displayName: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
};

export type MapMarkerDto = {
  markerId: string;
  latitude: number;
  longitude: number;
  label: string;
  lastUpdatedAt: string;
  approximate: boolean;
};
export type CommentDto = {
  commentId: number;
  dogId: number;
  userId: number;
  authorName: string;
  body: string;
  createdAt: string;
};
export type StartWalkDto = { walkId: number; publicSharing: boolean; message: string };
export type WalkSummaryDto = {
  walkId: number;
  dogId: number | null;
  dogName: string | null;
  startedAt: string;
  endedAt: string;
  distanceMeters: number;
  durationSeconds: number;
  publicSharing: boolean;
};
export type WalkStatsDto = {
  walkCount: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  recent: WalkSummaryDto[];
};

export const api = {
  mapMarkers: () => request<MapMarkerDto[]>('/api/map/dogs'),
  startWalk: (body: { dogId: number; publicSharing: boolean; latitude?: number; longitude?: number }) =>
    request<StartWalkDto>('/api/walks', json('POST', body)),
  updateWalkLocation: (walkId: number, latitude: number, longitude: number) =>
    request<void>(`/api/walks/${walkId}/location`, json('PUT', { latitude, longitude })),
  endWalkSession: (walkId: number) => request<void>(`/api/walks/${walkId}/end`, { method: 'POST' }),
  saveWalk: (body: {
    dogId: number;
    startedAt: string;
    endedAt: string;
    distanceMeters: number;
    publicSharing: boolean;
  }) => request<WalkSummaryDto>('/api/walks/history', json('POST', body)),
  walkStats: () => request<WalkStatsDto>('/api/walks/stats'),

  securityQuestions: () => request<string[]>('/api/auth/security-questions'),
  signUp: (body: SignUpBody) => request<AuthDto>('/api/auth/signup', json('POST', body)),
  login: (email: string, password: string) => request<AuthDto>('/api/auth/login', json('POST', { email, password })),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  me: () => request<UserDto>('/api/me'),
  updateMe: (body: { displayName?: string; email?: string }) => request<UserDto>('/api/me', json('PUT', body)),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>('/api/me/password', json('PUT', { currentPassword, newPassword })),
  deleteMe: (password: string) => request<void>('/api/me', json('DELETE', { password })),
  resetQuestion: (email: string) =>
    request<{ question: string }>(`/api/auth/reset-question?email=${encodeURIComponent(email)}`),
  resetPassword: (email: string, securityAnswer: string, newPassword: string) =>
    request<void>('/api/auth/reset-password', json('POST', { email, securityAnswer, newPassword })),
  likedDogIds: () => request<number[]>('/api/dogs/liked'),
  comments: (dogId: string) => request<CommentDto[]>(`/api/dogs/${encodeURIComponent(dogId)}/comments`),
  addComment: (dogId: string, body: string) =>
    request<CommentDto>(`/api/dogs/${encodeURIComponent(dogId)}/comments`, json('POST', { body })),
  deleteComment: (dogId: string, commentId: number) =>
    request<void>(`/api/dogs/${encodeURIComponent(dogId)}/comments/${commentId}`, { method: 'DELETE' }),
  unlikeDog: (id: string) => request<DogProfileDto>(`/api/dogs/${encodeURIComponent(id)}/likes`, { method: 'DELETE' }),

  listDogs: (q?: string) => request<DogProfileDto[]>(`/api/dogs${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  nearbyDogs: (lat: number, lng: number, radiusMeters = 1000) =>
    request<DogProfileDto[]>(
      `/api/dogs/nearby?${new URLSearchParams({ lat: String(lat), lng: String(lng), radiusMeters: String(radiusMeters) })}`,
    ),
  getDog: (id: string) => request<DogProfileDto>(`/api/dogs/${encodeURIComponent(id)}`),
  createDog: (body: DogProfileRequestDto) => request<DogProfileDto>('/api/dogs', json('POST', body)),
  updateDog: (id: string, body: DogProfileRequestDto) =>
    request<DogProfileDto>(`/api/dogs/${encodeURIComponent(id)}`, json('PUT', body)),
  deleteDog: (id: string) => request<void>(`/api/dogs/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  likeDog: (id: string) => request<DogProfileDto>(`/api/dogs/${encodeURIComponent(id)}/likes`, { method: 'POST' }),
  findDuplicates: (name: string, furColor?: string, ignoreDogId?: string) => {
    const params = new URLSearchParams({ name });
    if (furColor) params.set('furColor', furColor);
    if (ignoreDogId) params.set('ignoreDogId', ignoreDogId);
    return request<DogProfileDto[]>(`/api/dogs/duplicates?${params.toString()}`);
  },
  uploadPhoto: async (uri: string): Promise<string> => {
    if (/^https?:\/\//i.test(uri)) return uri;
    const { url } = await request<{ url: string }>(
      '/api/photos',
      { method: 'POST', body: await photoForm(uri) },
      UPLOAD_TIMEOUT_MS,
    );
    return url;
  },
  matchDogPhoto: async (uri: string) =>
    request<DogPhotoMatchDto[]>('/api/dogs/match-photo', { method: 'POST', body: await photoForm(uri) }, UPLOAD_TIMEOUT_MS),
};

async function photoForm(uri: string): Promise<FormData> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('file', blob, `photo.${extensionFor(blob.type)}`);
    return form;
  }
  let fileUri = uri;
  try {
    const ref = await ImageManipulator.manipulate(uri).resize({ width: PHOTO_MAX_WIDTH }).renderAsync();
    fileUri = (await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 })).uri;
  } catch {
    // Use the original file if resizing fails.
  }
  form.append('file', new File(fileUri) as unknown as Blob);
  return form;
}

function extensionFor(mime: string): string {
  return { 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif', 'image/gif': 'gif' }[mime] ?? 'jpg';
}
