import { accountRouter } from '@/server/routers/account';
import { chatRouter } from '@/server/routers/chat';
import { router } from '@/server/trpc/core';

export const appRouter = router({
  account: accountRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
