import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

export const RED = '#c92e45';

type FieldProps = TextInputProps & { label: string };

export function Field({ label, style, ...props }: FieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#a39da2"
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  busy,
  tone = 'primary',
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  tone?: 'primary' | 'danger';
}) {
  return (
    <Text
      accessibilityRole="button"
      accessibilityState={{ disabled: !!busy }}
      onPress={busy ? undefined : onPress}
      style={[styles.button, tone === 'danger' && styles.danger, busy && styles.busy]}>
      {busy ? 'Please wait…' : label}
    </Text>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: '#6f666d', marginBottom: 6 },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#e7dfe1',
    backgroundColor: '#fcfafb',
    borderRadius: 12,
    paddingHorizontal: 13,
    fontSize: 15,
    color: '#28242b',
  },
  button: {
    backgroundColor: RED,
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    height: 48,
    lineHeight: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  danger: { backgroundColor: '#a4182c' },
  busy: { opacity: 0.6 },
});
