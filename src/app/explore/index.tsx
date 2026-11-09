import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RED } from '@/components/dog-form';
import { dogTint, furSwatches, refreshDogs, useDogsState } from '@/lib/dogs-store';

export default function SearchDogsScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q ?? '');
  const { dogs, status, error } = useDogsState();
  const [pulling, setPulling] = useState(false);
  useFocusEffect(
    useCallback(() => {
      refreshDogs();
    }, []),
  );
  const onPull = async () => {
    setPulling(true);
    await refreshDogs();
    setPulling(false);
  };
  const firstLoad = status === 'loading' && dogs.length === 0;
  const q = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      q
        ? dogs.filter((d) =>
            [d.name, d.furColor, d.location, d.temperament].some((f) => f?.toLowerCase().includes(q)),
          )
        : dogs,
    [dogs, q],
  );

  const createProfile = () =>
    router.push({ pathname: '/explore/new', params: query.trim() ? { name: query.trim() } : {} });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={results}
        keyExtractor={(d) => d.id}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={pulling} onRefresh={onPull} tintColor={RED} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Text style={styles.heading}>Search dogs</Text>
            <View style={styles.search}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name, color or spot"
                placeholderTextColor="#969095"
                accessibilityLabel="Search dogs"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>
            {status === 'error' ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={() => refreshDogs()} accessibilityRole="button" hitSlop={8}>
                  <Text style={styles.retry}>Try again</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.count}>
                {firstLoad
                  ? 'Loading dogs…'
                  : q
                    ? `${results.length} result${results.length === 1 ? '' : 's'}`
                    : `${dogs.length} campus dog${dogs.length === 1 ? '' : 's'}`}
              </Text>
            )}
          </View>
        }
        renderItem={({ item: d }) => {
          const swatches = furSwatches(d.furColor);
          return (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() => router.push({ pathname: '/explore/[id]', params: { id: d.id } })}>
              <View style={[styles.photo, { backgroundColor: dogTint(d) }]}>
                {d.photos.length > 0 && (
                  <Image source={{ uri: d.photos[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
                )}
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{d.name}</Text>
                {d.furColor && <Text style={styles.sub}>{d.furColor}</Text>}
                {d.location && <Text style={styles.sub}>⌖ {d.location}</Text>}
              </View>
              <View style={styles.swatches}>
                {swatches.map((c) => (
                  <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
                ))}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          firstLoad ? (
            <ActivityIndicator color={RED} style={styles.spinner} />
          ) : status === 'error' ? undefined : (
            <Text style={styles.empty}>
              {q ? `No dogs match “${query.trim()}”.` : 'No dogs yet. Be the first to add one!'}
            </Text>
          )
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerText}>Can’t find the dog you met?</Text>
            <Pressable
              style={({ pressed }) => [styles.createBtn, pressed && styles.pressed]}
              onPress={createProfile}
              accessibilityRole="button">
              <Text style={styles.createText}>Create profile</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 20, paddingTop: 19, paddingBottom: 32, maxWidth: 480, width: '100%', alignSelf: 'center' },
  pressed: { opacity: 0.7 },
  heading: { fontSize: 26, fontWeight: '800', color: '#28242b', marginBottom: 16 },
  search: {
    height: 46,
    borderWidth: 1,
    borderColor: '#eee7e8',
    backgroundColor: '#fcfafb',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  searchIcon: { fontSize: 24, color: '#8d858b', marginRight: 9 },
  input: { flex: 1, fontSize: 14, color: '#2c292d', height: '100%' },
  count: { fontSize: 12, color: '#8f878d', marginTop: 14, marginBottom: 10 },
  card: {
    borderWidth: 1,
    borderColor: '#eee7e8',
    borderRadius: 15,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  photo: {
    width: 76,
    height: 70,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  info: { flex: 1, marginLeft: 13, gap: 3 },
  name: { fontSize: 16, fontWeight: '800', color: '#2d272d' },
  sub: { fontSize: 12, color: '#8f858b' },
  swatches: { flexDirection: 'row', gap: 3, paddingHorizontal: 8 },
  swatch: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#e2d8d4' },
  spinner: { marginVertical: 24 },
  errorBox: { marginTop: 14, marginBottom: 10, padding: 12, borderRadius: 12, backgroundColor: '#fff0f1', gap: 6 },
  errorText: { fontSize: 13, color: '#7a2533' },
  retry: { fontSize: 13, fontWeight: '700', color: RED },
  empty: { fontSize: 14, color: '#8b858b', paddingVertical: 16, textAlign: 'center' },
  footer: { alignItems: 'center', gap: 10, marginTop: 16 },
  footerText: { fontSize: 13, color: '#7d757b' },
  createBtn: {
    height: 46,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
