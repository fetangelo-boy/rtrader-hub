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

function formatDate(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

function makeInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function mapRole(role: string): User["role"] {
  if (role === "owner" || role === "admin") return "admin";
  if (role === "vip" || role === "subscriber") return "vip";
  return "member";
}

function mapMessage(raw: {
  id: number; text: string; created_at: string; nickname: string; role: string; user_id?: number;
  reply_to_id?: number | null; reply_to_nickname?: string | null; reply_to_text?: string | null;
  from_telegram?: boolean; image_url?: string | null;
}, channelId: string): Message {
  return {
    id: String(raw.id),
    channelId,
    text: raw.text,
    createdAt: formatTime(raw.created_at),
    createdDate: formatDate(raw.created_at),
    userId: raw.user_id,
    fromTelegram: !!raw.from_telegram,
    imageUrl: raw.image_url ?? null,
    replyTo: raw.reply_to_id
      ? { id: raw.reply_to_id, nickname: raw.reply_to_nickname ?? "", text: raw.reply_to_text ?? "" }
      : null,
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

  getMessages: async (channelId: string, source = "club"): Promise<Message[]> => {
    const url = source === "public"
      ? `${CHAT_URL}?action=messages&source=public&limit=60`
      : `${CHAT_URL}?action=messages&channel=${channelId}&limit=60&source=club`;
    const headers = source === "public" ? { "Content-Type": "application/json" } : authHeaders();
    const r = await fetch(url, { headers });
    if (!r.ok) return [];
    const d = await r.json();
    const msgs = (d.messages || []).map((m: Parameters<typeof mapMessage>[0]) => mapMessage(m, channelId));
    return source === "public" ? msgs.reverse() : msgs;
  },

  sendMessage: async (payload: SendMessagePayload): Promise<Message> => {
    const source = payload.source || "club";
    const url = `${CHAT_URL}?action=send&source=${source}`;
    const token = getToken();
    const headers = source === "public"
      ? { "Content-Type": "application/json", ...(token ? { "X-Auth-Token": token } : {}) }
      : authHeaders();
    const body = source === "public"
      ? { text: payload.text, nickname: payload.nickname, reply_to_id: payload.replyToId ?? null }
      : { channel: payload.channelId, text: payload.text, reply_to_id: payload.replyToId ?? null };
    const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Ошибка отправки");
    // Бэкенд возвращает актуальный ник и роль (для VIP — из аккаунта)
    const actualNickname = source === "public" ? (d.nickname || payload.nickname || "Вы") : "Вы";
    const actualRole = source === "public" ? (d.role || "member") : "member";
    const user = source === "public"
      ? { id: actualNickname, name: actualNickname, initials: makeInitials(actualNickname), role: mapRole(actualRole), isOnline: true }
      : await chatApi.getCurrentUser();
    return {
      id: `msg_${Date.now()}`,
      channelId: payload.channelId,
      text: payload.text,
      replyTo: null,
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