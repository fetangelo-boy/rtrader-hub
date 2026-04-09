import { useState, useRef, KeyboardEvent, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { ReplyTo } from "@/types/chat";

interface Props {
  channelName: string;
  onSend: (text: string, replyToId?: number | null) => void;
  disabled?: boolean;
  replyTo?: ReplyTo | null;
  onCancelReply?: () => void;
}

export default function MessageInput({ channelName, onSend, disabled, replyTo, onCancelReply }: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyTo) {
      textareaRef.current?.focus();
    }
  }, [replyTo]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, replyTo?.id ?? null);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape" && replyTo) {
      onCancelReply?.();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <div className="px-4 pb-4 pt-2 border-t border-white/5">
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-neon-yellow/5 border border-neon-yellow/20">
          <div className="w-0.5 h-8 bg-neon-yellow/60 rounded-full shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-neon-yellow font-semibold mb-0.5">{replyTo.nickname}</p>
            <p className="text-xs text-white/50 truncate">{replyTo.text}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="shrink-0 w-5 h-5 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors"
          >
            <Icon name="X" size={12} />
          </button>
        </div>
      )}
      <div
        className={cn(
          "flex items-end gap-2 glass-card rounded-xl px-3 py-2",
          "border border-white/10 focus-within:border-neon-yellow/40 transition-colors"
        )}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={replyTo ? `Ответ для ${replyTo.nickname}...` : `Сообщение в #${channelName}`}
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 bg-transparent resize-none text-sm text-white placeholder:text-white/30",
            "outline-none py-1 max-h-[120px] leading-relaxed",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className={cn(
            "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all mb-0.5",
            text.trim() && !disabled
              ? "bg-neon-yellow text-black hover:opacity-90"
              : "bg-white/5 text-white/20 cursor-not-allowed"
          )}
        >
          <Icon name="Send" size={15} />
        </button>
      </div>
      <p className="text-[10px] text-white/20 mt-1 px-1">
        Enter — отправить · Shift+Enter — новая строка{replyTo ? " · Esc — отменить ответ" : ""}
      </p>
    </div>
  );
}
