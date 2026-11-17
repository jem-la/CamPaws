import { Stack } from 'expo-router';

// Leaderboard and My Dogs open on top of Profile, with a Back button.
export const unstable_settings = { anchor: 'index' };

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: '#28242b',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '700' },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: '#fff' },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="leaderboard" options={{ title: '' }} />
      <Stack.Screen name="my-dogs" options={{ title: '' }} />
    </Stack>
  );
}
