import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DogCard, RED } from '@/components/dog-profile-card';
import { rankByLikes, refreshDogs, useDogsState } from '@/lib/dogs-store';

export default function LeaderboardScreen() {
  const { dogs, status, error } = useDogsState();
  const ranked = useMemo(() => rankByLikes(dogs), [dogs]);

  // Reload whenever the tab gains focus so new likes show up.
  useFocusEffect(
    useCallback(() => {
      refreshDogs();
    }, []),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={ranked}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.content}
        renderItem={({ item, index }) => <DogCard dog={item} rank={index + 1} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading} accessibilityRole="header">
              Leaderboard
            </Text>
            <Text style={styles.subtitle}>The most liked dogs on campus. Tap ♥ to cheer for one.</Text>
          </View>
        }
        ListEmptyComponent={
          status === 'loading' ? (
            <ActivityIndicator color={RED} style={styles.status} />
          ) : status === 'error' ? (
            <View style={styles.status}>
              <Text style={styles.muted}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={() => refreshDogs()}>
                <Text style={styles.link}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={[styles.muted, styles.status]}>No dogs yet.</Text>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 20, paddingTop: 19, paddingBottom: 32, maxWidth: 480, width: '100%', alignSelf: 'center' },
  header: { marginBottom: 16, gap: 5 },
  heading: { fontSize: 26, fontWeight: '800', color: '#28242b' },
  subtitle: { fontSize: 13, color: '#888188' },
  status: { alignItems: 'center', gap: 8, paddingVertical: 24, textAlign: 'center' },
  muted: { fontSize: 14, color: '#8b858b' },
  link: { fontSize: 13, color: RED, fontWeight: '700' },
});
