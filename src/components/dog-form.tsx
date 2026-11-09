import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { showAlert } from '@/lib/confirm';
import {
  CAMPUS_VISITS,
  type Dog,
  type DogInput,
  furSwatches,
  PETTING_LABELS,
  type PettingPolicy,
  TEMPERAMENTS,
  validateDog,
} from '@/lib/dogs-store';

export const RED = '#c92e45';
const MAX_PHOTOS = 5;

type DogFormProps = {
  initial?: DogInput;
  submitLabel: string;
  /** Shown above the submit button, e.g. a duplicate warning. */
  notice?: React.ReactNode;
  onChange?: (value: DogInput) => void;
  onSubmit: (value: DogInput) => void | Promise<void>;
};

export const EMPTY_DOG: DogInput = { name: '', photos: [], petting: 'ask' };

export function toDogInput(dog: Dog): DogInput {
  const { name, photos, furColor, temperament, petting, campusVisits, location, about } = dog;
  return { name, photos, furColor, temperament, petting, campusVisits, location, about };
}

export function DogForm({ initial = EMPTY_DOG, submitLabel, notice, onChange, onSubmit }: DogFormProps) {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState<DogInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [openSelect, setOpenSelect] = useState<'temperament' | 'visits' | null>(null);

  const set = <K extends keyof DogInput>(key: K, v: DogInput[K]) => {
    const next = { ...value, [key]: v };
    setValue(next);
    onChange?.(next);
    if (error) setError(null);
  };

  const addPhotos = async (source: 'camera' | 'library') => {
    const remaining = MAX_PHOTOS - value.photos.length;
    if (remaining <= 0) return;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        showAlert('Camera access needed', 'Allow camera access in Settings to take a photo of the dog.');
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: source === 'library' && remaining > 1,
      selectionLimit: remaining,
    };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    const uris = result.assets.map((a) => a.uri);
    set('photos', [...value.photos, ...uris].slice(0, MAX_PHOTOS));
  };

  const pickPhoto = () => {
    if (value.photos.length >= MAX_PHOTOS) {
      showAlert('Photo limit reached', `You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    if (Platform.OS === 'web') {
      addPhotos('library');
      return;
    }
    showAlert('Add a dog photo', undefined, [
      { text: 'Take photo', onPress: () => addPhotos('camera') },
      { text: 'Choose from library', onPress: () => addPhotos('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removePhoto = (index: number) => set('photos', value.photos.filter((_, i) => i !== index));

  const submit = async () => {
    const problem = validateDog(value);
    if (problem) {
      setError(problem);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const cover = value.photos[0];
  const photoMissing = error !== null && value.photos.length === 0;
  const nameMissing = error !== null && !value.name.trim();
  const swatches = furSwatches(value.furColor);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={pickPhoto}
          accessibilityRole="button"
          accessibilityLabel={cover ? 'Add another photo' : 'Add a dog photo'}
          style={({ pressed }) => [styles.photoCard, photoMissing && styles.photoCardError, pressed && styles.pressed]}>
          <View style={styles.photoThumb}>
            {cover && <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" />}
          </View>
          <View style={styles.flex}>
            <Text style={styles.photoTitle}>
              {cover ? `${value.name.trim() || 'Dog'}'s photo${value.photos.length > 1 ? 's' : ''}` : 'Add a dog photo'}
            </Text>
            <Text style={styles.photoSub}>
              {cover ? `${value.photos.length} of ${MAX_PHOTOS} · tap to add more` : 'Take a photo or upload *'}
            </Text>
          </View>
          <SymbolView
            name={{ ios: 'camera', android: 'photo_camera', web: 'photo_camera' }}
            tintColor={RED}
            size={22}
          />
        </Pressable>

        {value.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
            {value.photos.map((uri, i) => (
              <View key={`${i}-${uri}`} style={styles.thumb}>
                <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                {i === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>Profile</Text>
                  </View>
                )}
                <Pressable
                  hitSlop={8}
                  onPress={() => removePhoto(i)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove photo ${i + 1}`}
                  style={styles.removeBtn}>
                  <Text style={styles.removeText}>×</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        <Field label="Dog name *">
          <TextInput
            style={[styles.input, nameMissing && styles.inputError]}
            value={value.name}
            onChangeText={(t) => set('name', t)}
            placeholder="e.g. Mochi"
            placeholderTextColor="#a29ca1"
            maxLength={80}
            autoCapitalize="words"
            returnKeyType="next"
            accessibilityLabel="Dog name"
          />
        </Field>

        <Field label="Fur color">
          <View style={[styles.input, styles.row]}>
            <TextInput
              style={styles.innerInput}
              value={value.furColor ?? ''}
              onChangeText={(t) => set('furColor', t)}
              placeholder="e.g. Tan and white"
              placeholderTextColor="#a29ca1"
              maxLength={120}
              accessibilityLabel="Fur color"
            />
            <View style={styles.swatches}>
              {(swatches.length ? swatches : ['#c58c59', '#f6efe6']).map((c) => (
                <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
              ))}
            </View>
          </View>
        </Field>

        <Field label="Temperament">
          <Select
            value={value.temperament}
            placeholder="Choose a temperament"
            options={TEMPERAMENTS}
            open={openSelect === 'temperament'}
            onToggle={() => setOpenSelect((o) => (o === 'temperament' ? null : 'temperament'))}
            onChange={(v) => {
              set('temperament', v);
              setOpenSelect(null);
            }}
          />
        </Field>

        <Field label="Can people pet this dog?">
          <View style={styles.chips}>
            {(Object.keys(PETTING_LABELS) as PettingPolicy[]).map((p) => {
              const selected = value.petting === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => set('petting', p)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[styles.chip, selected && styles.chipSelected]}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{PETTING_LABELS[p]}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Campus visits">
          <Select
            value={value.campusVisits}
            placeholder="How often is this dog around?"
            options={CAMPUS_VISITS}
            open={openSelect === 'visits'}
            onToggle={() => setOpenSelect((o) => (o === 'visits' ? null : 'visits'))}
            onChange={(v) => {
              set('campusVisits', v);
              setOpenSelect(null);
            }}
          />
        </Field>

        <Field label="Usually seen near">
          <TextInput
            style={styles.input}
            value={value.location ?? ''}
            onChangeText={(t) => set('location', t)}
            placeholder="e.g. Library lawn"
            placeholderTextColor="#a29ca1"
            maxLength={120}
            accessibilityLabel="Usually seen near"
          />
        </Field>

        <Field label="About">
          <TextInput
            style={[styles.input, styles.multiline]}
            value={value.about ?? ''}
            onChangeText={(t) => set('about', t)}
            placeholder="Anything people should know?"
            placeholderTextColor="#a29ca1"
            maxLength={120}
            multiline
            accessibilityLabel="About this dog"
          />
        </Field>

        {notice}

        {error && (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        )}

        <Pressable
          onPress={submit}
          disabled={submitting}
          accessibilityRole="button"
          style={({ pressed }) => [styles.submit, (pressed || submitting) && styles.pressed]}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{submitLabel}</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

type SelectProps = {
  value?: string;
  placeholder: string;
  options: string[];
  open: boolean;
  onToggle: () => void;
  onChange: (value: string | undefined) => void;
};

function Select({ value, placeholder, options, open, onToggle, onChange }: SelectProps) {
  return (
    <View>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={[styles.input, styles.row]}>
        <Text style={[styles.selectText, !value && styles.placeholder]}>{value ?? placeholder}</Text>
        <SymbolView
          name={{
            ios: open ? 'chevron.down' : 'chevron.right',
            android: open ? 'expand_more' : 'chevron_right',
            web: open ? 'expand_more' : 'chevron_right',
          }}
          tintColor="#6f686e"
          size={16}
        />
      </Pressable>
      {open && (
        <View style={styles.options}>
          {options.map((o) => (
            <Pressable
              key={o}
              onPress={() => onChange(o === value ? undefined : o)}
              accessibilityRole="radio"
              accessibilityState={{ selected: o === value }}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
              <Text style={[styles.optionText, o === value && styles.optionSelected]}>{o}</Text>
              {o === value && <Text style={styles.optionSelected}>✓</Text>}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, gap: 18, maxWidth: 480, width: '100%', alignSelf: 'center' },
  pressed: { opacity: 0.7 },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#fff0f1',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  photoCardError: { borderColor: RED },
  photoThumb: {
    width: 84,
    height: 84,
    borderRadius: 10,
    backgroundColor: '#f7e6da',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoTitle: { fontSize: 16, fontWeight: '700', color: '#28242b' },
  photoSub: { fontSize: 12, color: '#7d757b', marginTop: 4 },
  thumbRow: { gap: 8, marginTop: -6 },
  thumb: { width: 64, height: 64, borderRadius: 10, overflow: 'hidden', backgroundColor: '#f3eeee' },
  coverBadge: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    backgroundColor: 'rgba(201,46,69,0.9)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  coverBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  removeBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#fff', fontSize: 14, lineHeight: 16, fontWeight: '700' },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#28242b' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#e8e1e3',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#28242b',
    backgroundColor: '#fff',
  },
  inputError: { borderColor: RED },
  multiline: { minHeight: 84, paddingTop: 12, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  innerInput: { flex: 1, fontSize: 14, color: '#28242b', minHeight: 46 },
  swatches: { flexDirection: 'row', gap: 4, marginLeft: 8 },
  swatch: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#e2d8d4' },
  selectText: { fontSize: 14, color: '#28242b' },
  placeholder: { color: '#a29ca1' },
  options: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e8e1e3',
    borderRadius: 12,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  optionPressed: { backgroundColor: '#fbf4f5' },
  optionText: { fontSize: 14, color: '#28242b' },
  optionSelected: { color: RED, fontWeight: '700' },
  chips: { flexDirection: 'row', gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e8e1e3',
    backgroundColor: '#f7f4f5',
  },
  chipSelected: { borderColor: RED, backgroundColor: '#fff0f1' },
  chipText: { fontSize: 13, color: '#5d565c' },
  chipTextSelected: { color: RED, fontWeight: '700' },
  error: { color: RED, fontSize: 13, fontWeight: '600' },
  submit: {
    height: 50,
    borderRadius: 14,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
