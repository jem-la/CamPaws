import { type Href, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RED } from '@/components/dog-profile-card';
import { Field, PrimaryButton } from '@/components/form-field';
import { changePassword, deleteAccount, logOut, updateProfile, useUser } from '@/lib/auth-store';
import { showAlert } from '@/lib/confirm';
import { refreshDogs, useDogsState } from '@/lib/dogs-store';

const LINKS: { label: string; href: Href }[] = [
  { label: 'My Dogs', href: '/profile/my-dogs' },
  { label: 'Add a dog', href: '/explore/new' },
  { label: 'Search dogs', href: '/explore' },
  { label: 'Leaderboard', href: '/profile/leaderboard' },
];

type Panel = 'none' | 'edit' | 'password' | 'delete';

export default function ProfileScreen() {
  const user = useUser();
  const { dogs } = useDogsState();
  const [panel, setPanel] = useState<Panel>('none');
  const mine = useMemo(() => dogs.filter((d) => d.ownerId === user.userId), [dogs, user.userId]);
  const likesReceived = mine.reduce((sum, d) => sum + d.likes, 0);
  const initials = user.displayName
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useFocusEffect(
    useCallback(() => {
      refreshDogs();
    }, []),
  );

  const stats = [
    { label: 'Dogs added', value: mine.length },
    { label: 'Likes received', value: likesReceived },
    { label: 'Campus dogs', value: dogs.length },
  ];

  const confirmLogout = () =>
    showAlert('Log out?', 'You can log back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void logOut() },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name} accessibilityRole="header">
          {user.displayName}
        </Text>
        <Text style={styles.subtitle}>{user.email}</Text>

        <View style={styles.stats}>
          {stats.map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.links}>
          {LINKS.map((l) => (
            <Row key={l.label} label={l.label} onPress={() => router.push(l.href)} />
          ))}
        </View>

        <Text style={styles.section}>Account</Text>
        <View style={styles.links}>
          <Row label="Edit profile" onPress={() => setPanel(panel === 'edit' ? 'none' : 'edit')} />
          {panel === 'edit' && <EditPanel onDone={() => setPanel('none')} />}
          <Row label="Change password" onPress={() => setPanel(panel === 'password' ? 'none' : 'password')} />
          {panel === 'password' && <PasswordPanel onDone={() => setPanel('none')} />}
          <Row label="Log out" onPress={confirmLogout} />
          <Row label="Delete account" danger onPress={() => setPanel(panel === 'delete' ? 'none' : 'delete')} />
          {panel === 'delete' && <DeletePanel />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
      onPress={onPress}>
      <Text style={[styles.linkText, danger && styles.dangerText]}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function usePanel(action: () => Promise<string | void>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [ok, setOk] = useState<string | undefined>();
  const run = async () => {
    setBusy(true);
    setError(undefined);
    setOk(undefined);
    try {
      const msg = await action();
      if (msg) setOk(msg);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, ok, run };
}

function EditPanel({ onDone }: { onDone: () => void }) {
  const user = useUser();
  const [name, setName] = useState(user.displayName);
  const [email, setEmail] = useState(user.email);
  const { busy, error, run } = usePanel(async () => {
    await updateProfile({ displayName: name, email });
    onDone();
  });
  return (
    <View style={styles.panel}>
      <Field label="Name" value={name} onChangeText={setName} />
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton label="Save" onPress={run} busy={busy} />
    </View>
  );
}

function PasswordPanel({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const { busy, error, run } = usePanel(async () => {
    await changePassword(current, next);
    showAlert('Password changed', 'Your password has been updated.');
    onDone();
  });
  return (
    <View style={styles.panel}>
      <Field label="Current password" value={current} onChangeText={setCurrent} secureTextEntry />
      <Field label="New password (8+ characters)" value={next} onChangeText={setNext} secureTextEntry />
      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton label="Change password" onPress={run} busy={busy} />
    </View>
  );
}

function DeletePanel() {
  const [password, setPassword] = useState('');
  const { busy, error, run } = usePanel(() => deleteAccount(password));
  const confirm = () =>
    showAlert('Delete your account?', 'This permanently removes your account and likes. Dogs you added stay on CamPaws.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void run() },
    ]);
  return (
    <View style={styles.panel}>
      <Text style={styles.warn}>Enter your password to confirm. This can’t be undone.</Text>
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton label="Delete my account" tone="danger" onPress={confirm} busy={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 32, maxWidth: 480, width: '100%', alignSelf: 'center', alignItems: 'center' },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#fff0f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: RED },
  name: { fontSize: 24, fontWeight: '800', color: '#28242b', marginTop: 12 },
  subtitle: { fontSize: 13, color: '#888188', marginTop: 4 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' },
  stat: { flex: 1, borderWidth: 1, borderColor: '#eee7e8', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: RED },
  statLabel: { fontSize: 11, color: '#8f858b', marginTop: 4 },
  links: { width: '100%', marginTop: 22, borderWidth: 1, borderColor: '#eee7e8', borderRadius: 14, overflow: 'hidden' },
  section: { alignSelf: 'flex-start', marginTop: 24, fontSize: 12, fontWeight: '700', color: '#8f858b' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#f3eef0',
  },
  linkText: { fontSize: 15, color: '#2d272d', fontWeight: '600' },
  dangerText: { color: '#a4182c' },
  chevron: { fontSize: 22, color: RED },
  pressed: { backgroundColor: '#fcf7f8' },
  panel: { padding: 16, backgroundColor: '#fcf9fa', borderBottomWidth: 1, borderBottomColor: '#f3eef0' },
  error: { color: '#b3182d', fontSize: 13, marginBottom: 12 },
  warn: { fontSize: 13, color: '#6f666d', marginBottom: 12 },
});
