import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc/core';

const sendMessageInput = z.object({
  chatId: z.string().min(1),
  content: z.string().min(1).max(4000),
});

const muteInput = z.object({
  chatId: z.string().min(1),
  muted: z.boolean(),
});

export const chatRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('chats')
      .select('id, title, updated_at, chat_participants(unread_count), messages(content, created_at)')
      .order('updated_at', { ascending: false });

    if (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }

    return (data ?? []).map((chat: any) => {
      const participant = Array.isArray(chat.chat_participants) ? chat.chat_participants[0] : null;
      const lastMessage = Array.isArray(chat.messages) ? chat.messages[0] : null;
      return {
        id: chat.id,
        name: chat.title,
        unreadCount: participant?.unread_count ?? 0,
        lastMessage: lastMessage?.content ?? 'No messages yet',
        updatedAt: chat.updated_at,
      };
    });
  }),

  getMessages: protectedProcedure
    .input(z.object({ chatId: z.string().min(1), limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('messages')
        .select('id, content, created_at, profiles(display_name)')
        .eq('chat_id', input.chatId)
        .order('created_at', { ascending: false })
        .limit(input.limit);

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return (data ?? []).map((msg: any) => ({
        id: msg.id,
        message: msg.content,
        author: msg.profiles?.display_name ?? 'Member',
        createdAt: msg.created_at,
      }));
    }),

  getChatInfo: protectedProcedure
    .input(z.object({ chatId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('chats')
        .select('id, title, updated_at')
        .eq('id', input.chatId)
        .single();

      if (error) {
        throw new TRPCError({ code: 'NOT_FOUND', message: error.message });
      }

      return {
        id: data.id,
        title: data.title,
        updatedAt: data.updated_at,
      };
    }),

  sendMessage: protectedProcedure.input(sendMessageInput).mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase
      .from('messages')
      .insert({
        id: randomUUID(),
        chat_id: input.chatId,
        content: input.content,
        sender_id: ctx.user.id,
      })
      .select('id, content, created_at')
      .single();

    if (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }

    return {
      id: data.id,
      message: data.content,
      createdAt: data.created_at,
    };
  }),

  setMute: protectedProcedure.input(muteInput).mutation(async ({ ctx, input }) => {
    const { error } = await ctx.supabase.from('chat_settings').upsert(
      {
        chat_id: input.chatId,
        user_id: ctx.user.id,
        muted: input.muted,
      },
      { onConflict: 'chat_id,user_id' },
    );

    if (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }

    return { success: true };
  }),
});
