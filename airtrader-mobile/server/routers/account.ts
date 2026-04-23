import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc/core';

export const accountRouter = router({
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('subscriptions')
      .select('plan,status,expires_at')
      .eq('user_id', ctx.user.id)
      .maybeSingle();

    if (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }

    return {
      planName: data?.plan ?? 'Free',
      status: data?.status ?? 'inactive',
      expiresAt: data?.expires_at ?? null,
    };
  }),
  upsertSubscription: protectedProcedure
    .input(
      z.object({
        plan: z.string().min(1),
        status: z.enum(['active', 'inactive', 'trialing', 'canceled']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase.from('subscriptions').upsert(
        {
          user_id: ctx.user.id,
          plan: input.plan,
          status: input.status,
        },
        { onConflict: 'user_id' },
      );

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return { ok: true };
    }),
});
