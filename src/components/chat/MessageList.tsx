import { useEffect, useRef } from "react";
import type { Message } from "@/types/chat";
import { cn } from "@/lib/utils";

interface Props {
  messages: Message[];
  currentUserId: string;
}

const ROLE_COLOR: Record<string, string> = {
  admin: "text-neon-cyan",
  vip: "text-neon-yellow",
  member: "text-white/80",
};

const ROLE_BADGE: Record<string, string | null> = {
  admin: "ADMIN",
  vip: "VIP",
  member: null,
};

export default function MessageList({ messages, currentUserId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
        Сообщений пока нет. Будьте первым!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
      {messages.map((msg) => {
        const isMe = msg.author.id === currentUserId;
        return (
          <div key={msg.id} className={cn("flex gap-3", isMe && "flex-row-reverse")}>
            <div
              className={cn(
                "w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold",
                msg.author.role === "admin"
                  ? "bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan"
                  : msg.author.role === "vip"
                  ? "bg-neon-yellow/20 border border-neon-yellow/40 text-neon-yellow"
                  : "bg-white/10 border border-white/20 text-white/70"
              )}
            >
              {msg.author.initials}
            </div>
            <div className={cn("max-w-[70%]", isMe && "items-end flex flex-col")}>
              <div className={cn("flex items-center gap-2 mb-0.5", isMe && "flex-row-reverse")}>
                <span className={cn("text-xs font-semibold", ROLE_COLOR[msg.author.role])}>
                  {isMe ? "Вы" : msg.author.name}
                </span>
                {ROLE_BADGE[msg.author.role] && (
                  <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-white/10 text-white/40 tracking-wider">
                    {ROLE_BADGE[msg.author.role]}
                  </span>
                )}
                <span className="text-[10px] text-white/25">{msg.createdAt}</span>
              </div>
              <div
                className={cn(
                  "text-sm text-white/85 px-3 py-2 rounded-xl leading-relaxed",
                  isMe
                    ? "bg-neon-yellow/15 border border-neon-yellow/20 rounded-tr-sm"
                    : "glass-card rounded-tl-sm"
                )}
              >
                {msg.text}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}