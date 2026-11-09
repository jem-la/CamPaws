import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { showAlert } from '@/lib/confirm';
import { type Dog, dogTint, furSwatches, likeDog } from '@/lib/dogs-store';

export const RED = '#c92e45';

type DogCardProps = {
  dog: Dog;
  /** Optional leaderboard position shown before the photo. */
  rank?: number;
};

/** A dog row used across Home, Leaderboard and My Dogs. Tapping it opens the profile. */
export function DogCard({ dog, rank }: DogCardProps) {
  const swatches = furSwatches(dog.furColor);

  const like = () => {
    likeDog(dog.id).catch((e: Error) => showAlert('Couldn’t like', e.message));
  };

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${dog.name}'s profile`}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
        onPress={() =>
          // withAnchor keeps the search list under the profile so Back works across tabs.
          router.push({ pathname: '/explore/[id]', params: { id: dog.id } }, { withAnchor: true })
        }>
        {rank !== undefined && <Text style={styles.rank}>{rank}</Text>}
        <View style={[styles.photo, { backgroundColor: dogTint(dog) }]}>
          {dog.photos.length > 0 && (
            <Image
              source={{ uri: dog.photos[0] }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessibilityLabel={`Photo of ${dog.name}`}
            />
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {dog.name}
          </Text>
          {dog.furColor && (
            <Text style={styles.sub} numberOfLines={1}>
              {dog.furColor}
            </Text>
          )}
          {dog.location && (
            <Text style={styles.location} numberOfLines={1}>
              ⌖ {dog.location}
            </Text>
          )}
        </View>
      </Pressable>
      <View style={styles.right}>
        <Pressable
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Like ${dog.name}, ${dog.likes} likes`}
          onPress={like}
          style={styles.likeButton}>
          <Text style={styles.heart}>♥</Text>
          <Text style={styles.likes}>{dog.likes}</Text>
        </Pressable>
        <View style={styles.swatches}>
          {swatches.map((c) => (
            <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#eee7e8',
    borderRadius: 15,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  pressed: { opacity: 0.7 },
  rank: { width: 28, fontSize: 18, fontWeight: '800', color: RED, textAlign: 'center' },
  photo: { width: 76, height: 70, borderRadius: 10, overflow: 'hidden' },
  info: { flex: 1, marginLeft: 13, gap: 3 },
  name: { fontSize: 16, fontWeight: '800', color: '#2d272d' },
  sub: { fontSize: 12, color: '#8f858b' },
  location: { fontSize: 11, color: '#898188' },
  right: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, gap: 6 },
  likeButton: { alignItems: 'center' },
  heart: { fontSize: 22, color: RED },
  likes: { fontSize: 11, color: '#8f858b' },
  swatches: { flexDirection: 'row', gap: 3 },
  swatch: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#e2d8d4' },
});
