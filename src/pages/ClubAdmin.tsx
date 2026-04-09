import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import func2url from "../../backend/func2url.json";

const ADMIN_URL = (func2url as Record<string, string>).admin;

type Tab = "stats" | "users" | "payments" | "invites" | "chats";

function useAdminFetch(action: string, token: string | null, params = "") {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${ADMIN_URL}?action=${action}${params}`, { headers: { "X-Auth-Token": token } })
      .then(r => r.json())
      .then(d => { setData(d); setError(""); })
      .catch(() => setError("Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [action, token, params]);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, error, refetch };
}

function StatsPanel({ token }: { token: string | null }) {
  const { data, loading } = useAdminFetch("stats", token);
  const stats = data as { total_users?: number; new_users_30d?: number; active_subscriptions?: number; pending_payments?: number; blocked_users?: number } | null;

  if (loading) return <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const items = [
    { label: "Всего пользователей", value: stats?.total_users ?? 0, icon: "Users", link: null },
    { label: "Новых за 30 дней", value: stats?.new_users_30d ?? 0, icon: "UserPlus", link: null },
    { label: "Активных подписок", value: stats?.active_subscriptions ?? 0, icon: "Star", link: "/rt-manage/subscriptions?status=active" },
    { label: "Ожидают проверки", value: stats?.pending_payments ?? 0, icon: "Clock", link: "/rt-manage/subscriptions?status=pending" },
    { label: "Заблокировано", value: stats?.blocked_users ?? 0, icon: "Ban", link: null },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
      {items.map(item => {
        const inner = (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Icon name={item.icon as Parameters<typeof Icon>[0]["name"]} size={16} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{item.value}</p>
            {item.link && <p className="text-[10px] text-primary mt-1 flex items-center gap-1">Управлять <Icon name="ArrowRight" size={9} /></p>}
          </>
        );
        return item.link ? (
          <Link key={item.label} to={item.link} className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors block">
            {inner}
          </Link>
        ) : (
          <div key={item.label} className="bg-card border border-border rounded-lg p-4">
            {inner}
          </div>
        );
      })}
    </div>
  );
}

function UsersPanel({ token }: { token: string | null }) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<Array<{ id: number; email: string; nickname: string; role: string; is_blocked: boolean; created_at: string }>>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const r = await fetch(`${ADMIN_URL}?action=users&search=${encodeURIComponent(search)}`, { headers: { "X-Auth-Token": token } });
    const d = await r.json();
    setUsers(d.users || []);
    setLoading(false);
  }, [token, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleBlock = async (userId: number, blocked: boolean) => {
    await fetch(`${ADMIN_URL}?action=${blocked ? "unblock" : "block"}_user`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
      body: JSON.stringify({ user_id: userId }),
    });
    fetchUsers();
  };

  const setRole = async (userId: number, role: string) => {
    await fetch(`${ADMIN_URL}?action=set_role`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
      body: JSON.stringify({ user_id: userId, role }),
    });
    fetchUsers();
  };

  return (
    <div className="p-4 space-y-3">
      <Input
        placeholder="Поиск по email или никнейму..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {loading ? (
        <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{u.nickname}</span>
                  {u.role !== "subscriber" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">{u.role}</span>
                  )}
                  {u.is_blocked && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">заблок.</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <select
                  value={u.role}
                  onChange={e => setRole(u.id, e.target.value)}
                  className="text-xs bg-input border border-border rounded px-1.5 py-1 text-foreground"
                >
                  <option value="subscriber">subscriber</option>
                  <option value="admin">admin</option>
                  <option value="owner">owner</option>
                </select>
                <button
                  onClick={() => toggleBlock(u.id, u.is_blocked)}
                  className={`p-1.5 rounded text-xs transition-colors ${u.is_blocked ? "bg-green/10 text-green hover:bg-green/20" : "bg-destructive/10 text-destructive hover:bg-destructive/20"}`}
                >
                  <Icon name={u.is_blocked ? "UserCheck" : "UserX"} size={14} />
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Пользователи не найдены</p>}
        </div>
      )}
    </div>
  );
}

function PaymentsPanel({ token }: { token: string | null }) {
  const { data, loading, refetch } = useAdminFetch("payments", token);
  const payments = (data?.payments || []) as Array<{ id: number; user_id: number; nickname: string; email: string; plan: string; status: string; receipt_url: string; created_at: string }>;

  const approve = async (id: number) => {
    await fetch(`${ADMIN_URL}?action=approve_payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
      body: JSON.stringify({ payment_id: id }),
    });
    refetch();
  };

  const reject = async (id: number) => {
    await fetch(`${ADMIN_URL}?action=reject_payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
      body: JSON.stringify({ payment_id: id }),
    });
    refetch();
  };

  if (loading) return <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 space-y-3">
      {payments.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Нет заявок</p>}
      {payments.map(p => (
        <div key={p.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm text-foreground">{p.nickname}</p>
              <p className="text-xs text-muted-foreground">{p.email}</p>
              <p className="text-xs text-muted-foreground mt-1">Тариф: {p.plan}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              p.status === "pending" ? "bg-yellow-500/15 text-yellow-500" :
              p.status === "active" ? "bg-green/15 text-green" :
              "bg-destructive/15 text-destructive"
            }`}>
              {p.status === "pending" ? "ожидает" : p.status === "active" ? "одобрено" : "отклонено"}
            </span>
          </div>
          {p.receipt_url && (
            <a href={p.receipt_url} target="_blank" rel="noreferrer" className="block">
              <img src={p.receipt_url} alt="чек" className="max-h-48 rounded border border-border object-contain" />
            </a>
          )}
          {p.status === "pending" && (
            <div className="flex gap-2">
              <Button onClick={() => approve(p.id)} size="sm" className="flex-1">
                <Icon name="Check" size={14} className="mr-1" /> Одобрить
              </Button>
              <Button onClick={() => reject(p.id)} size="sm" variant="outline" className="flex-1 text-destructive border-destructive/30">
                <Icon name="X" size={14} className="mr-1" /> Отклонить
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function InvitesPanel({ token }: { token: string | null }) {
  const { data, loading, refetch } = useAdminFetch("invites", token);
  const invites = (data?.invites || []) as Array<{ id: number; code: string; days: number; is_used: boolean; used_by_nickname?: string; created_at: string }>;
  const [days, setDays] = useState("30");
  const [creating, setCreating] = useState(false);

  const createInvite = async () => {
    setCreating(true);
    await fetch(`${ADMIN_URL}?action=create_invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
      body: JSON.stringify({ days: parseInt(days) }),
    });
    setCreating(false);
    refetch();
  };

  if (loading) return <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <Input
          type="number"
          value={days}
          onChange={e => setDays(e.target.value)}
          placeholder="Дней"
          className="w-24"
        />
        <Button onClick={createInvite} disabled={creating} className="flex-1">
          <Icon name="Plus" size={14} className="mr-1" />
          Создать инвайт
        </Button>
      </div>

      <div className="space-y-2">
        {invites.map(inv => (
          <div key={inv.id} className={`bg-card border rounded-lg px-3 py-2 flex items-center justify-between gap-2 ${inv.is_used ? "border-border opacity-60" : "border-primary/30"}`}>
            <div>
              <span className="font-mono text-sm text-foreground">{inv.code}</span>
              <span className="text-xs text-muted-foreground ml-2">({inv.days} дней)</span>
              {inv.is_used && inv.used_by_nickname && (
                <span className="text-xs text-muted-foreground ml-1">→ {inv.used_by_nickname}</span>
              )}
            </div>
            {inv.is_used ? (
              <span className="text-xs text-muted-foreground">использован</span>
            ) : (
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/register?invite=${inv.code}`)}
                className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <Icon name="Copy" size={12} /> скопировать
              </button>
            )}
          </div>
        ))}
        {invites.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Инвайтов нет</p>}
      </div>
    </div>
  );
}

