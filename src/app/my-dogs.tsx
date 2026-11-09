import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DogCard, RED } from '@/components/dog-profile-card';
import { CURRENT_USER, refreshDogs, useDogsState } from '@/lib/dogs-store';

/** Dogs the current user added to CamPaws. */
export default function MyDogsScreen() {
  const { dogs, status, error } = useDogsState();
  const mine = useMemo(() => dogs.filter((d) => d.addedBy === CURRENT_USER), [dogs]);

  useFocusEffect(
    useCallback(() => {
      refreshDogs();
    }, []),
  );

  const addButton = (
    <Pressable
      style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
      accessibilityRole="button"
      onPress={() => router.push('/explore/new')}>
      <Text style={styles.addText}>Add a dog</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={mine}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => <DogCard dog={item} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading} accessibilityRole="header">
              My Dogs
            </Text>
            <Text style={styles.subtitle}>
              {mine.length
                ? `You've added ${mine.length} dog${mine.length === 1 ? '' : 's'} to CamPaws.`
                : 'Dogs you add will show up here.'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          status === 'loading' && dogs.length === 0 ? (
            <ActivityIndicator color={RED} style={styles.status} />
          ) : status === 'error' ? (
            <View style={styles.status}>
              <Text style={styles.muted}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={() => refreshDogs()}>
                <Text style={styles.link}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={[styles.muted, styles.status]}>You haven’t added any dogs yet.</Text>
          )
        }
        ListFooterComponent={<View style={styles.footer}>{addButton}</View>}
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
  footer: { alignItems: 'center', marginTop: 12 },
  addBtn: {
    height: 46,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
