import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { getAdminToken } from "@/hooks/useAdminAuth";

const API = "https://functions.poehali.dev/58c8224f-b1da-4e1a-9c7a-09bf808c3c47";
const AUTH_API = "https://functions.poehali.dev/ae3bd284-8ae4-4f3e-9c34-1eb7f36477ed";

const PLAN_LABELS: Record<string, string> = {
  week: "1 неделя", month: "1 месяц", quarter: "3 месяца",
  halfyear: "6 месяцев", loyal: "Лояльный",
};
const PLAN_DAYS: Record<string, number> = {
  week: 7, month: 30, quarter: 90, halfyear: 180, loyal: 30,
};
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: "Активна",       color: "#22c55e", bg: "bg-green-500/10" },
  expiring: { label: "Истекает",      color: "#FFD700", bg: "bg-yellow-500/10" },
  expired:  { label: "Истекла",       color: "#9ca3af", bg: "bg-white/5" },
  pending:  { label: "Ожидает",       color: "#38BDF8", bg: "bg-sky-500/10" },
  none:     { label: "Нет доступа",   color: "#6b7280", bg: "bg-white/3" },
};

interface Subscriber {
  user_id: number; email: string; nickname: string; is_blocked: boolean; role?: string;
  sub_id: number | null; plan: string | null; status: string;
  expires_at: string | null; created_at: string | null;
  telegram_id: number | null; telegram_username: string | null;
  receipt_url: string | null;
}

interface HistoryEntry {
  id: number; action: string; details: Record<string, string>; created_at: string; admin: string;
}

function headers() {
  return { "Content-Type": "application/json", "X-Auth-Token": getAdminToken() };
}

