import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { TRPCError } from '@trpc/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

import { serverEnv } from '@/server/env';

type AuthUser = {
  id: string;
  email?: string;
};

export type TrpcContext = {
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
  user: AuthUser | null;
  supabase: SupabaseClient;
};

const supabaseAdmin = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);

function createRlsClient(token?: string): SupabaseClient {
  return createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_ANON_KEY, {
    global: token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  });
}

export async function createTrpcContext({
  req,
  res,
}: CreateExpressContextOptions): Promise<TrpcContext> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { req, res, user: null, supabase: createRlsClient() };
  }

  const token = authHeader.slice('Bearer '.length);
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid auth token.' });
  }

  return {
    req,
    res,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
    supabase: createRlsClient(token),
  };
}
