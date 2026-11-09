import { router, Stack, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { DogForm, toDogInput } from '@/components/dog-form';
import { showAlert } from '@/lib/confirm';
import { type DogInput, updateDog, useDog } from '@/lib/dogs-store';

export default function EditDogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dog, error } = useDog(id);
  const [dirty, setDirty] = useState(false);

  const disablePrevention = usePreventRemove(dirty, ({ repeat }) => {
    showAlert('Discard changes?', 'Your edits won’t be saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: repeat },
    ]);
  });

  if (!dog) {
    return (
      <View style={styles.missing}>
        {error ? <Text style={styles.missingText}>{error}</Text> : <ActivityIndicator color="#c92e45" />}
      </View>
    );
  }

  const onSubmit = async (value: DogInput) => {
    await updateDog(dog.id, value);
    disablePrevention();
    setDirty(false);
    // Back to the profile if it's under us in the stack; otherwise replace this screen with it.
    router.dismissTo({ pathname: '/explore/[id]', params: { id: dog.id } });
  };

  return (
    <>
      <Stack.Screen options={{ title: `Edit ${dog.name}` }} />
      <DogForm
        initial={toDogInput(dog)}
        submitLabel="Save changes"
        onChange={() => setDirty(true)}
        onSubmit={onSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  missingText: { fontSize: 15, color: '#7d757b' },
});
