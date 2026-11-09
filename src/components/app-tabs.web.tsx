
import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const items = [
  { name: 'home', href: '/', label: 'Home', icon: '⌂' },
  { name: 'leaderboard', href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { name: 'search', href: '/explore', label: 'Search Dogs', icon: '⌕' },
  { name: 'dogs', href: '/my-dogs', label: 'My Dogs', icon: '🐾' },
  { name: 'profile', href: '/profile', label: 'Profile', icon: '♙' },
] as const;

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.page} />

      <TabList asChild>
        <View style={styles.tabBar}>
          {items.map((item) => (
            <TabTrigger
              key={item.name}
              name={item.name}
              href={item.href}
              // Tapping a tab always opens its main screen (e.g. the search list, not an old profile).
              resetOnFocus
              asChild
            >
              <TabButton icon={item.icon} label={item.label} />
            </TabTrigger>
          ))}
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  icon,
  label,
  isFocused,
  ...props
}: {
  icon: string;
  label: string;
  isFocused?: boolean;
  [key: string]: any;
}) {
  return (
    <Pressable {...props} style={styles.tab}>
      <Text style={[styles.icon, isFocused && styles.active]}>
        {icon}
      </Text>
      <Text style={[styles.label, isFocused && styles.active]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingBottom: 80,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 430,
    height: 72,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  icon: {
    fontSize: 23,
    color: '#888888',
  },
  label: {
    fontSize: 10,
    color: '#888888',
  },
  active: {
    color: '#cc3045',
    fontWeight: '700',
  },
});
