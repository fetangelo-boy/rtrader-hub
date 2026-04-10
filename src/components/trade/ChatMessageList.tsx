import Icon from "@/components/ui/icon";
import { RoleBadge, UserAvatar } from "./Shared";

interface ChatMessage {
  id: number;
  text: string;
  created_at: string;
  nickname: string;
  role: string;
  reply_to_id?: number | null;
  reply_to_nickname?: string | null;
  reply_to_text?: string | null;
  image_url?: string | null;
}

interface ReplyTo {
  id: number;
  nickname: string;
  text: string;
}

interface Props {
  messages: ChatMessage[];
  loading: boolean;
  hoveredId: number | null;
  canWrite: boolean;
  isAdmin: boolean;
  expandedImg: string | null;
  scrollRef: React.RefObject<HTMLDivElement>;
  bottomRef: React.RefObject<HTMLDivElement>;
  onHover: (id: number | null) => void;
  onReply: (r: ReplyTo) => void;
  onDelete: (id: number) => void;
  onExpandImg: (url: string | null) => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export default function ChatMessageList({
  messages, loading, hoveredId, canWrite, isAdmin,
  expandedImg, scrollRef, bottomRef,
  onHover, onReply, onDelete, onExpandImg,
}: Props) {
  const groupedMessages = messages.reduce((acc, m) => {
    const date = m.created_at.slice(0, 10);
    if (!acc[date]) acc[date] = [];
    acc[date].push(m);
    return acc;
  }, {} as Record<string, ChatMessage[]>);

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Icon name="MessageSquare" size={32} />
            <span className="text-sm">Сообщений пока нет</span>
          </div>
        )}
        {!loading && Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground px-2">{formatDate(msgs[0].created_at)}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {msgs.map(m => (
              <div
                key={m.id}
                className="flex items-start gap-2 py-1 group hover:bg-muted/30 rounded px-1 -mx-1"
                onMouseEnter={() => onHover(m.id)}
                onMouseLeave={() => onHover(null)}
              >
                <UserAvatar name={m.nickname} role={m.role} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-medium text-foreground">{m.nickname}</span>
                    <RoleBadge role={m.role} />
                    <span className="text-[10px] text-muted-foreground">{formatTime(m.created_at)}</span>
                  </div>
                  {m.reply_to_id && m.reply_to_nickname && (
                    <div className="flex gap-1.5 mb-1 px-2 py-1 rounded bg-muted/50 border-l-2 border-primary/40 max-w-xs">
                      <div className="min-w-0">
                        <p className="text-[10px] text-primary/70 font-semibold">{m.reply_to_nickname}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{m.reply_to_text}</p>
                      </div>
                    </div>
                  )}
                  {m.text && <p className="text-sm text-foreground/90 break-words whitespace-pre-wrap">{m.text}</p>}
                  {m.image_url && (
                    <img
                      src={m.image_url}
                      alt="фото"
                      className="mt-1 max-w-[260px] max-h-[300px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => onExpandImg(m.image_url!)}
                    />
                  )}
                </div>
                <div className={`flex gap-0.5 transition-opacity ${hoveredId === m.id ? "opacity-100" : "opacity-0"}`}>
                  {canWrite && (
                    <button
                      onClick={() => onReply({ id: m.id, nickname: m.nickname, text: m.text })}
                      className="p-1 text-muted-foreground hover:text-primary transition-colors"
                      title="Ответить"
                    >
                      <Icon name="Reply" size={12} />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => onDelete(m.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      title="Удалить"
                    >
                      <Icon name="Trash2" size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {expandedImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => onExpandImg(null)}
        >
          <img src={expandedImg} alt="фото" className="max-w-full max-h-full rounded-xl object-contain" />
          <button className="absolute top-4 right-4 text-white" onClick={() => onExpandImg(null)}>
            <Icon name="X" size={24} />
          </button>
        </div>
      )}
    </>
  );
}
