import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, RED } from '@/components/form-field';
import { api, type StartWalkDto, type WalkStatsDto, type WalkSummaryDto } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { showAlert } from '@/lib/confirm';
import { refreshDogs, useDogs } from '@/lib/dogs-store';
import { distanceMeters, formatDistance, formatDuration } from '@/lib/geo';

type Point = { latitude: number; longitude: number };
type Active = { dogId: number; dogName: string; startedAt: Date; publicSharing: boolean; session?: StartWalkDto };

const MAX_ACCURACY_M = 25; // ignore readings less precise than this (indoors GPS is often worse)
const MIN_STEP_M = 5; // GPS wobbles a few meters even when standing still

export default function WalkScreen() {
  const dogs = useDogs();
  const { user } = useAuth();
  const [dogId, setDogId] = useState<string | undefined>();
  const [share, setShare] = useState(false);
  const [active, setActive] = useState<Active | null>(null);
  const [meters, setMeters] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<WalkSummaryDto | null>(null);
  const [stats, setStats] = useState<WalkStatsDto | null>(null);
  const [error, setError] = useState<string | undefined>();

  const watcher = useRef<Location.LocationSubscription | null>(null);
  const last = useRef<Point | null>(null);
  const distance = useRef(0);
  const activeRef = useRef<Active | null>(null);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const sorted = useMemo(
    () => [...dogs].sort((a, b) => Number(b.ownerId === user?.userId) - Number(a.ownerId === user?.userId)),
    [dogs, user],
  );
  const selected = sorted.find((d) => d.id === dogId) ?? sorted[0];

  const loadStats = useCallback(() => {
    api
      .walkStats()
      .then(setStats)
      .catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshDogs();
      loadStats();
    }, [loadStats]),
  );

  // Clock for the walk in progress.
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - active.startedAt.getTime()) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [active]);

  // Stop tracking if the screen goes away.
  useEffect(() => () => watcher.current?.remove(), []);

  const onPosition = (loc: Location.LocationObject) => {
    const { latitude, longitude, accuracy } = loc.coords;
    if (accuracy == null || accuracy > MAX_ACCURACY_M) return;
    const point: Point = { latitude, longitude };
    if (last.current) {
      // A move smaller than the reading's own error is probably GPS wobble, so skip it
      // and keep the old point. Slow walking still adds up once you're far enough away.
      const step = distanceMeters(last.current, point);
      if (step < Math.max(accuracy, MIN_STEP_M)) return;
      distance.current += step;
      setMeters(distance.current);
    }
    last.current = point;

    const walk = activeRef.current;
    if (walk?.session && walk.publicSharing) {
      api.updateWalkLocation(walk.session.walkId, latitude, longitude).catch(() => undefined);
    }
  };

  const start = async () => {
    if (!selected) return;
    setBusy(true);
    setError(undefined);
    setSummary(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) throw new Error('Allow location access so CamPaws can measure your walk.');
      const first = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let session: StartWalkDto | undefined;
      try {
        session = await api.startWalk({
          dogId: Number(selected.id),
          publicSharing: share,
          ...(share ? { latitude: first.coords.latitude, longitude: first.coords.longitude } : {}),
        });
      } catch (e) {
        if (share) throw e; // sharing was requested, so don't silently walk privately
      }
      distance.current = 0;
      // Start measuring from the first accurate reading, not this quick (less accurate) fix.
      last.current = null;
      setMeters(0);
      setElapsed(0);
      setActive({ dogId: Number(selected.id), dogName: selected.name, startedAt: new Date(), publicSharing: share, session });
      watcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 3 },
        onPosition,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    const walk = active;
    if (!walk) return;
    setBusy(true);
    watcher.current?.remove();
    watcher.current = null;
    if (walk.session) {
      await api.endWalkSession(walk.session.walkId).catch(() => undefined);
    }
    try {
      const saved = await api.saveWalk({
        dogId: walk.dogId,
        startedAt: walk.startedAt.toISOString(),
        endedAt: new Date().toISOString(),
        distanceMeters: Math.round(distance.current),
        publicSharing: walk.publicSharing,
      });
      setSummary(saved);
      loadStats();
    } catch (e) {
      setError(`Your walk ended but couldn’t be saved: ${(e as Error).message}`);
    } finally {
      setActive(null);
      setBusy(false);
    }
  };

  const confirmEnd = () =>
    showAlert('End this walk?', `${formatDistance(meters)} in ${formatDuration(elapsed)} with ${active?.dogName}.`, [
      { text: 'Keep walking', style: 'cancel' },
      { text: 'End walk', style: 'destructive', onPress: () => void finish() },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading} accessibilityRole="header">
          Walk
        </Text>

        {active ? (
          <View style={styles.card}>
            <Text style={styles.live}>● Walking {active.dogName}</Text>
            <Text style={styles.big}>{formatDuration(elapsed)}</Text>
            <Text style={styles.bigSub}>{formatDistance(meters)}</Text>
            <Text style={styles.note}>
              {active.publicSharing
                ? 'Your approximate area is visible on the campus map. Keep CamPaws open while you walk.'
                : 'Private walk: your location is not shared. Keep CamPaws open while you walk.'}
            </Text>
            <PrimaryButton label="End walk" tone="danger" onPress={confirmEnd} busy={busy} />
          </View>
        ) : (
          <View style={styles.card}>
            {summary && (
              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Nice walk{summary.dogName ? ` with ${summary.dogName}` : ''}!</Text>
                <Text style={styles.summaryText}>
                  {formatDistance(summary.distanceMeters)} · {formatDuration(summary.durationSeconds)}
                </Text>
              </View>
            )}
            <Text style={styles.label}>Who are you walking?</Text>
            {sorted.length === 0 ? (
              <Text style={styles.note}>No dogs yet. Add a dog from the Profile tab first.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {sorted.map((d) => (
                  <Pressable
                    key={d.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: d.id === selected?.id }}
                    onPress={() => setDogId(d.id)}
                    style={[styles.chip, d.id === selected?.id && styles.chipOn]}>
                    <Text style={[styles.chipText, d.id === selected?.id && styles.chipTextOn]}>{d.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <View style={styles.shareRow}>
              <View style={styles.shareText}>
                <Text style={styles.shareTitle}>Show my walk on the campus map</Text>
                <Text style={styles.note}>Public walks appear as an approximate blue pin. Off keeps the walk private.</Text>
              </View>
              <Switch accessibilityLabel="Public walk" value={share} onValueChange={setShare} trackColor={{ true: RED }} />
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            <PrimaryButton label="Start walk" onPress={start} busy={busy || !selected} />
          </View>
        )}

        <Text style={styles.section}>Your walk statistics</Text>
        <View style={styles.stats}>
          <Stat label="Walks" value={String(stats?.walkCount ?? 0)} />
          <Stat label="Distance" value={formatDistance(stats?.totalDistanceMeters ?? 0)} />
          <Stat label="Time" value={formatDuration(stats?.totalDurationSeconds ?? 0)} />
        </View>
        {stats?.recent.length ? (
          stats.recent.map((w) => (
            <View key={w.walkId} style={styles.walkRow}>
              <View>
                <Text style={styles.walkName}>{w.dogName ?? 'Dog'}</Text>
                <Text style={styles.walkMeta}>{new Date(w.startedAt).toLocaleString()}</Text>
              </View>
              <Text style={styles.walkNumbers}>
                {formatDistance(w.distanceMeters)} · {formatDuration(w.durationSeconds)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.note}>Finish a walk and it will show up here.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40, maxWidth: 480, width: '100%', alignSelf: 'center', gap: 12 },
  heading: { fontSize: 26, fontWeight: '800', color: '#28242b' },
  card: { borderWidth: 1, borderColor: '#eee7e8', borderRadius: 16, padding: 16, gap: 12 },
  label: { fontSize: 12, fontWeight: '700', color: '#6f666d' },
  chips: { gap: 8 },
  chip: { borderWidth: 1, borderColor: '#e7dfe1', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  chipOn: { borderColor: RED, backgroundColor: '#fff0f1' },
  chipText: { fontSize: 13, color: '#5d565c' },
  chipTextOn: { color: RED, fontWeight: '700' },
  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shareText: { flex: 1, gap: 2 },
  shareTitle: { fontSize: 14, fontWeight: '700', color: '#2d272d' },
  note: { fontSize: 12, color: '#8b858b' },
  error: { fontSize: 13, color: '#b3182d' },
  live: { color: RED, fontWeight: '800', fontSize: 14 },
  big: { fontSize: 52, fontWeight: '800', color: '#28242b', textAlign: 'center' },
  bigSub: { fontSize: 22, fontWeight: '700', color: RED, textAlign: 'center' },
  summary: { backgroundColor: '#eaf6ef', borderRadius: 12, padding: 12, gap: 2 },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#1f7a45' },
  summaryText: { fontSize: 13, color: '#1f7a45' },
  section: { fontSize: 18, fontWeight: '800', color: '#28242b', marginTop: 12 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderWidth: 1, borderColor: '#eee7e8', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: RED },
  statLabel: { fontSize: 11, color: '#8f858b', marginTop: 4 },
  walkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3eef0', paddingVertical: 10 },
  walkName: { fontSize: 14, fontWeight: '700', color: '#2d272d' },
  walkMeta: { fontSize: 11, color: '#8f858b', marginTop: 2 },
  walkNumbers: { fontSize: 13, color: '#4a434a', fontWeight: '600' },
});
