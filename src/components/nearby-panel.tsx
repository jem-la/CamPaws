import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { RED } from '@/components/form-field';
import { api } from '@/lib/api';
import { type Dog } from '@/lib/dogs-store';
import { distanceMeters, formatDistance } from '@/lib/geo';

const RADII = [250, 500, 1000, 2000];

type Coords = { latitude: number; longitude: number };
type Found = { dog: Dog; meters: number };

/** "Find dogs near me": asks for the phone's location and lists dogs last seen within a radius. */
export function NearbyPanel({
  dogs,
  onLocated,
}: {
  dogs: Dog[];
  onLocated?: (coords: Coords, radiusMeters: number) => void;
}) {
  const [radius, setRadius] = useState(500);
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<Found[] | null>(null);
  const [error, setError] = useState<string | undefined>();

  const search = async (r = radius) => {
    setBusy(true);
    setError(undefined);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setError('Allow location access to find dogs near you.');
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const here = { latitude: coords.latitude, longitude: coords.longitude };
      const list = await api.nearbyDogs(here.latitude, here.longitude, r);
      const byId = new Map(dogs.map((d) => [d.id, d]));
      setFound(
        list
          .map((d) => ({ dog: byId.get(String(d.dogId)), dto: d }))
          .filter((x): x is { dog: Dog; dto: (typeof list)[number] } => !!x.dog)
          .map(({ dog, dto }) => ({
            dog,
            meters: distanceMeters(here, { latitude: dto.latitude ?? here.latitude, longitude: dto.longitude ?? here.longitude }),
          })),
      );
      onLocated?.(here, r);
    } catch (e) {
      setError((e as Error).message || 'Couldn’t find your location.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.title}>Dogs near me</Text>
        <Pressable accessibilityRole="button" onPress={() => search()} disabled={busy} style={styles.go}>
          {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.goText}>{found ? 'Refresh' : 'Find'}</Text>}
        </Pressable>
      </View>
      <View style={styles.chips}>
        {RADII.map((r) => (
          <Pressable
            key={r}
            accessibilityRole="button"
            accessibilityState={{ selected: r === radius }}
            onPress={() => {
              setRadius(r);
              if (found) void search(r);
            }}
            style={[styles.chip, r === radius && styles.chipOn]}>
            <Text style={[styles.chipText, r === radius && styles.chipTextOn]}>{formatDistance(r)}</Text>
          </Pressable>
        ))}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {found && found.length === 0 && <Text style={styles.muted}>No dogs have been seen within {formatDistance(radius)} of you.</Text>}
      {found?.map(({ dog, meters }) => (
        <Pressable
          key={dog.id}
          accessibilityRole="button"
          style={styles.item}
          onPress={() => router.push({ pathname: '/explore/[id]', params: { id: dog.id } }, { withAnchor: true })}>
          <Text style={styles.itemName}>{dog.name}</Text>
          <Text style={styles.itemMeta}>
            {formatDistance(meters)} away{dog.location ? ` · ${dog.location}` : ''}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#28242b' },
  go: { backgroundColor: RED, borderRadius: 10, paddingHorizontal: 18, height: 36, alignItems: 'center', justifyContent: 'center', minWidth: 76 },
  goText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderColor: '#e7dfe1', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipOn: { borderColor: RED, backgroundColor: '#fff0f1' },
  chipText: { fontSize: 12, color: '#5d565c' },
  chipTextOn: { color: RED, fontWeight: '700' },
  error: { color: '#b3182d', fontSize: 13 },
  muted: { color: '#8b858b', fontSize: 13 },
  item: { borderWidth: 1, borderColor: '#eee7e8', borderRadius: 12, padding: 12, gap: 2 },
  itemName: { fontSize: 15, fontWeight: '800', color: '#2d272d' },
  itemMeta: { fontSize: 12, color: '#8f858b' },
});
