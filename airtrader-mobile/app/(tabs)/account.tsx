import { Alert, Pressable, StyleSheet } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/lib/trpc';

export default function AccountScreen() {
  const { session, signOut, isLoading } = useAuth();
  const { data: subscription } = trpc.account.getSubscription.useQuery(undefined, {
    enabled: !!session,
  });

  if (!isLoading && !session) {
    return <Redirect href={"/auth/login" as any} />;
  }

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/auth/login' as any);
      router.replace('/');
    } catch (error) {
      Alert.alert('Logout failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <Text style={styles.subtitle}>AirTrader Mobile profile and subscription controls.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Plan</Text>
        <Text style={styles.value}>{subscription?.planName ?? 'Free'}</Text>
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