async function api(action: string, body?: object) {
  const method = body ? "POST" : "GET";
  const url = `${API}?action=${action}`;
  const res = await fetch(url, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
  return res.json();
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysLeft(iso: string | null) {
  if (!iso) return null;
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  return diff;
}

export default function AdminSubscriptions() {
  const [searchParams] = useSearchParams();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("filter") || searchParams.get("status") || "all");
  const [noTgFilter, setNoTgFilter] = useState(false);
  const [selected, setSelected] = useState<Subscriber | null>(null);
  const [modal, setModal] = useState<"grant" | "expires" | "plan" | "history" | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // форма
  const [grantPlan, setGrantPlan] = useState("month");
  const [grantUntil, setGrantUntil] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10);
  });
  const [newExpires, setNewExpires] = useState("");
  const [newPlan, setNewPlan] = useState("month");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ action: "subscribers" });
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (noTgFilter) params.set("no_tg", "1");
    const res = await fetch(`${API}?${params}`, { headers: headers() });
    const d = await res.json();
    setSubscribers(d.subscribers || []);
    setLoading(false);
  }, [search, statusFilter, noTgFilter]);

  useEffect(() => { load(); }, [load]);

  const flash = (text: string) => { setMsg(text); setTimeout(() => setMsg(""), 3000); };

  const openModal = (sub: Subscriber, type: "grant" | "expires" | "plan") => {
    setSelected(sub);
    setModal(type);
    setGrantPlan("month");
    const d = new Date(); d.setDate(d.getDate() + 30);
    setGrantUntil(d.toISOString().slice(0, 10));
    setNewExpires(sub.expires_at ? sub.expires_at.slice(0, 10) : "");
    setNewPlan(sub.plan || "month");
  };

  const openHistory = async (sub: Subscriber) => {
    setSelected(sub);
    setModal("history");
    setHistory([]);
    setHistoryLoading(true);
    const res = await fetch(`${API}?action=sub_history&user_id=${sub.user_id}`, { headers: headers() });
    const d = await res.json();
    setHistory(d.history || []);
    setHistoryLoading(false);
  };

  const closeModal = () => { setModal(null); setSelected(null); };

  const doGrantAccess = async () => {
    if (!selected) return;
    setSaving(true);
    const days = Math.max(1, Math.ceil((new Date(grantUntil).getTime() - Date.now()) / 86400000));
    const d = await api("grant_access", { user_id: selected.user_id, plan: grantPlan, days });
    setSaving(false);
    closeModal();
    flash(d.message || "Готово");
    load();
  };

  const doSetExpires = async () => {
    if (!selected || !selected.sub_id) return;
    setSaving(true);
    const d = await api("set_expires", { subscription_id: selected.sub_id, expires_at: newExpires });
    setSaving(false);
    closeModal();
    flash(d.message || "Готово");
    load();
  };

  const doChangePlan = async () => {
    if (!selected || !selected.sub_id) return;
    setSaving(true);
    const d = await api("change_plan", { subscription_id: selected.sub_id, plan: newPlan });
    setSaving(false);
    closeModal();
    flash(d.message || "Готово");
    load();
  };

  const doDeactivate = async (sub: Subscriber) => {
    if (!sub.sub_id || !confirm(`Деактивировать доступ для ${sub.nickname}?`)) return;
    const d = await api("deactivate", { subscription_id: sub.sub_id });
    flash(d.message || "Готово");
    load();
  };

  const doToggleEditor = async (sub: Subscriber) => {
    const isEditor = sub.role === "editor";
    const newRole = isEditor ? "subscriber" : "editor";
    const label = isEditor ? "снять роль редактора" : "назначить редактором";
    if (!confirm(`${label} для ${sub.nickname}?`)) return;
    const res = await fetch(`${AUTH_API}?action=set_role`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ user_id: sub.user_id, role: newRole }),
    });
    const d = await res.json();
    flash(d.message || d.error || "Готово");
    load();
  };

  const counts = {
    all: subscribers.length,
    active: subscribers.filter(s => s.status === "active").length,
    expiring: subscribers.filter(s => s.status === "expiring").length,
    expired: subscribers.filter(s => s.status === "expired" || s.status === "none").length,
    pending: subscribers.filter(s => s.status === "pending").length,
  };

  return (
    <div className="p-6 max-w-6xl">
      {/* Заголовок */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Admin → VIP</div>
          <h1 className="font-russo text-2xl text-white flex items-center gap-2">
            <Icon name="Users" size={20} style={{ color: "#FFD700" }} /> Подписчики
          </h1>
        </div>
        <a href="/" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#FFD700] border border-[#FFD700]/30 bg-[#FFD700]/5 hover:bg-[#FFD700]/15 hover:border-[#FFD700]/60 transition-all whitespace-nowrap">
          <Icon name="ArrowLeft" size={13} /> На сайт
        </a>
      </div>

      {/* Банер активного фильтра paid_30d */}
      {statusFilter === "paid_30d" && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon name="CreditCard" size={14} />
            Оплатили за последние 30 дней — {subscribers.length} чел.
          </div>
          <button onClick={() => setStatusFilter("all")} className="text-xs text-white/40 hover:text-white flex items-center gap-1">
            <Icon name="X" size={11} /> сбросить
          </button>
        </div>
      )}

      {/* Статы */}
      {statusFilter !== "paid_30d" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { key: "active", label: "Активных", color: "#22c55e" },
            { key: "expiring", label: "Истекает скоро", color: "#FFD700" },
            { key: "expired", label: "Истекло", color: "#9ca3af" },
            { key: "pending", label: "Ожидают", color: "#38BDF8" },
          ].map(s => (
            <button key={s.key} onClick={() => setStatusFilter(statusFilter === s.key ? "all" : s.key)}
              className={`glass-card p-3 text-left transition-all ${statusFilter === s.key ? "border-white/25" : ""}`}>
              <div className="text-2xl font-russo" style={{ color: s.color }}>{counts[s.key as keyof typeof counts]}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            </button>
          ))}
        </div>
      )}

      {/* Поиск */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Email или никнейм..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 transition-colors" />
        </div>
        <button
          onClick={() => setNoTgFilter(v => !v)}
          className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
            noTgFilter
              ? "bg-[#29b6f6]/15 border-[#29b6f6]/40 text-[#29b6f6]"
              : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
          }`}>
          <Icon name="Send" size={12} />
          Без Telegram
        </button>
        {(statusFilter !== "all" || noTgFilter) && (
          <button onClick={() => { setStatusFilter("all"); setNoTgFilter(false); }}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1.5">
            <Icon name="X" size={12} /> Сбросить
          </button>
        )}
      </div>

      {/* Flash */}
      {msg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400 flex items-center gap-2">
          <Icon name="CheckCircle" size={14} /> {msg}
        </div>
      )}

      {/* Таблица */}
      {loading ? (
        <div className="text-white/30 text-sm flex items-center gap-2 py-8">
          <Icon name="Loader2" size={14} className="animate-spin" /> Загружаю...
        </div>
      ) : subscribers.length === 0 ? (
        <div className="glass-card p-10 text-center text-white/30 text-sm">Подписчиков не найдено</div>
      ) : (
        <div className="flex flex-col gap-2">
          {subscribers.map(sub => {
            const meta = STATUS_META[sub.status] || STATUS_META.none;
            const days = daysLeft(sub.expires_at);
            return (
              <div key={sub.user_id} className={`glass-card p-4 flex items-center gap-4 ${!sub.is_blocked ? "" : "opacity-50"}`}>
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
                          onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(sub.telegram_username ? `@${sub.telegram_username}` : String(sub.telegram_id)); flash(`Скопировано: ${sub.telegram_username ? "@" + sub.telegram_username : sub.telegram_id}`); }}
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
                  <button
                    title={sub.role === "editor" ? "Снять роль редактора" : "Назначить редактором"}
                    onClick={() => doToggleEditor(sub)}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                      sub.role === "editor"
                        ? "bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30"
                        : "bg-white/5 border-white/10 text-white/30 hover:text-purple-400 hover:bg-purple-500/10"
                    }`}>
                    <Icon name="PenLine" size={13} />
                  </button>
                  <button title="История изменений" onClick={() => openHistory(sub)}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/40 flex items-center justify-center hover:text-white hover:bg-white/10 transition-all">
                    <Icon name="History" size={13} />
                  </button>
                  <button title="Выдать/продлить доступ" onClick={() => openModal(sub, "grant")}
                    className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center hover:bg-green-500/20 transition-all">
                    <Icon name="Plus" size={13} />
                  </button>
                  {sub.sub_id && (
                    <>
                      <button title="Изменить дату окончания" onClick={() => openModal(sub, "expires")}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/50 flex items-center justify-center hover:text-white hover:bg-white/10 transition-all">
                        <Icon name="Calendar" size={13} />
                      </button>
                      <button title="Изменить тариф" onClick={() => openModal(sub, "plan")}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/50 flex items-center justify-center hover:text-white hover:bg-white/10 transition-all">
                        <Icon name="Tag" size={13} />
                      </button>
                      {sub.status === "active" || sub.status === "expiring" ? (
                        <button title="Деактивировать" onClick={() => doDeactivate(sub)}
                          className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all">
                          <Icon name="Ban" size={13} />
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модал */}
      {modal && selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className={`glass-card w-full p-6 flex flex-col gap-4 ${modal === "history" ? "max-w-lg" : "max-w-sm"}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-russo text-base text-white">
                {modal === "grant" ? "Выдать доступ" : modal === "expires" ? "Изменить дату" : modal === "plan" ? "Изменить тариф" : "История изменений"}
              </h3>
              <button onClick={closeModal} className="text-white/30 hover:text-white"><Icon name="X" size={16} /></button>
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
                <button onClick={doGrantAccess} disabled={saving}
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
                <button onClick={doSetExpires} disabled={saving || !newExpires}
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
                <button onClick={doChangePlan} disabled={saving}
                  className="neon-btn text-sm py-2.5 disabled:opacity-40">
                  {saving ? "Сохраняю..." : "Изменить тариф"}
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
                  const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
                    grant_access: { label: "Выдан доступ",      icon: "Plus",     color: "#22c55e" },
                    set_expires:  { label: "Изменена дата",     icon: "Calendar", color: "#FFD700" },
                    deactivate:   { label: "Деактивирован",     icon: "Ban",      color: "#ef4444" },
                    change_plan:  { label: "Изменён тариф",     icon: "Tag",      color: "#38BDF8" },
                    approve_payment: { label: "Оплата одобрена", icon: "Check",   color: "#22c55e" },
                  };
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
      )}
    </div>
  );
}