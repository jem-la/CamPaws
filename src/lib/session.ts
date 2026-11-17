import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'campaws.token';

let cached: string | null = null;

/** Keeps the login token: Keychain/Keystore on phones, localStorage on web. */
export async function loadToken(): Promise<string | null> {
  try {
    cached = Platform.OS === 'web' ? window.localStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY);
  } catch {
    cached = null;
  }
  return cached;
}

export function getToken(): string | null {
  return cached;
}

export async function saveToken(token: string | null): Promise<void> {
  cached = token;
  try {
    if (Platform.OS === 'web') {
      if (token) window.localStorage.setItem(KEY, token);
      else window.localStorage.removeItem(KEY);
    } else if (token) {
      await SecureStore.setItemAsync(KEY, token);
    } else {
      await SecureStore.deleteItemAsync(KEY);
    }
  } catch {
    // The session still works in memory for this run.
  }
}
