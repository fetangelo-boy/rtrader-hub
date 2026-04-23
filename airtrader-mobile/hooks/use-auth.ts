import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getCurrentUser, getSession, signInWithEmail, signOut, signUpWithEmail } from '@/lib/supabase-auth';

export function useAuth() {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: getSession,
  });

  const userQuery = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: getCurrentUser,
    enabled: Boolean(sessionQuery.data),
  });

  const signInMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => signInWithEmail(email, password),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const signUpMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => signUpWithEmail(email, password),
  });

  const signOutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      queryClient.clear();
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  return {
    session: sessionQuery.data ?? null,
    user: userQuery.data ?? null,
    isLoading: sessionQuery.isLoading || userQuery.isLoading,
    signInWithEmail: (email: string, password: string) => signInMutation.mutateAsync({ email, password }),
    signUpWithEmail: (email: string, password: string) => signUpMutation.mutateAsync({ email, password }),
    signOut: () => signOutMutation.mutateAsync(),
  };
}
