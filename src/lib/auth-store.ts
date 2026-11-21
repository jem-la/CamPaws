import { useSyncExternalStore } from 'react';

import { api, ApiError, type SignUpBody, type UserDto } from '@/lib/api';
import { resetDogsState } from '@/lib/dogs-store';
import { loadToken, saveToken } from '@/lib/session';

export type AuthState = {
  status: 'loading' | 'signedOut' | 'signedIn';
  user?: UserDto;
  // Set when restoring the session failed for a reason other than being logged out.
  error?: string;
};

let state: AuthState = { status: 'loading' };
const listeners = new Set<() => void>();
const setState = (next: AuthState) => {
  state = next;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useAuth = (): AuthState => useSyncExternalStore(subscribe, () => state, () => state);

export function useUser(): UserDto {
  const { user } = useAuth();
  if (!user) throw new Error('Not signed in');
  return user;
}

const MAX_RETRIES = 20;
const RETRY_DELAY_MS = 2000;

export async function restoreSession(): Promise<void> {
  setState({ status: 'loading' });
  const token = await loadToken();
  if (!token) return setState({ status: 'signedOut' });
  // `npm run dev` starts Expo before the backend finishes booting, so retry while it comes up.
  for (let attempt = 0; ; attempt++) {
    try {
      return setState({ status: 'signedIn', user: await api.me() });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await saveToken(null);
        return setState({ status: 'signedOut' });
      }
      const offline = e instanceof ApiError && e.status === undefined;
      if (!offline || attempt >= MAX_RETRIES) {
        return setState({ status: 'signedOut', error: (e as Error).message });
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

async function startSession(token: string, user: UserDto) {
  await saveToken(token);
  resetDogsState();
  setState({ status: 'signedIn', user });
}

export async function signUp(body: SignUpBody): Promise<void> {
  const res = await api.signUp(body);
  await startSession(res.token, res.user);
}

export async function logIn(email: string, password: string): Promise<void> {
  const res = await api.login(email.trim(), password);
  await startSession(res.token, res.user);
}

async function endSession() {
  await saveToken(null);
  resetDogsState();
  setState({ status: 'signedOut' });
}

export async function logOut(): Promise<void> {
  try {
    await api.logout();
  } catch {
    // Logging out locally is enough if the server is unreachable.
  }
  await endSession();
}

export async function updateProfile(body: { displayName?: string; email?: string }): Promise<void> {
  const user = await api.updateMe(body);
  setState({ status: 'signedIn', user });
}

export const changePassword = (current: string, next: string) => api.changePassword(current, next);

export async function deleteAccount(password: string): Promise<void> {
  await api.deleteMe(password);
  await endSession();
}
