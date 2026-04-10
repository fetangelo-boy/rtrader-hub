import { useRef } from "react";
import Icon from "@/components/ui/icon";

interface ReplyTo {
  id: number;
  nickname: string;
  text: string;
}

interface Props {
  msg: string;
  sending: boolean;
  error: string;
  replyTo: ReplyTo | null;
  imagePreview: string | null;
  readonly: boolean;
  canWrite: boolean;
  onMsgChange: (v: string) => void;
  onSend: () => void;
  onCancelReply: () => void;
  onClearImage: () => void;
  onImagePick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
}

export default function ChatMessageInput({
  msg, sending, error, replyTo, imagePreview,
  readonly, canWrite,
  onMsgChange, onSend, onCancelReply, onClearImage, onImagePick, onPaste,
}: Props) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!canWrite && readonly) {
    return (
      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">Этот канал только для чтения</p>
      </div>
    );
  }

  if (!canWrite) return null;

  return (
    <div className="p-3 border-t border-border">
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded bg-primary/5 border border-primary/20">
          <div className="w-0.5 h-6 bg-primary/50 rounded-full shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-primary font-semibold">{replyTo.nickname}</p>
            <p className="text-xs text-muted-foreground truncate">{replyTo.text}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="X" size={13} />
          </button>
        </div>
      )}
      {error && <p className="text-xs text-destructive mb-1">{error}</p>}
      {imagePreview && (
        <div className="relative mb-2 inline-block">
          <img src={imagePreview} alt="превью" className="max-h-24 rounded-lg object-cover" />
          <button
            onClick={onClearImage}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center"
          >
            <Icon name="X" size={11} />
          </button>
        </div>
      )}
      <input ref={imageInputRef} type="file" accept="image/*" onChange={onImagePick} className="hidden" />
      <div className="flex items-end gap-2">
        <button
          onClick={() => imageInputRef.current?.click()}
          className="p-2 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors shrink-0"
          title="Прикрепить фото"
        >
          <Icon name="ImagePlus" size={18} />
        </button>
        <textarea
          value={msg}
          onChange={e => onMsgChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
            if (e.key === "Escape") onCancelReply();
          }}
          onPaste={onPaste}
          placeholder={replyTo ? `Ответить ${replyTo.nickname}...` : "Написать сообщение..."}
          rows={1}
          className="flex-1 bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={onSend}
          disabled={sending || (!msg.trim() && !imagePreview)}
          className="p-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Icon name="Send" size={16} />
        </button>
      </div>
    </div>
  );
}
