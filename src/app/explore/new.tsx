import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DogForm, EMPTY_DOG, RED } from '@/components/dog-form';
import { showAlert } from '@/lib/confirm';
import { createDog, type Dog, type DogInput, findDuplicates } from '@/lib/dogs-store';

const isDirty = (v: DogInput) =>
  v.photos.length > 0 ||
  [v.name, v.furColor, v.temperament, v.campusVisits, v.location, v.about].some((f) => f?.trim()) ||
  v.petting !== EMPTY_DOG.petting;

/** The duplicate we suggested, and the name/fur color it was found for. */
type Suggestion = { dog: Dog; name: string; furColor: string };

const key = (v?: string) => (v ?? '').trim().toLowerCase();

export default function CreateDogScreen() {
  const params = useLocalSearchParams<{ name?: string }>();
  const [initial] = useState<DogInput>(() => ({ ...EMPTY_DOG, name: params.name ?? '' }));
  const [dirty, setDirty] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  // Alternative flow 3: cancelling discards the draft and no profile is created.
  const disablePrevention = usePreventRemove(dirty, ({ repeat }) => {
    showAlert('Discard this dog?', 'Nothing will be saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: repeat },
    ]);
  });

  const leaveTo = (go: () => void) => {
    disablePrevention();
    setDirty(false);
    go();
  };

  const onSubmit = async (value: DogInput) => {
    // Alternative flow 2: suggest an existing profile first. Once the user has seen the
    // suggestion, submitting again creates a new profile anyway.
    if (!suggestion) {
      const [match] = await findDuplicates(value);
      if (match) {
        setSuggestion({ dog: match, name: key(value.name), furColor: key(value.furColor) });
        return;
      }
    }
    const dog = await createDog(value);
    leaveTo(() => router.replace({ pathname: '/explore/[id]', params: { id: dog.id } }));
  };

  const dup = suggestion?.dog;
  const notice = dup && (
    <View style={styles.notice} accessibilityRole="alert">
      <Text style={styles.noticeTitle}>{dup.name} might already be on CamPaws</Text>
      <Text style={styles.noticeBody}>
        {[dup.furColor, dup.location && `usually near ${dup.location}`].filter(Boolean).join(' · ') ||
          'A dog with this name already has a profile.'}
        {'\n'}Is this the same dog?
      </Text>
      <View style={styles.noticeActions}>
        <Pressable
          style={styles.noticeBtn}
          onPress={() => leaveTo(() => router.replace({ pathname: '/explore/[id]', params: { id: dup.id } }))}>
          <Text style={styles.noticeBtnText}>View profile</Text>
        </Pressable>
        <Pressable
          style={styles.noticeBtn}
          onPress={() => leaveTo(() => router.replace({ pathname: '/explore/[id]/edit', params: { id: dup.id } }))}>
          <Text style={styles.noticeBtnText}>Update it</Text>
        </Pressable>
      </View>
      <Text style={styles.noticeHint}>Different dog? Tap “Create dog profile” again to create it anyway.</Text>
    </View>
  );

  return (
    <DogForm
      initial={initial}
      submitLabel="Create dog profile"
      notice={notice}
      onChange={(v) => {
        setDirty(isDirty(v));
        // Changing the name or fur color means the suggestion may no longer apply.
        if (suggestion && (key(v.name) !== suggestion.name || key(v.furColor) !== suggestion.furColor)) {
          setSuggestion(null);
        }
      }}
      onSubmit={onSubmit}
    />
  );
}

const styles = StyleSheet.create({
  notice: { borderRadius: 14, backgroundColor: '#fff6e8', borderWidth: 1, borderColor: '#f1d9b0', padding: 14, gap: 8 },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: '#5b3d12' },
  noticeBody: { fontSize: 13, color: '#6e5631', lineHeight: 18 },
  noticeActions: { flexDirection: 'row', gap: 10 },
  noticeBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RED,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeBtnText: { color: RED, fontSize: 13, fontWeight: '700' },
  noticeHint: { fontSize: 12, color: '#8a7656' },
});
