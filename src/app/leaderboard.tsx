import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchLeaderboard, likeDog } from '@/api/dogs';
import { DogProfileCard, type DogProfile } from '@/components/dog-profile-card';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ACCENT = '#C8102E';

export default function LeaderboardScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [dogs, setDogs] = useState<DogProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    fetchLeaderboard(signal)
      .then(setDogs)
      .catch((e) => {
        if (e instanceof Error && e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false);
      });
  }, []);

  // Reload whenever the tab gains focus so new likes show up.
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      load(controller.signal);
      return () => controller.abort();
    }, [load])
  );

  return (
    <FlatList
      data={dogs}
      keyExtractor={(dog) => dog.id}
      renderItem={({ item, index }) => (
        <View style={styles.row}>
          <ThemedText style={styles.rank}>{index + 1}</ThemedText>
          <View style={styles.card}>
            <DogProfileCard dog={item} accentColor={ACCENT} onLike={(dog) => likeDog(dog.id)} />
          </View>
        </View>
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <ThemedText style={styles.title}>Leaderboard</ThemedText>
          <ThemedText themeColor="textSecondary">The most liked dogs on campus.</ThemedText>
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={ACCENT} style={styles.status} />
        ) : error ? (
          <View style={styles.status}>
            <ThemedText themeColor="textSecondary">{error}</ThemedText>
            <Pressable onPress={() => load()} accessibilityRole="button">
              <ThemedText type="smallBold" style={{ color: ACCENT }}>
                Try again
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <ThemedText themeColor="textSecondary" style={styles.status}>
            No dogs yet.
          </ThemedText>
        )
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + Spacing.four,
          paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
  },
  header: { gap: Spacing.two, marginBottom: Spacing.four },
  title: { fontSize: 34, lineHeight: 40, fontWeight: 800 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  rank: { width: 28, fontSize: 20, fontWeight: 800, color: ACCENT, textAlign: 'center' },
  card: { flex: 1 },
  separator: { height: Spacing.three },
  status: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
});
