import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DogCard, RED } from '@/components/dog-profile-card';
import { showAlert } from '@/lib/confirm';
import { CURRENT_USER, rankByLikes, refreshDogs, useDogsState } from '@/lib/dogs-store';

const FEATURED_COUNT = 3;

export default function HomeScreen() {
  const { dogs, status, error } = useDogsState();
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [walking, setWalking] = useState(false);

  // Reload whenever Home comes back into view so new dogs and likes show up.
  useFocusEffect(
    useCallback(() => {
      refreshDogs();
    }, []),
  );

  const q = query.trim().toLowerCase();
  const ranked = useMemo(() => rankByLikes(dogs), [dogs]);
  const matches = useMemo(() => (q ? ranked.filter((d) => d.name.toLowerCase().includes(q)) : ranked), [ranked, q]);
  const visible = showAll || q ? matches : matches.slice(0, FEATURED_COUNT);
  const firstName = CURRENT_USER.split(' ')[0];
  const firstLoad = status === 'loading' && dogs.length === 0;

  const openSearch = () => router.push({ pathname: '/explore', params: q ? { q: query.trim() } : {} });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading} accessibilityRole="header">
          Hi, {firstName}
        </Text>
        <Text style={styles.subtitle}>A little more tail-wagging today.</Text>

        <View style={styles.search}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={openSearch}
            returnKeyType="search"
            placeholder="Search dogs by name"
            placeholderTextColor="#969095"
            accessibilityLabel="Search dogs by name"
            autoCorrect={false}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search by photo"
            hitSlop={8}
            onPress={() => showAlert('Photo search', 'Photo search is coming soon.')}>
            <Text style={styles.camera}>▣</Text>
          </Pressable>
        </View>

        <View style={styles.activity}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionSmall}>Campus activity</Text>
            <Text style={styles.muted}>{dogs.length} dogs on CamPaws · walk map is sample data</Text>
          </View>
          <View style={styles.map}>
            <View style={[styles.road, { top: 21, left: -15, width: 280, transform: [{ rotate: '-7deg' }] }]} />
            <View style={[styles.road, { top: 76, left: -20, width: 290, transform: [{ rotate: '4deg' }] }]} />
            <View style={[styles.road, { top: -10, left: 157, width: 200, transform: [{ rotate: '72deg' }] }]} />
            <View style={[styles.grass, { top: 43, left: 24 }]} />
            <View style={[styles.grass, { top: 66, left: 108 }]} />
            <View style={[styles.grass, { top: 18, left: 130 }]} />
            <View style={[styles.mapLabel, { top: 15, left: 48 }]}>
              <Text style={styles.mapLabelText}>Mission Church</Text>
            </View>
            <View style={[styles.mapLabel, { top: 51, left: 62 }]}>
              <Text style={styles.mapLabelText}>Library</Text>
            </View>
            <View style={[styles.pin, { top: 35, left: 80 }]}>
              <Text style={styles.pinText}>3</Text>
            </View>
            <View style={[styles.pin, { top: 61, left: 169 }]}>
              <Text style={styles.pinText}>2</Text>
            </View>
            <View style={[styles.pin, { top: 83, left: 108 }]}>
              <Text style={styles.pinText}>1</Text>
            </View>
          </View>
          <Pressable
            style={styles.mapFooter}
            accessibilityRole="button"
            onPress={() => showAlert('Campus activity', 'Live walk locations are coming soon. This map shows sample data.')}>
            <View>
              <Text style={styles.mapBold}>Updates every 3 minutes</Text>
              <Text style={styles.muted}>Approximate areas only</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>{q ? 'Matching dogs' : 'Campus favorites'}</Text>
          {!q && matches.length > FEATURED_COUNT && (
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setShowAll((v) => !v)}>
              <Text style={styles.link}>{showAll ? 'Show less' : 'See all'}</Text>
            </Pressable>
          )}
        </View>

        {firstLoad ? (
          <ActivityIndicator color={RED} style={styles.spinner} />
        ) : status === 'error' && dogs.length === 0 ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => refreshDogs()}>
              <Text style={styles.link}>Try again</Text>
            </Pressable>
          </View>
        ) : visible.length ? (
          visible.map((d) => <DogCard key={d.id} dog={d} />)
        ) : (
          <Text style={styles.empty}>{q ? `No dogs named “${query.trim()}” yet.` : 'No dogs yet.'}</Text>
        )}

        <View style={styles.actions}>
          <Pressable
            style={styles.outlineButton}
            accessibilityRole="button"
            onPress={() => router.push('/explore/new')}>
            <Text style={styles.buttonText}>Add a dog</Text>
          </Pressable>
          <Pressable style={styles.softButton} accessibilityRole="button" onPress={() => setWalking((v) => !v)}>
            <Text style={styles.buttonText}>{walking ? 'Walk started ✓' : 'Start a walk'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 19, paddingBottom: 26, maxWidth: 480, width: '100%', alignSelf: 'center' },
  heading: { fontSize: 26, fontWeight: '800', color: '#28242b' },
  subtitle: { fontSize: 13, color: '#888188', marginTop: 5, marginBottom: 21 },
  search: {
    height: 46,
    borderWidth: 1,
    borderColor: '#eee7e8',
    backgroundColor: '#fcfafb',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginBottom: 15,
  },
  searchIcon: { fontSize: 24, color: '#8d858b', marginRight: 9 },
  input: { flex: 1, fontSize: 14, color: '#2c292d', height: '100%' },
  camera: { fontSize: 20, color: RED },
  activity: { borderWidth: 1, borderColor: '#eee8e9', borderRadius: 16, overflow: 'hidden' },
  activityHeader: { paddingHorizontal: 13, paddingTop: 12, paddingBottom: 8 },
  sectionSmall: { fontSize: 14, fontWeight: '700', color: '#29262b' },
  muted: { fontSize: 10, color: '#9b949a', marginTop: 3 },
  map: { height: 112, backgroundColor: '#f3f5f6', overflow: 'hidden', position: 'relative' },
  road: { position: 'absolute', height: 10, backgroundColor: '#fff', borderRadius: 10 },
  grass: { position: 'absolute', width: 47, height: 17, borderRadius: 20, backgroundColor: '#e0ecd9' },
  mapLabel: { position: 'absolute', backgroundColor: '#fff', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  mapLabelText: { fontSize: 8, color: '#49444a', fontWeight: '600' },
  pin: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: RED,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  mapFooter: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  mapBold: { fontSize: 11, fontWeight: '700', color: '#383138' },
  arrow: { fontSize: 24, color: RED },
  titleRow: { marginTop: 17, marginBottom: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#28242b' },
  link: { fontSize: 12, color: RED, fontWeight: '600' },
  spinner: { marginVertical: 20 },
  errorBox: { padding: 12, borderRadius: 12, backgroundColor: '#fff0f1', gap: 6, marginBottom: 10 },
  errorText: { fontSize: 13, color: '#7a2533' },
  empty: { fontSize: 13, color: '#8b858b', paddingVertical: 16 },
  actions: { flexDirection: 'row', gap: 11, marginTop: 9 },
  outlineButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee7e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  softButton: { flex: 1, height: 44, borderRadius: 12, backgroundColor: '#fff0f1', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: RED, fontSize: 13, fontWeight: '700' },
});
