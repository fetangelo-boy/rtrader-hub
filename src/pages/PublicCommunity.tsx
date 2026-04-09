import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/services/chatApi";
import type { ReplyTo } from "@/types/chat";
import { cn } from "@/lib/utils";

const NICKNAME_KEY = "public_chat_nickname";

export default function PublicCommunity() {
  const [nickname, setNickname] = useState(() => localStorage.getItem(NICKNAME_KEY) || "");
  const [nickInput, setNickInput] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["public-messages"],
    queryFn: () => chatApi.getMessages("chat", "public"),
    staleTime: 0,
    refetchInterval: 5000,
  });

  const sendMessage = useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: (msg) => {
      queryClient.setQueryData(["public-messages"], (prev: typeof messages) =>
        prev ? [...prev, msg] : [msg]
      );
    },
  });

  const handleSetNickname = () => {
    const n = nickInput.trim();
    if (!n) return;
    localStorage.setItem(NICKNAME_KEY, n);
    setNickname(n);
  };

  const handleSend = (text: string, replyToId?: number | null) => {
    sendMessage.mutate({ channelId: "chat", text, source: "public", nickname, replyToId });
    setReplyTo(null);
  };

  if (!nickname) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-white flex flex-col">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm glass-card rounded-2xl p-8 border border-white/10 flex flex-col gap-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-neon-yellow/10 border border-neon-yellow/20 flex items-center justify-center mx-auto mb-3">
                <Icon name="MessageSquare" size={24} className="text-neon-yellow" />
              </div>
              <h2 className="text-lg font-russo tracking-wider mb-1">Представьтесь</h2>
              <p className="text-white/40 text-sm">Введите никнейм чтобы участвовать в чате</p>
            </div>
            <input
              value={nickInput}
              onChange={(e) => setNickInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetNickname()}
              placeholder="Ваш никнейм..."
              maxLength={32}
              autoFocus
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-neon-yellow/40 transition-colors"
            />
            <button
              onClick={handleSetNickname}
              disabled={!nickInput.trim()}
              className={cn(
                "py-3 rounded-xl font-semibold text-sm transition-all",
                nickInput.trim() ? "bg-neon-yellow text-black hover:opacity-90" : "bg-white/5 text-white/20 cursor-not-allowed"
              )}
            >
              Войти в чат
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[hsl(var(--background))] text-white" style={{ height: "100dvh" }}>
      <PublicHeader nickname={nickname} onRename={() => { localStorage.removeItem(NICKNAME_KEY); setNickname(""); setNickInput(""); }} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-10 shrink-0 flex items-center gap-2 px-4 border-b border-white/5 bg-black/10">
          <Icon name="Hash" size={14} className="text-white/40" />
          <span className="text-sm font-medium">общий-чат</span>
          <span className="text-white/30 text-xs">— Общие обсуждения</span>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-white/30 text-sm">Загрузка...</div>
        ) : (
          <MessageList
            messages={messages}
            currentUserId={nickname}
            onReply={(r) => setReplyTo(r)}
          />
        )}

        <MessageInput
          channelName="общий-чат"
          onSend={handleSend}
          disabled={sendMessage.isPending}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </div>
  );
}

function PublicHeader({ nickname, onRename }: { nickname?: string; onRename?: () => void }) {
  return (
    <header className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-white/5 bg-black/30 backdrop-blur-sm">
      <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
        <Icon name="ArrowLeft" size={16} />
        <span className="text-sm hidden sm:block">На главную</span>
      </Link>
      <div className="w-px h-5 bg-white/10" />
      <span className="font-russo text-base tracking-wider text-neon-yellow">RTrader</span>
      <span className="text-white/30 text-sm">Комьюнити</span>
      {nickname && (
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-white/40">{nickname}</span>
          <button
            onClick={onRename}
            className="text-xs text-white/30 hover:text-white/70 transition-colors underline underline-offset-2"
          >
            сменить
          </button>
        </div>
      )}
    </header>
  );
}
