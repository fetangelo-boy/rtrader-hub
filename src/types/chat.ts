export interface User {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
  role: "admin" | "vip" | "member";
  isOnline: boolean;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  icon: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageAt?: string;
  category: "trading" | "general" | "vip";
}

export interface ReplyTo {
  id: number;
  nickname: string;
  text: string;
}

export interface Message {
  id: string;
  channelId: string;
  author: User;
  text: string;
  createdAt: string;
  edited?: boolean;
  userId?: number;
  replyTo?: ReplyTo | null;
}

export interface SendMessagePayload {
  channelId: string;
  text: string;
  replyToId?: number | null;
}
