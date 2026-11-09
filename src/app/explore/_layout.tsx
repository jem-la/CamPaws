import { Stack } from 'expo-router';

// Deep links (or a page reload) to a dog profile still get the search list underneath for Back.
export const unstable_settings = { anchor: 'index' };

export default function SearchDogsLayout() {
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
      <Stack.Screen name="new" options={{ title: 'Add a dog' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Dog profile' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Edit dog' }} />
    </Stack>
  );
}
