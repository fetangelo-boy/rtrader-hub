import { Alert, Pressable, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function AccountScreen() {
  const handleLogout = () => {
    Alert.alert('Signed out', 'This is a local MVP flow. Auth integration comes next.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <Text style={styles.subtitle}>AirTrader Mobile profile and subscription controls.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Plan</Text>
        <Text style={styles.value}>VIP Club Trial</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Support</Text>
        <Text style={styles.value}>support@airtrader.app</Text>
      </View>

      <Pressable onPress={handleLogout} style={styles.button}>
        <Text style={styles.buttonText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    opacity: 0.75,
    marginBottom: 8,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  label: {
    fontSize: 12,
    opacity: 0.7,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    marginTop: 14,
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
