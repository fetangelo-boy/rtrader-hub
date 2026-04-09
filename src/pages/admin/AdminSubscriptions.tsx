import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { getAdminToken } from "@/hooks/useAdminAuth";

const API = "https://functions.poehali.dev/58c8224f-b1da-4e1a-9c7a-09bf808c3c47";

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
  user_id: number; email: string; nickname: string; is_blocked: boolean;
  sub_id: number | null; plan: string | null; status: string;
  expires_at: string | null; created_at: string | null;
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
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Subscriber | null>(null);
  const [modal, setModal] = useState<"grant" | "expires" | "plan" | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // форма
  const [grantPlan, setGrantPlan] = useState("month");
  const [grantDays, setGrantDays] = useState(30);
  const [newExpires, setNewExpires] = useState("");
  const [newPlan, setNewPlan] = useState("month");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ action: "subscribers" });
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`${API}?${params}`, { headers: headers() });
    const d = await res.json();
    setSubscribers(d.subscribers || []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const flash = (text: string) => { setMsg(text); setTimeout(() => setMsg(""), 3000); };

  const openModal = (sub: Subscriber, type: "grant" | "expires" | "plan") => {
    setSelected(sub);
    setModal(type);
    setGrantPlan("month");
    setGrantDays(30);
    setNewExpires(sub.expires_at ? sub.expires_at.slice(0, 10) : "");
    setNewPlan(sub.plan || "month");
  };

  const closeModal = () => { setModal(null); setSelected(null); };

  const doGrantAccess = async () => {
    if (!selected) return;
    setSaving(true);
    const d = await api("grant_access", { user_id: selected.user_id, plan: grantPlan, days: grantDays });
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
      <div className="mb-6">
        <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Admin → VIP</div>
        <h1 className="font-russo text-2xl text-white flex items-center gap-2">
          <Icon name="Users" size={20} style={{ color: "#FFD700" }} /> Подписчики
        </h1>
      </div>

      {/* Статы */}
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

      {/* Поиск */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Email или никнейм..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 transition-colors" />
        </div>
        {statusFilter !== "all" && (
          <button onClick={() => setStatusFilter("all")}
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
                  </div>
                </div>

                {/* Действия */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
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
          <div className="glass-card w-full max-w-sm p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-russo text-base text-white">
                {modal === "grant" ? "Выдать доступ" : modal === "expires" ? "Изменить дату" : "Изменить тариф"}
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
                  <select value={grantPlan} onChange={e => { setGrantPlan(e.target.value); setGrantDays(PLAN_DAYS[e.target.value] || 30); }}
                    className="w-full bg-[#0a0a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                    {Object.entries(PLAN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Дней доступа</label>
                  <input type="number" value={grantDays} onChange={e => setGrantDays(Number(e.target.value))} min={1} max={3650}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" />
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
          </div>
        </div>
      )}
    </div>
  );
}
