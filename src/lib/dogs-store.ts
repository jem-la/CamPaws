import { useEffect, useState, useSyncExternalStore } from 'react';

import { api, type DogProfileDto, type DogProfileRequestDto } from '@/lib/api';

export type PettingPolicy = 'ask' | 'yes' | 'no';

export type Dog = {
  id: string;
  name: string;
  /** Photo URLs. The first one is the profile photo. */
  photos: string[];
  furColor?: string;
  temperament?: string;
  petting: PettingPolicy;
  campusVisits?: string;
  location?: string;
  about?: string;
  likes: number;
  addedBy?: string;
};

/** What the form edits. `photos` may hold local URIs that still need uploading. */
export type DogInput = Pick<
  Dog,
  'name' | 'photos' | 'furColor' | 'temperament' | 'petting' | 'campusVisits' | 'location' | 'about'
>;

export const TEMPERAMENTS = ['Friendly', 'Playful', 'Calm', 'Shy', 'Energetic', 'Protective'];
export const CAMPUS_VISITS = ['Every day', 'Most weekdays', 'Weekends', 'A few times a month', 'Rarely'];
export const PETTING_LABELS: Record<PettingPolicy, string> = {
  ask: 'Ask first',
  yes: 'Yes',
  no: 'No',
};

// TODO: replace with the signed-in user once accounts exist.
export const CURRENT_USER = 'Alex Lee';

type State = {
  dogs: Dog[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: string;
};

let state: State = { dogs: [], status: 'idle' };

const listeners = new Set<() => void>();
const setState = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const norm = (v?: string) => (v ?? '').trim().toLowerCase();
const opt = (v?: string | null) => (v && v.trim() ? v.trim() : undefined);

function fromDto(d: DogProfileDto): Dog {
  return {
    id: String(d.dogId),
    name: d.name,
    photos: d.photoUrls?.length ? d.photoUrls : d.photoUrl ? [d.photoUrl] : [],
    furColor: opt(d.furColor),
    temperament: opt(d.temperament),
    petting: d.pettingPolicy ?? (d.canBePetted ? 'yes' : 'ask'),
    campusVisits: opt(d.campusFrequency),
    location: opt(d.location),
    about: opt(d.about),
    likes: d.likeCount,
    addedBy: opt(d.addedBy),
  };
}

async function toRequest(input: DogInput): Promise<DogProfileRequestDto> {
  // Upload sequentially so a slow connection isn't hit with five large uploads at once.
  const photoUrls: string[] = [];
  for (const uri of input.photos) photoUrls.push(await api.uploadPhoto(uri));
  return {
    name: input.name.trim(),
    photoUrls,
    furColor: opt(input.furColor),
    temperament: opt(input.temperament),
    campusFrequency: opt(input.campusVisits),
    location: opt(input.location),
    about: opt(input.about),
    pettingPolicy: input.petting,
    canBePetted: input.petting === 'yes',
  };
}

function upsert(dog: Dog, { prepend = false } = {}) {
  const exists = state.dogs.some((d) => d.id === dog.id);
  setState({
    dogs: exists
      ? state.dogs.map((d) => (d.id === dog.id ? dog : d))
      : prepend
        ? [dog, ...state.dogs]
        : [...state.dogs, dog],
  });
}

/** Returns an error message, or null when the input can be saved. */
export function validateDog(input: DogInput): string | null {
  if (input.photos.length === 0) return 'Add at least one photo of the dog.';
  if (!input.name.trim()) return 'Give the dog a name.';
  if (input.name.trim().length > 80) return 'Dog name must be at most 80 characters.';
  return null;
}

let inFlight: Promise<void> | null = null;

/** Loads every dog from the backend. Concurrent calls share one request. */
export function refreshDogs(): Promise<void> {
  if (inFlight) return inFlight;
  setState({ status: 'loading', error: undefined });
  inFlight = api
    .listDogs()
    .then((list) => setState({ dogs: list.map(fromDto).reverse(), status: 'ready' }))
    .catch((e: Error) => setState({ status: 'error', error: e.message }))
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export async function fetchDog(id: string): Promise<Dog> {
  const dog = fromDto(await api.getDog(id));
  upsert(dog);
  return dog;
}

/** Profiles that are probably the same dog (alternative flow 2), checked on the server. */
export async function findDuplicates(input: DogInput, ignoreId?: string): Promise<Dog[]> {
  const list = await api.findDuplicates(input.name.trim(), opt(input.furColor), ignoreId);
  return list.map(fromDto);
}

export async function createDog(input: DogInput): Promise<Dog> {
  const error = validateDog(input);
  if (error) throw new Error(error);
  const body = await toRequest(input);
  const dog = fromDto(await api.createDog({ ...body, addedBy: CURRENT_USER }));
  upsert(dog, { prepend: true });
  return dog;
}

export async function updateDog(id: string, input: DogInput): Promise<Dog> {
  const error = validateDog(input);
  if (error) throw new Error(error);
  const dog = fromDto(await api.updateDog(id, await toRequest(input)));
  upsert(dog);
  return dog;
}

export async function likeDog(id: string): Promise<void> {
  const before = state.dogs.find((d) => d.id === id);
  if (before) upsert({ ...before, likes: before.likes + 1 });
  try {
    upsert(fromDto(await api.likeDog(id)));
  } catch (e) {
    if (before) upsert(before);
    throw e;
  }
}

/** Most-liked first; ties keep the oldest profile first. */
export function rankByLikes(dogs: Dog[]): Dog[] {
  return [...dogs].sort((a, b) => b.likes - a.likes || Number(a.id) - Number(b.id));
}

export function useDogsState(): State {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function useDogs(): Dog[] {
  return useDogsState().dogs;
}

/** The cached dog, fetched from the server if it isn't loaded yet. */
export function useDog(id: string | undefined): { dog?: Dog; error?: string } {
  const { dogs } = useDogsState();
  const dog = dogs.find((d) => d.id === id);
  const [error, setError] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!id || dog) return;
    let cancelled = false;
    fetchDog(id).catch((e: Error) => {
      if (!cancelled) setError(e.message);
    });
    return () => {
      cancelled = true;
    };
  }, [id, dog, setError]);
  return { dog, error };
}

const SWATCHES: [string, string][] = [
  ['white', '#f6efe6'],
  ['cream', '#f3e3c6'],
  ['tan', '#c58c59'],
  ['golden', '#d9a441'],
  ['gold', '#d9a441'],
  ['brown', '#7a4e2d'],
  ['chocolate', '#5a3620'],
  ['red', '#b5562f'],
  ['black', '#2b2626'],
  ['gray', '#8d8a8c'],
  ['grey', '#8d8a8c'],
  ['silver', '#bfc2c6'],
  ['brindle', '#6b4a2e'],
  ['blue', '#6f7d8c'],
];

/** Picks up to two swatch colors for a free-text fur description like "Tan and white". */
export function furSwatches(furColor?: string): string[] {
  const text = norm(furColor);
  if (!text) return [];
  return SWATCHES.map(([word, hex]) => ({ hex, at: text.search(new RegExp(`\\b${word}\\b`)) }))
    .filter((s) => s.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((s) => s.hex)
    .filter((hex, i, arr) => arr.indexOf(hex) === i)
    .slice(0, 2);
}

const TINTS = ['#f7e6da', '#f4e8d2', '#e9edf0', '#e6efe3', '#f1e4ee'];
export function dogTint(dog: Pick<Dog, 'id'>): string {
  let h = 0;
  for (const c of dog.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}
