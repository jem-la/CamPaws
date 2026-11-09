import { Slot, usePathname, useRouter } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ITEMS = [
  { route: '/', name: 'Home', icon: '⌂' },
  { route: '/leaderboard', name: 'Leaderboard', icon: '🏆' },
  { route: '/explore', name: 'Search Dogs', icon: '⌕' },
  { route: '/my-dogs', name: 'My Dogs', icon: '🐾' },
  { route: '/profile', name: 'Profile', icon: '♙' },
] as const;

function WebTabs() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <SafeAreaView style={styles.shell} edges={['bottom']}>
      <View style={styles.page}><Slot /></View>
      <View style={styles.tabBar}>
        {ITEMS.map(item => {
          const selected = pathname === item.route || (item.route === '/' && pathname === '/index');
          return (
            <Pressable key={item.route} accessibilityRole="tab" accessibilityState={{ selected }}
              onPress={() => router.push(item.route as any)} style={styles.tab}>
              <Text style={[styles.icon, selected && styles.selected]}>{item.icon}</Text>
              <Text numberOfLines={1} style={[styles.label, selected && styles.selected]}>{item.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function AppTabs() {
  if (Platform.OS === 'web') return <WebTabs />;
  return (
    <NativeTabs backgroundColor="#ffffff">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/home.png')} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="leaderboard"><NativeTabs.Trigger.Label>Leaderboard</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Search Dogs</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/explore.png')} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="my-dogs"><NativeTabs.Trigger.Label>My Dogs</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile"><NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    </NativeTabs>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#fff', minHeight: 0 },
  page: { flex: 1, minHeight: 0, width: '100%' },
  tabBar: { flexDirection: 'row', alignSelf: 'center', width: '100%', maxWidth: 430,
    minHeight: 68, paddingTop: 9, paddingBottom: 8, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#f0e7e9' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 0 },
  icon: { fontSize: 23, color: '#8e898e', height: 29, textAlign: 'center' },
  label: { fontSize: 10, color: '#8e898e', textAlign: 'center' },
  selected: { color: '#c92e45', fontWeight: '700' },
});
