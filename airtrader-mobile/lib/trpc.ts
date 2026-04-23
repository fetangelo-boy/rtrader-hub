import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

import { env } from '@/lib/env';
import { getSession } from '@/lib/supabase-auth';
import type { AppRouter } from '@/server/routers';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${env.EXPO_PUBLIC_API_URL}/api/trpc`,
      transformer: superjson,
      async headers() {
        const session = await getSession();
        if (!session?.access_token) {
          return {};
        }
        return {
          authorization: `Bearer ${session.access_token}`,
        };
      },
    }),
  ],
});
