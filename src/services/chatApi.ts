import type { Channel, Message, SendMessagePayload, User } from "@/types/chat";
import func2url from "../../backend/func2url.json";

const CHAT_URL = (func2url as Record<string, string>).chat;

function getToken(): string {
  return localStorage.getItem("auth_token") || "";
}

function authHeaders() {
  return { "X-Auth-Token": getToken(), "Content-Type": "application/json" };
}

const CHANNELS_META: Omit<Channel, "unreadCount" | "lastMessage" | "lastMessageAt">[] = [
  { id: "chat",     name: "общий-чат",          description: "Общие обсуждения рынка",       icon: "Hash",       category: "general" },
  { id: "intraday", name: "интрадей-идеи",       description: "Внутридневные торговые идеи",  icon: "TrendingUp", category: "trading" },
  { id: "metals",   name: "металлы",             description: "Золото, серебро, платина",      icon: "Gem",        category: "trading" },
  { id: "oil",      name: "газ-и-нефть",         description: "Газ, нефть, энергоносители",   icon: "Flame",      category: "trading" },
  { id: "products", name: "акции-и-фонда",       description: "Акции и фондовый рынок",       icon: "BarChart2",  category: "trading" },
  { id: "tech",     name: "техподдержка",         description: "Технические вопросы",          icon: "Wrench",     category: "general" },
  { id: "video",       name: "видео",            description: "Обучающие видео",              icon: "Play",       category: "general" },
  { id: "knowledge",   name: "база-знаний",      description: "Полезные материалы",           icon: "BookOpen",   category: "general" },
  { id: "access_info", name: "инфо-о-доступе",  description: "Информация о подписке",        icon: "Info",       category: "general" },
];

function formatTime(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function makeInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function mapRole(role: string): User["role"] {
  if (role === "owner" || role === "admin") return "admin";
  return "member";
}

function mapMessage(raw: { id: number; text: string; created_at: string; nickname: string; role: string; user_id?: number }, channelId: string): Message {
  return {
    id: String(raw.id),
    channelId,
    text: raw.text,
    createdAt: formatTime(raw.created_at),
    userId: raw.user_id,
    author: {
      id: raw.nickname,
      name: raw.nickname,
      initials: makeInitials(raw.nickname),
      role: mapRole(raw.role),
      isOnline: false,
    },
  };
}

export const chatApi = {
  getCurrentUser: async (): Promise<User> => {
    const token = getToken();
    if (!token) return { id: "guest", name: "Гость", initials: "ГС", role: "member", isOnline: false };
    const r = await fetch(`${(func2url as Record<string, string>).auth}?action=me`, {
      headers: { "X-Auth-Token": token },
    });
    const d = await r.json();
    if (!d.user) return { id: "guest", name: "Гость", initials: "ГС", role: "member", isOnline: false };
    return {
      id: String(d.user.id),
      name: d.user.nickname,
      initials: makeInitials(d.user.nickname),
      role: mapRole(d.user.role),
      isOnline: true,
    };
  },

  getChannels: async (): Promise<Channel[]> => {
    return CHANNELS_META.map(ch => ({ ...ch, unreadCount: 0 }));
  },

  getMessages: async (channelId: string): Promise<Message[]> => {
    const r = await fetch(`${CHAT_URL}?action=messages&channel=${channelId}&limit=60`, {
      headers: authHeaders(),
    });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.messages || []).map((m: Parameters<typeof mapMessage>[0]) => mapMessage(m, channelId));
  },

  sendMessage: async (payload: SendMessagePayload): Promise<Message> => {
    const r = await fetch(`${CHAT_URL}?action=send`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ channel: payload.channelId, text: payload.text }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Ошибка отправки");
    const user = await chatApi.getCurrentUser();
    return {
      id: `msg_${Date.now()}`,
      channelId: payload.channelId,
      text: payload.text,
      createdAt: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      author: user,
    };
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    const r = await fetch(`${CHAT_URL}?action=delete`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ message_id: Number(messageId) }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Ошибка удаления");
  },

  markAsRead: async (_channelId: string): Promise<void> => {
    // unread tracking на backend не реализован, просто игнорируем
  },
};