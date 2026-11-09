import { Alert, Platform } from 'react-native';

type Button = { text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void };

/**
 * Alert.alert with buttons is a no-op on react-native-web, so fall back to the browser dialogs.
 * On web the last non-cancel button is treated as "OK".
 */
export function showAlert(title: string, message?: string, buttons?: Button[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  const text = message ? `${title}\n\n${message}` : title;
  const actions = (buttons ?? []).filter((b) => b.style !== 'cancel');
  if (actions.length === 0) {
    window.alert(text);
    return;
  }
  if (window.confirm(text)) actions[actions.length - 1].onPress?.();
  else buttons?.find((b) => b.style === 'cancel')?.onPress?.();
}
