import { StyleSheet, Text, View } from 'react-native';

// Temporary navigation destination; replace with the team's real screen when ready.
export default function PlaceholderScreen() {
  return <View style={styles.container}>
    <Text style={styles.title}>Profile</Text>
    <Text style={styles.note}>This page is still being built.</Text>
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#c92e45' },
  note: { marginTop: 10, fontSize: 14, color: '#777' },
});
