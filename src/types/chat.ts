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

export interface Message {
  id: string;
  channelId: string;
  author: User;
  text: string;
  createdAt: string;
  edited?: boolean;
}

export interface SendMessagePayload {
  channelId: string;
  text: string;
}
