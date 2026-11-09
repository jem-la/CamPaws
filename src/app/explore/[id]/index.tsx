import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { RED } from '@/components/dog-form';
import { showAlert } from '@/lib/confirm';
import { dogTint, furSwatches, likeDog, PETTING_LABELS, useDog } from '@/lib/dogs-store';

export default function DogProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dog, error } = useDog(id);
  const { width } = useWindowDimensions();
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!dog) {
    return (
      <View style={styles.missing}>
        <Stack.Screen options={{ title: 'Dog profile' }} />
        {error ? <Text style={styles.missingText}>{error}</Text> : <ActivityIndicator color={RED} />}
      </View>
    );
  }

  const photoWidth = Math.min(width, 480) - 40;
  const swatches = furSwatches(dog.furColor);
  const tags = [dog.temperament, dog.petting === 'ask' ? 'Ask before petting' : `Petting: ${PETTING_LABELS[dog.petting]}`];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: 'Dog profile',
          headerRight: () => (
            <Pressable
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${dog.name}`}
              onPress={() => router.push({ pathname: '/explore/[id]/edit', params: { id: dog.id } })}>
              <Text style={styles.headerAction}>Edit</Text>
            </Pressable>
          ),
        }}
      />

      <View style={[styles.hero, { backgroundColor: dogTint(dog) }]}>
        {dog.photos.length > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / photoWidth))}>
            {dog.photos.map((uri, i) => (
              <Image key={`${i}-${uri}`} source={{ uri }} style={{ width: photoWidth, height: 230 }} contentFit="cover" />
            ))}
          </ScrollView>
        )}
        {dog.photos.length > 1 && (
          <View style={styles.dots}>
            {dog.photos.map((_, i) => (
              <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.name} numberOfLines={2}>
          {dog.name}
        </Text>
        {dog.furColor && (
          <View style={styles.furPill}>
            <Text style={styles.furText} numberOfLines={1}>
              {dog.furColor}
            </Text>
            {swatches.map((c) => (
              <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
            ))}
          </View>
        )}
      </View>
      {dog.location && <Text style={styles.location}>⌖ Usually near {dog.location}</Text>}

      <View style={styles.actions}>
        <Pressable style={[styles.action, styles.likeAction]} onPress={() => likeDog(dog.id).catch((e: Error) => showAlert('Couldn’t like', e.message))}>
          <Text style={styles.actionText}>Like · {dog.likes} ♡</Text>
        </Pressable>
        <Pressable
          style={[styles.action, styles.commentAction]}
          onPress={() => showAlert('Comments', 'Comments are coming soon.')}>
          <Text style={styles.actionText}>Comments</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>A little about {dog.name}</Text>
      {dog.about && <Text style={styles.about}>{dog.about}</Text>}
      <View style={styles.tags}>
        {tags.filter(Boolean).map((t, i) => (
          <View key={t} style={[styles.tag, i === 0 && dog.temperament && styles.tagPrimary]}>
            <Text style={[styles.tagText, i === 0 && dog.temperament && styles.tagTextPrimary]}>{t}</Text>
          </View>
        ))}
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{dog.addedBy ? `Added by ${dog.addedBy}` : ''}</Text>
        {dog.campusVisits && <Text style={styles.meta}>Visits: {dog.campusVisits.toLowerCase()}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40, maxWidth: 480, width: '100%', alignSelf: 'center' },
  headerAction: { color: RED, fontSize: 16, fontWeight: '600' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  missingText: { fontSize: 15, color: '#7d757b' },
  hero: { height: 230, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', bottom: 10, flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotActive: { backgroundColor: '#fff' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 20 },
  name: { flexShrink: 1, fontSize: 32, fontWeight: '800', color: '#28242b' },
  furPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#e8e1e3',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '55%',
  },
  furText: { fontSize: 12, color: '#6f686e', marginRight: 4, flexShrink: 1 },
  swatch: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#e2d8d4' },
  location: { fontSize: 13, color: '#7d757b', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  action: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  likeAction: { backgroundColor: '#fff0f1' },
  commentAction: { borderWidth: 1, borderColor: '#e8e1e3' },
  actionText: { color: RED, fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#28242b', marginTop: 24 },
  about: { fontSize: 14, color: '#6f686e', lineHeight: 20, marginTop: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  tag: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: '#f4f1f2' },
  tagPrimary: { backgroundColor: '#fff0f1', borderWidth: 1, borderColor: RED },
  tagText: { fontSize: 12, color: '#5d565c' },
  tagTextPrimary: { color: RED, fontWeight: '600' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  meta: { fontSize: 12, color: '#8f878d' },
});