export default function ClubAdmin() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("stats");

  if (!user || (user.role !== "owner" && user.role !== "admin")) {
    return <div className="p-8 text-center text-muted-foreground">Нет доступа</div>;
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "stats", label: "Статистика", icon: "BarChart2" },
    { id: "users", label: "Пользователи", icon: "Users" },
    { id: "payments", label: "Платежи", icon: "CreditCard" },
    { id: "invites", label: "Инвайты", icon: "Key" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 h-12 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-1 text-muted-foreground hover:text-foreground">
            <Icon name="ArrowLeft" size={18} />
          </button>
          <span className="font-display text-sm tracking-widest text-foreground uppercase">Панель управления</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{user.nickname}</span>
          <Link to="/rt-manage" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#FFD700]/40 text-[#FFD700] bg-[#FFD700]/5 hover:bg-[#FFD700]/15 transition-all">
            <Icon name="Shield" size={12} /> Admin
          </Link>
        </div>
      </header>

      <div className="flex border-b border-border bg-card overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap transition-colors border-b-2 ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon name={t.icon as Parameters<typeof Icon>[0]["name"]} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl mx-auto">
        {tab === "stats" && <StatsPanel token={token} />}
        {tab === "users" && <UsersPanel token={token} />}
        {tab === "payments" && <PaymentsPanel token={token} />}
        {tab === "invites" && <InvitesPanel token={token} />}
      </div>
    </div>
  );
}