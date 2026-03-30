import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import ChannelList from "@/components/chat/ChannelList";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import { useChannels, useMessages, useSendMessage, useMarkAsRead, useCurrentUser } from "@/hooks/useChat";
import type { Channel } from "@/types/chat";
import { cn } from "@/lib/utils";
import { MOCK_USERS } from "@/services/mockData";

export default function Community() {
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: currentUser } = useCurrentUser();
  const { data: channels = [], isLoading: channelsLoading } = useChannels();
  const { data: messages = [], isLoading: messagesLoading } = useMessages(activeChannel?.id ?? null);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();

  const handleSelectChannel = (ch: Channel) => {
    setActiveChannel(ch);
    setSidebarOpen(false);
    markAsRead.mutate(ch.id);
  };

  const handleSend = (text: string) => {
    if (!activeChannel) return;
    sendMessage.mutate({ channelId: activeChannel.id, text });
  };

  const onlineCount = MOCK_USERS.filter((u) => u.isOnline).length;

  return (
    <div className="h-screen flex flex-col bg-[hsl(var(--background))] text-white overflow-hidden">
      {/* Top bar */}
      <header className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-white/5 bg-black/30 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <Icon name="ArrowLeft" size={16} />
          <span className="text-sm hidden sm:block">На главную</span>
        </Link>
        <div className="w-px h-5 bg-white/10" />
        <span className="font-russo text-base tracking-wider text-neon-yellow">RTrader</span>
        <span className="text-white/30 text-sm font-medium">Комьюнити</span>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            {onlineCount} онлайн
          </div>
          <button
            className="lg:hidden text-white/50 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Icon name="Menu" size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Channels sidebar */}
        <aside
          className={cn(
            "w-60 shrink-0 border-r border-white/5 bg-black/20 flex flex-col",
            "lg:relative lg:translate-x-0 lg:z-auto",
            "fixed inset-y-0 left-0 z-30 top-14 transition-transform duration-200",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-xs text-white/30 font-medium uppercase tracking-widest">Каналы</p>
          </div>
          {channelsLoading ? (
            <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
              Загрузка...
            </div>
          ) : (
            <ChannelList
              channels={channels}
              activeId={activeChannel?.id ?? null}
              onSelect={handleSelectChannel}
            />
          )}

          {/* Online members */}
          <div className="border-t border-white/5 p-3">
            <p className="text-xs text-white/25 uppercase tracking-widest mb-2">Участники онлайн</p>
            <div className="space-y-1">
              {MOCK_USERS.filter((u) => u.isOnline).map((u) => (
                <div key={u.id} className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/60">
                      {u.initials}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border border-black" />
                  </div>
                  <span className={cn(
                    "text-xs truncate",
                    u.role === "admin" ? "text-neon-cyan" : u.role === "vip" ? "text-neon-yellow" : "text-white/50"
                  )}>
                    {u.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main chat area */}
        <main className="flex-1 flex flex-col min-w-0">
          {activeChannel ? (
            <>
              {/* Channel header */}
              <div className="h-12 shrink-0 flex items-center gap-2 px-4 border-b border-white/5 bg-black/10">
                <Icon name={activeChannel.icon as never} size={16} className="text-white/40" />
                <span className="font-medium text-sm">#{activeChannel.name}</span>
                <span className="text-white/30 text-xs hidden sm:block">— {activeChannel.description}</span>
              </div>

              {messagesLoading ? (
                <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
                  Загрузка сообщений...
                </div>
              ) : (
                <MessageList
                  messages={messages}
                  currentUserId={currentUser?.id ?? "me"}
                />
              )}

              <MessageInput
                channelName={activeChannel.name}
                onSend={handleSend}
                disabled={sendMessage.isPending}
              />
            </>
          ) : (
            <WelcomeScreen onSelectFirst={() => channels[0] && handleSelectChannel(channels[0])} />
          )}
        </main>
      </div>
    </div>
  );
}

function WelcomeScreen({ onSelectFirst }: { onSelectFirst: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-neon-yellow/10 border border-neon-yellow/20 flex items-center justify-center">
        <Icon name="MessageSquare" size={32} className="text-neon-yellow" />
      </div>
      <div>
        <h2 className="text-xl font-russo tracking-wider mb-2">Добро пожаловать в Комьюнити</h2>
        <p className="text-white/40 text-sm max-w-sm">
          Выберите канал слева, чтобы присоединиться к обсуждению трейдеров
        </p>
      </div>
      <button onClick={onSelectFirst} className="neon-btn text-sm px-5 py-2">
        Открыть #общий-чат
      </button>
    </div>
  );
}