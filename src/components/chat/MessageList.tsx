import { useEffect, useRef, useState } from "react";
import type { Message, ReplyTo } from "@/types/chat";
import { cn } from "@/lib/utils";
import Icon from "@/components/ui/icon";

interface Props {
  messages: Message[];
  currentUserId: string;
  isAdmin?: boolean;
  onDelete?: (messageId: string) => void;
  onReply?: (replyTo: ReplyTo) => void;
}

const ROLE_COLOR: Record<string, string> = {
  admin: "text-neon-cyan",
  vip: "text-neon-yellow",
  member: "text-white",
};

const ROLE_BADGE: Record<string, string | null> = {
  admin: "ADMIN",
  vip: "VIP",
  member: null,
};

export default function MessageList({ messages, currentUserId, isAdmin, onDelete, onReply }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
    const isNewMessage = messages.length > prevCountRef.current;

    if (isNewMessage && isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    if (prevCountRef.current === 0 && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }

    prevCountRef.current = messages.length;
  }, [messages.length]);

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
        Сообщений пока нет. Будьте первым!
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3">
      {messages.map((msg) => {
        const isMe = msg.author.id === currentUserId;
        const canDelete = isAdmin || isMe;

        return (
          <div
            key={msg.id}
            className={cn("flex gap-3 py-1.5", isMe && "flex-row-reverse")}
            onMouseEnter={() => setHoveredId(msg.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div
              className={cn(
                "w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold mt-0.5",
                msg.author.role === "admin"
                  ? "bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan"
                  : "bg-white/10 border border-white/20 text-white/70"
              )}
            >
              {msg.author.initials}
            </div>

            <div className={cn("max-w-[72%]", isMe && "items-end flex flex-col")}>
              <div className={cn("flex items-center gap-2 mb-1", isMe && "flex-row-reverse")}>
                <span className={cn("text-sm font-bold tracking-wide", ROLE_COLOR[msg.author.role])}>
                  {isMe ? "Вы" : msg.author.name}
                </span>
                {ROLE_BADGE[msg.author.role] && (
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider",
                    msg.author.role === "admin"
                      ? "bg-neon-cyan/15 text-neon-cyan"
                      : "bg-neon-yellow/15 text-neon-yellow"
                  )}>
                    {ROLE_BADGE[msg.author.role]}
                  </span>
                )}
                <span className="text-[11px] text-white/30">{msg.createdAt}</span>
              </div>

              <div className={cn("flex items-end gap-1.5", isMe && "flex-row-reverse")}>
                <div
                  className={cn(
                    "text-sm text-white/90 px-3 py-2 rounded-xl leading-relaxed break-words",
                    isMe
                      ? "bg-neon-yellow/15 border border-neon-yellow/20 rounded-tr-sm"
                      : "bg-white/5 border border-white/10 rounded-tl-sm"
                  )}
                >
                  {msg.replyTo && (
                    <div className="flex gap-2 mb-2 px-2 py-1.5 rounded-lg bg-black/20">
                      <div className="w-0.5 bg-neon-yellow/50 rounded-full shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-neon-yellow/80 font-semibold mb-0.5">{msg.replyTo.nickname}</p>
                        <p className="text-xs text-white/40 truncate">{msg.replyTo.text}</p>
                      </div>
                    </div>
                  )}
                  {msg.text}
                </div>

                <div className={cn(
                  "flex gap-1 shrink-0 mb-1 transition-opacity duration-100",
                  isMe && "flex-row-reverse",
                  hoveredId === msg.id ? "opacity-100" : "opacity-0 pointer-events-none"
                )}>
                  {onReply && (
                    <button
                      onClick={() => onReply({ id: Number(msg.id), nickname: msg.author.name, text: msg.text })}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-white/40 hover:text-neon-yellow hover:bg-neon-yellow/10 transition-all"
                      title="Ответить"
                    >
                      <Icon name="Reply" size={12} />
                    </button>
                  )}
                  {canDelete && onDelete && (
                    <button
                      onClick={() => onDelete(msg.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Удалить"
                    >
                      <Icon name="Trash2" size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}