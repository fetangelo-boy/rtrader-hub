import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import HubNav from "@/components/HubNav";
import ChannelList from "@/components/chat/ChannelList";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import { useChannels, useMessages, useSendMessage, useMarkAsRead, useCurrentUser, useDeleteMessage } from "@/hooks/useChat";
import type { Channel, ReplyTo } from "@/types/chat";
import { cn } from "@/lib/utils";
export default function Community() {
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);

  const { data: currentUser } = useCurrentUser();
  const { data: channels = [], isLoading: channelsLoading } = useChannels();
  const { data: messages = [], isLoading: messagesLoading } = useMessages(activeChannel?.id ?? null);
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const markAsRead = useMarkAsRead();

  const handleSelectChannel = (ch: Channel) => {
    setActiveChannel(ch);
    setSidebarOpen(false);
    setReplyTo(null);
    markAsRead.mutate(ch.id);
  };

  const handleSend = (text: string, replyToId?: number | null) => {
    if (!activeChannel) return;
    sendMessage.mutate({ channelId: activeChannel.id, text, replyToId });
    setReplyTo(null);
  };

  return (
    <div className="flex flex-col bg-[hsl(var(--background))] text-white overflow-hidden" style={{height: "100dvh"}}>
      <HubNav />
      {/* OLD Top bar — для отката раскомментируй и убери HubNav */}
      <header className="mt-12 h-10 shrink-0 flex items-center gap-3 px-4 border-b border-white/5 bg-black/30 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <Icon name="ArrowLeft" size={16} />
          <span className="text-sm hidden sm:block">На главную</span>
        </Link>
        <div className="w-px h-5 bg-white/10" />
        <span className="font-russo text-base tracking-wider text-neon-yellow">RTrader</span>
        <span className="text-white/30 text-sm font-medium">Комьюнити</span>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
            онлайн
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
            "w-60 shrink-0 border-r border-white/5 bg-black/20 flex flex-col overflow-y-auto",
            "lg:relative lg:translate-x-0 lg:z-auto",
            "fixed left-0 z-30 transition-transform duration-200",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
          style={{ top: "calc(48px + 40px)", bottom: 0 }}
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
                  isAdmin={currentUser?.role === "admin"}
                  onDelete={(id) => deleteMessage.mutate(id)}
                  onReply={(r) => setReplyTo(r)}
                />
              )}

              <MessageInput
                channelName={activeChannel.name}
                onSend={handleSend}
                disabled={sendMessage.isPending}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
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