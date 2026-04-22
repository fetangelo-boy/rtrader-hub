import { Redirect } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';

export default function IndexScreen() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!session) {
    return <Redirect href={'/auth/login' as any} />;
  }

  return <Redirect href="/(tabs)" />;
}
