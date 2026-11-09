import type { DogProfile } from '@/components/dog-profile-card';

import { apiRequest } from './client';

/** Shape returned by the backend (DogProfileResponse). */
export type DogProfileResponse = {
  dogId: number;
  name: string;
  breed: string | null;
  temperament: string | null;
  canBePetted: boolean;
  campusFrequency: string | null;
  photoUrl: string | null;
  likeCount: number;
};

/** Shape sent to the backend (DogProfileRequest). photoUrl is required by the backend. */
export type DogProfileRequest = {
  name: string;
  breed?: string;
  temperament?: string;
  canBePetted?: boolean;
  campusFrequency?: string;
  photoUrl: string;
};

export type DogFilters = {
  q?: string;
  breed?: string;
  canBePetted?: boolean;
};

const TINTS = ['#F8E3D8', '#F3E6CC', '#E4E8F0', '#E3EFE3', '#EFE3F0'];

export function toDogProfile(dog: DogProfileResponse): DogProfile {
  return {
    id: String(dog.dogId),
    name: dog.name,
    breed: dog.breed || 'Unknown breed',
    location: dog.campusFrequency || 'Around campus',
    photo: dog.photoUrl ? { uri: dog.photoUrl } : undefined,
    tint: TINTS[dog.dogId % TINTS.length],
    likeCount: dog.likeCount,
    canBePetted: dog.canBePetted,
    temperament: dog.temperament ?? undefined,
  };
}

export function fetchDogs(filters: DogFilters = {}, signal?: AbortSignal): Promise<DogProfile[]> {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.breed) params.set('breed', filters.breed);
  if (filters.canBePetted !== undefined) params.set('canBePetted', String(filters.canBePetted));
  const query = params.toString();

  return apiRequest<DogProfileResponse[]>(`/api/dogs${query ? `?${query}` : ''}`, { signal }).then((dogs) =>
    dogs.map(toDogProfile)
  );
}

export function fetchLeaderboard(signal?: AbortSignal): Promise<DogProfile[]> {
  return apiRequest<DogProfileResponse[]>('/api/dogs/leaderboard', { signal }).then((dogs) =>
    dogs.map(toDogProfile)
  );
}

export function fetchDog(id: string, signal?: AbortSignal): Promise<DogProfile> {
  return apiRequest<DogProfileResponse>(`/api/dogs/${id}`, { signal }).then(toDogProfile);
}

export function createDog(request: DogProfileRequest): Promise<DogProfile> {
  return apiRequest<DogProfileResponse>('/api/dogs', { method: 'POST', body: request }).then(toDogProfile);
}

export function updateDog(id: string, request: DogProfileRequest): Promise<DogProfile> {
  return apiRequest<DogProfileResponse>(`/api/dogs/${id}`, { method: 'PUT', body: request }).then(toDogProfile);
}

export function likeDog(id: string): Promise<DogProfile> {
  return apiRequest<DogProfileResponse>(`/api/dogs/${id}/likes`, { method: 'POST' }).then(toDogProfile);
}
