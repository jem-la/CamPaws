import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DogProfileCard, type DogProfile } from '@/components/dog-profile-card';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ACCENT = '#C8102E';
const ACCENT_SOFT = 'rgba(200, 16, 46, 0.1)';

const FILTERS = ['All dogs', 'Nearby', 'Friendly'] as const;

// Placeholder data until the feed is wired to the backend.
const DOGS: DogProfile[] = [
  { id: '1', name: 'Mochi', breed: 'Corgi', location: 'Library lawn', tint: '#F8E3D8' },
  { id: '2', name: 'Luna', breed: 'Golden retriever', location: 'Benson Center', tint: '#F3E6CC' },
  { id: '3', name: 'Pepper', breed: 'Dalmatian', location: 'Mission Gardens', tint: '#E4E8F0' },
];

export default function FeedScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // Filters are visual only for now; selecting one does not change the list.
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('All dogs');

  const header = (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <ThemedText style={styles.title}>Search dogs</ThemedText>
        <ThemedText themeColor="textSecondary">Good dogs. All around campus.</ThemedText>
      </View>

      <View
        style={[
          styles.searchBar,
          { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
        ]}>
        <SymbolView
          name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
          tintColor={theme.textSecondary}
          size={22}
        />
        <TextInput
          placeholder="Search dogs by name"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
          returnKeyType="search"
        />
        <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel="Search by photo">
          <SymbolView
            name={{ ios: 'camera', android: 'photo_camera', web: 'photo_camera' }}
            tintColor={ACCENT}
            size={22}
          />
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((filter) => {
          const active = filter === activeFilter;
          return (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.chip,
                active
                  ? { borderColor: ACCENT, backgroundColor: theme.background }
                  : { borderColor: theme.backgroundSelected, backgroundColor: theme.backgroundElement },
              ]}>
              <ThemedText
                type="smallBold"
                style={active && { color: ACCENT }}
                themeColor="textSecondary">
                {filter}
              </ThemedText>
            </Pressable>
          );
        })}
        <Pressable
          style={styles.filterButton}
          accessibilityRole="button"
          accessibilityLabel="More filters">
          <SymbolView
            name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
            tintColor={ACCENT}
            size={22}
          />
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Around campus</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {DOGS.length} dogs
        </ThemedText>
      </View>
    </View>
  );

  return (
    <FlatList
      data={DOGS}
      keyExtractor={(dog) => dog.id}
      renderItem={({ item }) => <DogProfileCard dog={item} accentColor={ACCENT} />}
      ListHeaderComponent={header}
      ListFooterComponent={
        <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
          Looking for a familiar face? Try photo search.
        </ThemedText>
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + Spacing.four,
          paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
  },
  header: {
    gap: Spacing.four,
    marginBottom: Spacing.three,
  },
  titleBlock: {
    gap: Spacing.two,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: 800,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    height: 60,
    borderWidth: 1,
    borderRadius: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    height: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterButton: {
    marginLeft: 'auto',
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT_SOFT,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
  },
  separator: {
    height: Spacing.three,
  },
  footer: {
    marginTop: Spacing.five,
    fontWeight: 400,
  },
});
