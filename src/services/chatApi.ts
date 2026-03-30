/**
 * Абстрактный API-слой для чата.
 *
 * Сейчас все функции работают с мок-данными в памяти.
 * Чтобы подключить реальный backend (Supabase, собственный HTTP-сервер),
 * достаточно заменить тела функций ниже — компоненты и хуки переписывать не нужно.
 *
 * Пример замены на Supabase:
 *   getMessages: async (channelId) => {
 *     const { data } = await supabase.from('messages').select('*').eq('channel_id', channelId);
 *     return data;
 *   }
 *
 * Пример замены на собственный HTTP backend:
 *   getMessages: async (channelId) => {
 *     const res = await fetch(`${API_BASE_URL}/channels/${channelId}/messages`);
 *     return res.json();
 *   }
 */

import type { Channel, Message, SendMessagePayload, User } from "@/types/chat";
import {
  MOCK_CHANNELS,
  MOCK_CURRENT_USER,
  MOCK_MESSAGES,
} from "./mockData";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

const localMessages: Record<string, Message[]> = Object.fromEntries(
  Object.entries(MOCK_MESSAGES).map(([k, v]) => [k, [...v]])
);

const channelUnread: Record<string, number> = Object.fromEntries(
  MOCK_CHANNELS.map((c) => [c.id, c.unreadCount])
);

export const chatApi = {
  getCurrentUser: async (): Promise<User> => {
    await delay(100);
    return MOCK_CURRENT_USER;
  },

  getChannels: async (): Promise<Channel[]> => {
    await delay(150);
    return MOCK_CHANNELS.map((c) => ({
      ...c,
      unreadCount: channelUnread[c.id] ?? 0,
    }));
  },

  getMessages: async (channelId: string): Promise<Message[]> => {
    await delay(200);
    return localMessages[channelId] ?? [];
  },

  sendMessage: async (payload: SendMessagePayload): Promise<Message> => {
    await delay(150);
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      channelId: payload.channelId,
      author: MOCK_CURRENT_USER,
      text: payload.text,
      createdAt: new Date().toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    if (!localMessages[payload.channelId]) {
      localMessages[payload.channelId] = [];
    }
    localMessages[payload.channelId].push(newMsg);
    return newMsg;
  },

  markAsRead: async (channelId: string): Promise<void> => {
    await delay(50);
    channelUnread[channelId] = 0;
  },
};
