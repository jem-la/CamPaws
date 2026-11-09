import { type Href, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RED } from '@/components/dog-profile-card';
import { CURRENT_USER, refreshDogs, useDogsState } from '@/lib/dogs-store';

const LINKS: { label: string; href: Href }[] = [
  { label: 'My Dogs', href: '/my-dogs' },
  { label: 'Add a dog', href: '/explore/new' },
  { label: 'Search dogs', href: '/explore' },
  { label: 'Leaderboard', href: '/leaderboard' },
];

export default function ProfileScreen() {
  const { dogs } = useDogsState();
  const mine = useMemo(() => dogs.filter((d) => d.addedBy === CURRENT_USER), [dogs]);
  const likesReceived = mine.reduce((sum, d) => sum + d.likes, 0);
  const initials = CURRENT_USER.split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

  useFocusEffect(
    useCallback(() => {
      refreshDogs();
    }, []),
  );

  const stats = [
    { label: 'Dogs added', value: mine.length },
    { label: 'Likes received', value: likesReceived },
    { label: 'Campus dogs', value: dogs.length },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name} accessibilityRole="header">
          {CURRENT_USER}
        </Text>
        <Text style={styles.subtitle}>Santa Clara University · Dog spotter</Text>

        <View style={styles.stats}>
          {stats.map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.links}>
          {LINKS.map((l) => (
            <Pressable
              key={l.label}
              accessibilityRole="link"
              style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
              onPress={() => router.push(l.href)}>
              <Text style={styles.linkText}>{l.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.note}>Accounts and sign-in are coming soon. For now you’re browsing as {CURRENT_USER}.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 32, maxWidth: 480, width: '100%', alignSelf: 'center', alignItems: 'center' },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#fff0f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: RED },
  name: { fontSize: 24, fontWeight: '800', color: '#28242b', marginTop: 12 },
  subtitle: { fontSize: 13, color: '#888188', marginTop: 4 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' },
  stat: { flex: 1, borderWidth: 1, borderColor: '#eee7e8', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: RED },
  statLabel: { fontSize: 11, color: '#8f858b', marginTop: 4 },
  links: { width: '100%', marginTop: 22, borderWidth: 1, borderColor: '#eee7e8', borderRadius: 14, overflow: 'hidden' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#f3eef0',
  },
  linkText: { fontSize: 15, color: '#2d272d', fontWeight: '600' },
  chevron: { fontSize: 22, color: RED },
  pressed: { backgroundColor: '#fcf7f8' },
  note: { fontSize: 12, color: '#9b949a', marginTop: 18, textAlign: 'center' },
});
