import Icon from "@/components/ui/icon";

const PLAN_LABELS: Record<string, string> = {
  week: "1 неделя", month: "1 месяц", quarter: "3 месяца",
  halfyear: "6 месяцев", loyal: "Лояльный",
};
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: "Активна",     color: "#22c55e", bg: "bg-green-500/10" },
  expiring: { label: "Истекает",    color: "#FFD700", bg: "bg-yellow-500/10" },
  expired:  { label: "Истекла",     color: "#9ca3af", bg: "bg-white/5" },
  pending:  { label: "Ожидает",     color: "#38BDF8", bg: "bg-sky-500/10" },
  none:     { label: "Нет доступа", color: "#6b7280", bg: "bg-white/3" },
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysLeft(iso: string | null) {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export interface Subscriber {
  user_id: number; email: string; nickname: string; is_blocked: boolean; role?: string;
  sub_id: number | null; plan: string | null; status: string;
  expires_at: string | null; created_at: string | null;
  telegram_id: number | null; telegram_username: string | null;
  receipt_url: string | null;
}

interface Props {
  sub: Subscriber;
  onDm: (sub: Subscriber) => void;
  onToggleEditor: (sub: Subscriber) => void;
  onOpenHistory: (sub: Subscriber) => void;
  onOpenModal: (sub: Subscriber, type: "grant" | "expires" | "plan") => void;
  onDeactivate: (sub: Subscriber) => void;
  onDeleteUser: (sub: Subscriber) => void;
  onFlash: (text: string) => void;
}

export default function SubscriberRow({
  sub, onDm, onToggleEditor, onOpenHistory, onOpenModal, onDeactivate, onDeleteUser, onFlash,
}: Props) {
  const meta = STATUS_META[sub.status] || STATUS_META.none;
  const days = daysLeft(sub.expires_at);

  return (
    <div className={`glass-card p-4 flex items-center gap-4 ${!sub.is_blocked ? "" : "opacity-50"}`}>
      {/* Аватар */}
      <div className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center flex-shrink-0 text-sm font-bold text-white/60">
        {(sub.nickname || sub.email)[0].toUpperCase()}
      </div>

      {/* Инфо */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white">{sub.nickname || "—"}</span>
          <span className="text-xs text-white/35">{sub.email}</span>
          {sub.role === "editor" && <span className="text-xs text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded-md border border-purple-400/20">редактор</span>}
          {sub.is_blocked && <span className="text-xs text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-md">заблокирован</span>}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.bg}`} style={{ color: meta.color }}>
            {meta.label}
          </span>
          {sub.plan && (
            <span className="text-xs text-white/35">{PLAN_LABELS[sub.plan] || sub.plan}</span>
          )}
          {sub.expires_at && (
            <span className="text-xs text-white/35">
              до {fmtDate(sub.expires_at)}
              {days !== null && days > 0 && days <= 30 && (
                <span className="ml-1 text-yellow-400">({days} дн.)</span>
              )}
            </span>
          )}
          {sub.telegram_id ? (
            <span className="text-xs flex items-center gap-1">
              <Icon name="Send" size={11} style={{ color: "#29b6f6" }} />
              {sub.telegram_username ? (
                <a
                  href={`https://t.me/${sub.telegram_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#29b6f6] hover:underline"
                  onClick={e => e.stopPropagation()}
                >
                  @{sub.telegram_username}
                </a>
              ) : (
                <span className="text-[#29b6f6]">Telegram привязан</span>
              )}
              <button
                title="Скопировать Telegram ID"
                onClick={e => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(sub.telegram_username ? `@${sub.telegram_username}` : String(sub.telegram_id));
                  onFlash(`Скопировано: ${sub.telegram_username ? "@" + sub.telegram_username : sub.telegram_id}`);
                }}
                className="text-white/20 hover:text-[#29b6f6] transition-colors ml-0.5"
              >
                <Icon name="Copy" size={11} />
              </button>
            </span>
          ) : (
            <span className="text-xs flex items-center gap-1 text-white/20">
              <Icon name="Send" size={11} />
              нет TG
            </span>
          )}
        </div>
      </div>

      {/* Чек для pending */}
      {sub.status === "pending" && sub.receipt_url && (
        <a
          href={sub.receipt_url}
          target="_blank"
          rel="noopener noreferrer"
          title="Открыть чек об оплате"
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-semibold hover:bg-sky-500/25 transition-all flex-shrink-0"
        >
          <Icon name="Receipt" size={13} />
          Чек
        </a>
      )}

      {/* Действия */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {sub.telegram_id && (
          <button
            title="Написать в Telegram"
            onClick={() => onDm(sub)}
            className="w-8 h-8 rounded-lg bg-[#29b6f6]/10 border border-[#29b6f6]/20 text-[#29b6f6] flex items-center justify-center hover:bg-[#29b6f6]/20 transition-all">
            <Icon name="MessageCircle" size={13} />
          </button>
        )}
        <button
          title={sub.role === "editor" ? "Снять роль редактора" : "Назначить редактором"}
          onClick={() => onToggleEditor(sub)}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
            sub.role === "editor"
              ? "bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30"
              : "bg-white/5 border-white/10 text-white/30 hover:text-purple-400 hover:bg-purple-500/10"
          }`}>
          <Icon name="PenLine" size={13} />
        </button>
        <button title="История изменений" onClick={() => onOpenHistory(sub)}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/40 flex items-center justify-center hover:text-white hover:bg-white/10 transition-all">
          <Icon name="History" size={13} />
        </button>
        <button title="Выдать/продлить доступ" onClick={() => onOpenModal(sub, "grant")}
          className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center hover:bg-green-500/20 transition-all">
          <Icon name="Plus" size={13} />
        </button>
        {sub.sub_id && (
          <>
            <button title="Изменить дату окончания" onClick={() => onOpenModal(sub, "expires")}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/50 flex items-center justify-center hover:text-white hover:bg-white/10 transition-all">
              <Icon name="Calendar" size={13} />
            </button>
            <button title="Изменить тариф" onClick={() => onOpenModal(sub, "plan")}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/50 flex items-center justify-center hover:text-white hover:bg-white/10 transition-all">
              <Icon name="Tag" size={13} />
            </button>
            {(sub.status === "active" || sub.status === "expiring") && (
              <button title="Деактивировать" onClick={() => onDeactivate(sub)}
                className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all">
                <Icon name="Ban" size={13} />
              </button>
            )}
          </>
        )}
        <button title="Удалить пользователя" onClick={() => onDeleteUser(sub)}
          className="w-8 h-8 rounded-lg bg-red-500/5 border border-red-500/15 text-red-400/50 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all">
          <Icon name="Trash2" size={13} />
        </button>
      </div>
    </div>
  );
}
