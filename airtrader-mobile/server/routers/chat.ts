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
    const { data: participationRows, error: participationError } = await ctx.supabase
      .from('chat_participants')
      .select('chat_id, unread_count, chats(id, title, updated_at)')
      .eq('user_id', ctx.user.id)
      .order('updated_at', { ascending: false, referencedTable: 'chats' });

    if (participationError) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: participationError.message });
    }

    const rows = (participationRows ?? []).map((row: any) => {
      const linkedChat = Array.isArray(row.chats) ? row.chats[0] : row.chats;
      return {
        chat_id: row.chat_id as string,
        unread_count: (row.unread_count as number | null) ?? 0,
        chats: linkedChat
          ? {
              id: linkedChat.id as string,
              title: linkedChat.title as string,
              updated_at: (linkedChat.updated_at as string | null) ?? null,
            }
          : null,
      };
    });

    const mapped = await Promise.all(
      rows.map(async (row) => {
        if (!row.chats) {
          return null;
        }

        const { data: latestMessage, error: latestMessageError } = await ctx.supabase
          .from('messages')
          .select('content, created_at')
          .eq('chat_id', row.chat_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestMessageError) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: latestMessageError.message });
        }

        const updatedAt = latestMessage?.created_at ?? row.chats.updated_at ?? new Date(0).toISOString();

        return {
          id: row.chats.id,
          name: row.chats.title,
          unreadCount: row.unread_count ?? 0,
          lastMessage: latestMessage?.content ?? 'No messages yet',
          updatedAt,
        };
      }),
    );

    return mapped
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((chat) => {
      return {
        id: chat.id,
        name: chat.name,
        unreadCount: chat.unreadCount,
        lastMessage: chat.lastMessage,
        updatedAt: chat.updatedAt,
      };
    });
  }),

  getMessages: protectedProcedure
    .input(z.object({ chatId: z.string().min(1), limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('messages')
        .select('id, content, created_at, sender_id, profiles!messages_sender_id_fkey(display_name)')
        .eq('chat_id', input.chatId)
        .order('created_at', { ascending: false })
        .limit(input.limit);

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return (data ?? []).map((msg: any) => {
        const authorProfile = Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles;
        return {
          id: msg.id,
          message: msg.content,
          author: authorProfile?.display_name ?? 'Member',
          createdAt: msg.created_at,
          senderId: msg.sender_id ?? null,
        };
      });
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
