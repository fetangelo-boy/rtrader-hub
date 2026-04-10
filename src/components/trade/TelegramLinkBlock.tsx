import Icon from "@/components/ui/icon";

interface Props {
  tgLinked: boolean | null;
  tgLinkUrl: string;
  tgLinkLoading: boolean;
  tgCopied: boolean;
  compact?: boolean;
  onConnect: () => void;
  onCopy: () => void;
  onResetUrl: () => void;
}

export default function TelegramLinkBlock({
  tgLinked, tgLinkUrl, tgLinkLoading, tgCopied, compact = false,
  onConnect, onCopy, onResetUrl,
}: Props) {
  if (tgLinked === true) {
    return (
      <div className={`flex items-center gap-2 rounded-lg bg-green/10 border border-green/20 px-4 py-3 w-full ${compact ? "" : "max-w-sm"}`}>
        <Icon name="CheckCircle" size={15} className="text-green shrink-0" />
        <p className={`${compact ? "text-xs" : "text-sm"} text-green font-medium`}>
          {compact ? "Telegram привязан — доступ откроется автоматически" : "Telegram уже привязан — доступ откроется автоматически"}
        </p>
      </div>
    );
  }

  if (tgLinked === false) {
    return (
      <div className={`bg-[#29b6f6]/8 border border-[#29b6f6]/30 rounded-xl p-4 space-y-${compact ? "2" : "3"} w-full ${compact ? "" : "max-w-sm text-left"}`}>
        <p className={`${compact ? "text-sm" : "text-sm"} text-[#29b6f6] font-medium ${compact ? "flex items-center gap-2" : ""}`}>
          {compact && <Icon name="Send" size={14} />}
          {compact ? "Подключите Telegram заранее" : "Подключите Telegram"}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {compact
            ? "Откройте ссылку в нужном аккаунте Telegram — доступ активируется автоматически после проверки оплаты."
            : "Оплата прошла. Откройте ссылку в нужном аккаунте Telegram — доступ активируется автоматически."}
        </p>
        {!tgLinkUrl ? (
          <button
            onClick={onConnect}
            disabled={tgLinkLoading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-${compact ? "2" : "2.5"} rounded-lg bg-[#29b6f6] hover:bg-[#0288d1] text-white ${compact ? "text-xs" : "text-sm"} font-semibold transition-colors disabled:opacity-60`}
          >
            <Icon name="Send" size={compact ? 13 : 15} />
            {tgLinkLoading ? "Генерирую ссылку..." : "Получить ссылку"}
          </button>
        ) : (
          <div className={`space-y-${compact ? "1.5" : "2"}`}>
            <div className="flex items-center gap-2 bg-background/60 rounded-lg px-3 py-2 border border-[#29b6f6]/20">
              <a href={tgLinkUrl} target="_blank" rel="noreferrer" className="flex-1 text-xs text-[#29b6f6] truncate hover:underline">{tgLinkUrl}</a>
              <button onClick={onCopy} className="shrink-0 text-muted-foreground hover:text-foreground" title="Скопировать">
                <Icon name={tgCopied ? "Check" : "Copy"} size={13} className={tgCopied ? "text-green" : ""} />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Ссылка действует 15 минут.{" "}
              <button onClick={onResetUrl} className="underline">Новая</button>
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
