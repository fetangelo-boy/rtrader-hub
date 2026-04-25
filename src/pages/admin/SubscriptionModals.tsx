import Icon from "@/components/ui/icon";
import { Subscriber } from "./SubscriberRow";

const PLAN_LABELS: Record<string, string> = {
  week: "1 неделя", month: "1 месяц", quarter: "3 месяца",
  halfyear: "6 месяцев", loyal: "Лояльный",
};
const PLAN_DAYS: Record<string, number> = {
  week: 7, month: 30, quarter: 90, halfyear: 180, loyal: 30,
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export interface HistoryEntry {
  id: number; action: string; details: Record<string, string>; created_at: string; admin: string;
}

interface Props {
  modal: "grant" | "expires" | "plan" | "history" | "dm" | null;
  selected: Subscriber | null;
  saving: boolean;
  historyLoading: boolean;
  history: HistoryEntry[];
  grantPlan: string;
  setGrantPlan: (v: string) => void;
  grantUntil: string;
  setGrantUntil: (v: string) => void;
  newExpires: string;
  setNewExpires: (v: string) => void;
  newPlan: string;
  setNewPlan: (v: string) => void;
  dmText: string;
  setDmText: (v: string) => void;
  onClose: () => void;
  onGrantAccess: () => void;
  onSetExpires: () => void;
  onChangePlan: () => void;
  onSendDm: () => void;
}

export default function SubscriptionModals({
  modal, selected, saving, historyLoading, history,
  grantPlan, setGrantPlan, grantUntil, setGrantUntil,
  newExpires, setNewExpires,
  newPlan, setNewPlan,
  dmText, setDmText,
  onClose, onGrantAccess, onSetExpires, onChangePlan, onSendDm,
}: Props) {
  if (!modal || !selected) return null;

  const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
    grant_access:    { label: "Выдан доступ",    icon: "Plus",     color: "#22c55e" },
    set_expires:     { label: "Изменена дата",   icon: "Calendar", color: "#FFD700" },
    deactivate:      { label: "Деактивирован",   icon: "Ban",      color: "#ef4444" },
    change_plan:     { label: "Изменён тариф",   icon: "Tag",      color: "#38BDF8" },
    approve_payment: { label: "Оплата одобрена", icon: "Check",    color: "#22c55e" },
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`glass-card w-full p-6 flex flex-col gap-4 ${modal === "history" ? "max-w-lg" : "max-w-sm"}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-russo text-base text-white">
            {modal === "grant"   ? "Выдать доступ"       :
             modal === "expires" ? "Изменить дату"        :
             modal === "plan"    ? "Изменить тариф"       :
             modal === "dm"      ? "Написать в Telegram"  :
                                   "История изменений"}
          </h3>
          <button onClick={onClose} className="text-white/30 hover:text-white"><Icon name="X" size={16} /></button>
        </div>

        <div className="text-sm text-white/50">
          {selected.nickname} · {selected.email}
        </div>

        {modal === "grant" && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Тариф</label>
              <select value={grantPlan} onChange={e => {
                const plan = e.target.value;
                setGrantPlan(plan);
                const d = new Date();
                d.setDate(d.getDate() + (PLAN_DAYS[plan] || 30));
                setGrantUntil(d.toISOString().slice(0, 10));
              }}
                className="w-full bg-[#0a0a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                {Object.entries(PLAN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Доступ до</label>
              <input type="date" value={grantUntil} onChange={e => setGrantUntil(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" />
              {grantUntil && (
                <p className="text-xs text-white/30 mt-1">
                  {Math.max(1, Math.ceil((new Date(grantUntil).getTime() - Date.now()) / 86400000))} дн.
                </p>
              )}
            </div>
            <button onClick={onGrantAccess} disabled={saving}
              className="neon-btn text-sm py-2.5 disabled:opacity-40">
              {saving ? "Сохраняю..." : "Выдать доступ"}
            </button>
          </div>
        )}

        {modal === "expires" && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Новая дата окончания</label>
              <input type="date" value={newExpires} onChange={e => setNewExpires(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" />
            </div>
            <button onClick={onSetExpires} disabled={saving || !newExpires}
              className="neon-btn text-sm py-2.5 disabled:opacity-40">
              {saving ? "Сохраняю..." : "Сохранить дату"}
            </button>
          </div>
        )}

        {modal === "plan" && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Новый тариф</label>
              <select value={newPlan} onChange={e => setNewPlan(e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                {Object.entries(PLAN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <button onClick={onChangePlan} disabled={saving}
              className="neon-btn text-sm py-2.5 disabled:opacity-40">
              {saving ? "Сохраняю..." : "Изменить тариф"}
            </button>
          </div>
        )}

        {modal === "dm" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#29b6f6]/8 border border-[#29b6f6]/20">
              <Icon name="Send" size={13} style={{ color: "#29b6f6" }} />
              <span className="text-xs text-[#29b6f6]">
                {selected.telegram_username ? `@${selected.telegram_username}` : `TG ID: ${selected.telegram_id}`}
              </span>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Текст сообщения</label>
              <textarea
                value={dmText}
                onChange={e => setDmText(e.target.value)}
                placeholder="Введите сообщение..."
                rows={5}
                maxLength={4000}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#29b6f6]/40 transition-colors resize-none"
              />
              <div className="text-xs text-white/20 text-right mt-1">{dmText.length}/4000</div>
            </div>
            <button onClick={onSendDm} disabled={saving || !dmText.trim()}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-[#29b6f6]/15 border border-[#29b6f6]/30 text-[#29b6f6] hover:bg-[#29b6f6]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <Icon name="Send" size={13} />
              {saving ? "Отправляю..." : "Отправить"}
            </button>
          </div>
        )}

        {modal === "history" && (
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {historyLoading ? (
              <div className="flex items-center gap-2 text-white/30 text-sm py-4">
                <Icon name="Loader2" size={14} className="animate-spin" /> Загружаю...
              </div>
            ) : history.length === 0 ? (
              <div className="text-white/30 text-sm py-4 text-center">Изменений пока нет</div>
            ) : history.map(h => {
              const meta = ACTION_LABELS[h.action] || { label: h.action, icon: "Info", color: "#9ca3af" };
              return (
                <div key={h.id} className="flex gap-3 p-3 bg-white/3 rounded-xl border border-white/8">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}15` }}>
                    <Icon name={meta.icon} size={13} style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white">{meta.label}</span>
                      <span className="text-xs text-white/30 flex-shrink-0">{fmtDate(h.created_at)}</span>
                    </div>
                    {h.admin && <div className="text-xs text-white/35 mt-0.5">Администратор: {h.admin}</div>}
                    {h.details && Object.keys(h.details).length > 0 && (
                      <div className="text-xs text-white/25 mt-1 font-mono">
                        {Object.entries(h.details).map(([k, v]) => (
                          <span key={k} className="mr-3">{k}: {String(v)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
