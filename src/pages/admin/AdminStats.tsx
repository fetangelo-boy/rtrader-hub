import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Icon from "@/components/ui/icon";
import { getAdminToken } from "@/hooks/useAdminAuth";
import func2url from "../../../backend/func2url.json";
import { cn } from "@/lib/utils";

const STATS_URL = (func2url as Record<string, string>)["admin-stats"];

function authHeaders() {
  return { "X-Auth-Token": getAdminToken() || "", "Content-Type": "application/json" };
}

async function fetchStats(action: string, params = "") {
  const r = await fetch(`${STATS_URL}?action=${action}${params}`, { headers: authHeaders() });
  return r.json();
}

const PLAN_NAMES: Record<string, string> = {
  week: "Неделя", month: "Месяц", quarter: "Квартал", halfyear: "Полгода", loyal: "Лояльный"
};

function Card({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: string; color: string }) {
  return (
    <div className={cn("glass-card p-5 flex flex-col gap-2", `border-${color}/20`)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
        <Icon name={icon} size={16} className={`text-${color}`} />
      </div>
      <div className={cn("text-3xl font-russo", `text-${color}`)}>{value}</div>
      {sub && <div className="text-xs text-white/30">{sub}</div>}
    </div>
  );
}

export default function AdminStats() {
  const [revDays, setRevDays] = useState(30);
  const [expDays, setExpDays] = useState(14);
  const [csvLoading, setCsvLoading] = useState(false);

  const downloadConsentsCSV = async () => {
    setCsvLoading(true);
    try {
      const r = await fetch(`${STATS_URL}?action=consents_csv`, { headers: authHeaders() });
      const text = await r.text();
      const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `consents_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setCsvLoading(false);
    }
  };

  const { data: overview } = useQuery({
    queryKey: ["admin-stats-overview"],
    queryFn: () => fetchStats("overview"),
    refetchInterval: 60_000,
  });

  const { data: revenue } = useQuery({
    queryKey: ["admin-stats-revenue", revDays],
    queryFn: () => fetchStats("revenue", `&days=${revDays}`),
  });

  const { data: expiring } = useQuery({
    queryKey: ["admin-stats-expiring", expDays],
    queryFn: () => fetchStats("expiring", `&days=${expDays}`),
  });

  const o = overview || {};

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Аналитика</div>
          <h1 className="font-russo text-2xl text-white">Статистика и выручка</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadConsentsCSV}
            disabled={csvLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 border border-emerald-400/30 bg-emerald-400/5 hover:bg-emerald-400/15 hover:border-emerald-400/60 transition-all whitespace-nowrap disabled:opacity-50"
          >
            <Icon name={csvLoading ? "Loader2" : "Download"} size={13} className={csvLoading ? "animate-spin" : ""} />
            Выгрузить согласия
          </button>
          <a href="/" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#FFD700] border border-[#FFD700]/30 bg-[#FFD700]/5 hover:bg-[#FFD700]/15 hover:border-[#FFD700]/60 transition-all whitespace-nowrap">
            <Icon name="ArrowLeft" size={13} /> На сайт
          </a>
        </div>
      </div>

      {/* Сводка */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Card label="Активных подписок" value={o.active_subscriptions ?? "—"} icon="Users" color="neon-yellow" />
        <Card label="Всего пользователей" value={o.total_users ?? "—"} sub={`+${o.new_users_30d ?? 0} за 30 дней`} icon="UserPlus" color="neon-cyan" />
        <Card label="Оплат за 30 дней" value={o.payments_30d ?? "—"} icon="CreditCard" color="green-400" />
        <Card label="Выручка за 30 дней" value={o.revenue_30d ? `${o.revenue_30d.toLocaleString("ru")} ₽` : "—"} icon="TrendingUp" color="neon-yellow" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-400/10 border border-orange-400/20 flex items-center justify-center">
            <Icon name="Clock" size={18} className="text-orange-400" />
          </div>
          <div>
            <div className="text-xl font-russo text-orange-400">{o.expiring_7d ?? "—"}</div>
            <div className="text-xs text-white/40">Истекают в ближайшие 7 дней</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-400/10 border border-red-400/20 flex items-center justify-center">
            <Icon name="AlertCircle" size={18} className="text-red-400" />
          </div>
          <div>
            <div className="text-xl font-russo text-red-400">{o.pending_payments ?? "—"}</div>
            <div className="text-xs text-white/40">Ожидают одобрения оплаты</div>
          </div>
        </div>
      </div>

      {/* Выручка по периоду */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-russo text-base text-white">Выручка по тарифам</h2>
          <div className="flex gap-1">
            {[30, 90, 365].map(d => (
              <button key={d} onClick={() => setRevDays(d)}
                className={cn("px-3 py-1 rounded-lg text-xs transition-all", revDays === d ? "bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/30" : "text-white/30 hover:text-white/60")}>
                {d === 365 ? "Год" : d === 90 ? "Квартал" : "Месяц"}
              </button>
            ))}
          </div>
        </div>
        {revenue?.breakdown?.length ? (
          <div className="space-y-2">
            {revenue.breakdown.map((b: { plan: string; count: number; revenue: number }) => (
              <div key={b.plan} className="flex items-center gap-3">
                <div className="w-24 text-xs text-white/50">{PLAN_NAMES[b.plan] || b.plan}</div>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-neon-yellow/60 rounded-full"
                    style={{ width: `${Math.min(100, (b.revenue / (revenue.total_revenue || 1)) * 100)}%` }} />
                </div>
                <div className="text-xs text-white/60 w-8 text-right">{b.count} шт</div>
                <div className="text-sm font-semibold text-neon-yellow w-28 text-right">{b.revenue.toLocaleString("ru")} ₽</div>
              </div>
            ))}
            <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-russo">
              <span className="text-white/40">Итого за {revDays === 365 ? "год" : revDays === 90 ? "квартал" : "месяц"}:</span>
              <span className="text-neon-yellow">{revenue.total_revenue?.toLocaleString("ru")} ₽ / {revenue.total_payments} оплат</span>
            </div>
          </div>
        ) : (
          <div className="text-white/30 text-sm">Нет данных за этот период</div>
        )}
      </div>

      {/* Кто скоро теряет доступ */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-russo text-base text-white">Истекают подписки</h2>
          <div className="flex gap-1">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setExpDays(d)}
                className={cn("px-3 py-1 rounded-lg text-xs transition-all", expDays === d ? "bg-orange-400/20 text-orange-400 border border-orange-400/30" : "text-white/30 hover:text-white/60")}>
                {d} дней
              </button>
            ))}
          </div>
        </div>
        {expiring?.expiring?.length ? (
          <div className="space-y-1">
            {expiring.expiring.map((e: { nickname: string; email: string; plan: string; expires_at: string; subscription_id: number }) => {
              const daysLeft = e.expires_at
                ? Math.ceil((new Date(e.expires_at).getTime() - Date.now()) / 86400000)
                : null;
              return (
                <div key={e.subscription_id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    daysLeft !== null && daysLeft <= 3 ? "bg-red-400/20 text-red-400" : "bg-orange-400/20 text-orange-400")}>
                    {daysLeft ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{e.nickname}</div>
                    <div className="text-xs text-white/30">{e.email}</div>
                  </div>
                  <div className="text-xs text-white/40">{PLAN_NAMES[e.plan] || e.plan}</div>
                  <div className="text-xs text-white/30 w-24 text-right">
                    {e.expires_at ? new Date(e.expires_at).toLocaleDateString("ru") : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-white/30 text-sm">Нет истекающих подписок в этом периоде</div>
        )}
      </div>
    </div>
  );
}