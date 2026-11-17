import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LiveMap } from '@/components/live-map';
import type { LiveMapProps } from '@/components/live-map-types';
import { NearbyPanel } from '@/components/nearby-panel';
import { refreshDogs, useDogs } from '@/lib/dogs-store';
import { useWalkers } from '@/lib/walkers';

/** Interactive campus map: where dogs were last seen, plus walkers who chose to share. */
export default function MapScreen() {
  const dogs = useDogs();
  const walkers = useWalkers();
  const [focus, setFocus] = useState<LiveMapProps['focus']>();
  const pinned = useMemo(() => dogs.filter((d) => d.latitude !== undefined).length, [dogs]);

  useFocusEffect(
    useCallback(() => {
      refreshDogs();
    }, []),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.heading} accessibilityRole="header">
            Campus map
          </Text>
          <Text style={styles.subtitle}>
            {pinned} dogs pinned · {walkers.length} walking now
          </Text>
        </View>
        <LiveMap dogs={dogs} walkers={walkers} height={380} focus={focus} />
        <View style={styles.legend}>
          <Text style={styles.legendText}>● Red: where a dog was last seen</Text>
          <Text style={styles.legendText}>● Blue: someone walking a dog (approximate)</Text>
        </View>
        <NearbyPanel dogs={dogs} onLocated={(c, r) => setFocus({ ...c, radiusMeters: r })} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingTop: 19, paddingBottom: 12, gap: 4 },
  heading: { fontSize: 26, fontWeight: '800', color: '#28242b' },
  subtitle: { fontSize: 13, color: '#888188' },
  legend: { paddingHorizontal: 20, paddingTop: 10, gap: 2 },
  legendText: { fontSize: 11, color: '#8b858b' },
});
