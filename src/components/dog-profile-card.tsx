import { Image, type ImageSource } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type DogProfile = {
  id: string;
  name: string;
  breed: string;
  location: string;
  photo?: ImageSource;
  /** background behind the photo, also used as the placeholder when there is no photo */
  tint: string;
};

type DogProfileCardProps = {
  dog: DogProfile;
  accentColor: string;
  onPress?: () => void;
};

export function DogProfileCard({ dog, accentColor, onPress }: DogProfileCardProps) {
  const theme = useTheme();
  const [favorited, setFavorited] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: theme.backgroundSelected, backgroundColor: theme.background },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.photo, { backgroundColor: dog.tint }]}>
        {dog.photo ? (
          <Image source={dog.photo} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <SymbolView
            name={{ ios: 'pawprint.fill', android: 'pets', web: 'pets' }}
            tintColor="rgba(0, 0, 0, 0.25)"
            size={40}
          />
        )}
      </View>

      <View style={styles.info}>
        <ThemedText style={styles.name}>{dog.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {dog.breed}
        </ThemedText>
        <View style={styles.locationRow}>
          <SymbolView
            name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
            tintColor={theme.textSecondary}
            size={14}
          />
          <ThemedText style={styles.location} themeColor="textSecondary">
            {dog.location}
          </ThemedText>
        </View>
      </View>

      <Pressable
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={favorited ? `Unfavorite ${dog.name}` : `Favorite ${dog.name}`}
        onPress={() => setFavorited((value) => !value)}
        style={styles.favorite}>
        <SymbolView
          name={{
            ios: favorited ? 'heart.fill' : 'heart',
            android: 'favorite',
            web: 'favorite',
          }}
          tintColor={accentColor}
          size={22}
        />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    borderWidth: 1,
    borderRadius: 16,
  },
  pressed: {
    opacity: 0.7,
  },
  photo: {
    width: 120,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: Spacing.half,
  },
  name: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  location: {
    fontSize: 13,
    lineHeight: 18,
  },
  favorite: {
    alignSelf: 'flex-start',
    padding: Spacing.one,
  },
});
