import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { getAdminToken } from "@/hooks/useAdminAuth";
import SubscribersToolbar from "./SubscribersToolbar";
import SubscriberRow, { Subscriber } from "./SubscriberRow";
import SubscriptionModals, { HistoryEntry } from "./SubscriptionModals";

const API = "https://functions.poehali.dev/58c8224f-b1da-4e1a-9c7a-09bf808c3c47";
const AUTH_API = "https://functions.poehali.dev/ae3bd284-8ae4-4f3e-9c34-1eb7f36477ed";

function headers() {
  return { "Content-Type": "application/json", "X-Auth-Token": getAdminToken() };
}

async function api(action: string, body?: object) {
  const method = body ? "POST" : "GET";
  const url = `${API}?action=${action}`;
  const res = await fetch(url, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
  return res.json();
}

export default function AdminSubscriptions() {
  const [searchParams] = useSearchParams();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("filter") || searchParams.get("status") || "all");
  const [noTgFilter, setNoTgFilter] = useState(false);
  const [selected, setSelected] = useState<Subscriber | null>(null);
  const [modal, setModal] = useState<"grant" | "expires" | "plan" | "history" | "dm" | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [grantPlan, setGrantPlan] = useState("month");
  const [grantUntil, setGrantUntil] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10);
  });
  const [newExpires, setNewExpires] = useState("");
  const [newPlan, setNewPlan] = useState("month");
  const [dmText, setDmText] = useState("");

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

  const openDm = (sub: Subscriber) => {
    setSelected(sub);
    setDmText("");
    setModal("dm");
  };

  const doSendDm = async () => {
    if (!selected || !dmText.trim()) return;
    setSaving(true);
    const d = await api("send_dm", { user_id: selected.user_id, message: dmText.trim() });
    setSaving(false);
    closeModal();
    flash(d.message || d.error || "Готово");
  };

  const doDeleteUser = async (sub: Subscriber) => {
    if (!confirm(`Удалить пользователя «${sub.nickname}» (${sub.email})?\n\nВсе данные, сессии и подписки будут удалены безвозвратно.`)) return;
    const d = await api("delete_user", { user_id: sub.user_id });
    flash(d.message || d.error || "Готово");
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
    active:   subscribers.filter(s => s.status === "active").length,
    expiring: subscribers.filter(s => s.status === "expiring").length,
    expired:  subscribers.filter(s => s.status === "expired" || s.status === "none").length,
    pending:  subscribers.filter(s => s.status === "pending").length,
  };

  return (
    <div className="p-6 max-w-6xl">
      <SubscribersToolbar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        noTgFilter={noTgFilter}
        setNoTgFilter={setNoTgFilter}
        search={search}
        setSearch={setSearch}
        msg={msg}
        counts={counts}
        totalCount={subscribers.length}
      />

      {loading ? (
        <div className="text-white/30 text-sm flex items-center gap-2 py-8">
          <Icon name="Loader2" size={14} className="animate-spin" /> Загружаю...
        </div>
      ) : subscribers.length === 0 ? (
        <div className="glass-card p-10 text-center text-white/30 text-sm">Подписчиков не найдено</div>
      ) : (
        <div className="flex flex-col gap-2">
          {subscribers.map(sub => (
            <SubscriberRow
              key={sub.user_id}
              sub={sub}
              onDm={openDm}
              onToggleEditor={doToggleEditor}
              onOpenHistory={openHistory}
              onOpenModal={openModal}
              onDeactivate={doDeactivate}
              onDeleteUser={doDeleteUser}
              onFlash={flash}
            />
          ))}
        </div>
      )}

      <SubscriptionModals
        modal={modal}
        selected={selected}
        saving={saving}
        historyLoading={historyLoading}
        history={history}
        grantPlan={grantPlan}
        setGrantPlan={setGrantPlan}
        grantUntil={grantUntil}
        setGrantUntil={setGrantUntil}
        newExpires={newExpires}
        setNewExpires={setNewExpires}
        newPlan={newPlan}
        setNewPlan={setNewPlan}
        dmText={dmText}
        setDmText={setDmText}
        onClose={closeModal}
        onGrantAccess={doGrantAccess}
        onSetExpires={doSetExpires}
        onChangePlan={doChangePlan}
        onSendDm={doSendDm}
      />
    </div>
  );
}
