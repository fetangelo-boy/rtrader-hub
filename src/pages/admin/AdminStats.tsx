import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { getAdminToken } from "@/hooks/useAdminAuth";
import func2url from "../../../backend/func2url.json";
import { cn } from "@/lib/utils";

const STATS_URL = (func2url as Record<string, string>)["admin-stats"];
const ADMIN_URL = (func2url as Record<string, string>)["admin"];

function authHeaders() {
  return { "X-Auth-Token": getAdminToken() || "", "Content-Type": "application/json" };
}

async function fetchStats(action: string, params = "") {
  const r = await fetch(`${STATS_URL}?action=${action}${params}`, { headers: authHeaders() });
  return r.json();
}

async function fetchPendingList() {
  const r = await fetch(`${ADMIN_URL}?action=subscribers&status=pending`, { headers: authHeaders() });
  const data = await r.json();
  return data.subscribers ?? [];
}

const PLAN_NAMES: Record<string, string> = {
  week: "Неделя", month: "Месяц", quarter: "Квартал", halfyear: "Полгода", loyal: "Лояльный"
};

function ClickableCard({
  label, value, sub, icon, color, onClick
}: {
  label: string; value: string | number; sub?: string; icon: string; color: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-card p-5 flex flex-col gap-2",
        `border-${color}/20`,
        onClick ? "cursor-pointer hover:bg-white/5 hover:scale-[1.02] transition-all duration-150" : ""
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
        <Icon name={icon} size={16} className={`text-${color}`} />
      </div>
      <div className={cn("text-3xl font-russo", `text-${color}`)}>{value}</div>
      {sub && <div className="text-xs text-white/30">{sub}</div>}
      {onClick && (
        <div className="text-[10px] text-white/20 flex items-center gap-1 mt-1">
          <Icon name="ExternalLink" size={10} /> перейти к списку
        </div>
      )}
    </div>
  );
}

async function downloadCsv(url: string, filename: string, headers: Record<string, string>) {
  const r = await fetch(url, { headers });
  const text = await r.text();
  const blob = new Blob(["\uFEFF" + text, ""], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function AdminStats() {
  const navigate = useNavigate();
  const [revDays, setRevDays] = useState(30);
  const [expDays, setExpDays] = useState(14);
  const [csvLoading, setCsvLoading] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

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

  const [visitorDays, setVisitorDays] = useState(7);

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

  const { data: pendingList, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-stats-pending"],
    queryFn: fetchPendingList,
    enabled: showPending,
    refetchInterval: showPending ? 30_000 : false,
  });

  const { data: audience } = useQuery({
    queryKey: ["admin-stats-audience"],
    queryFn: () => fetchStats("audience"),
    refetchInterval: 120_000,
  });

  const { data: visitors } = useQuery({
    queryKey: ["admin-stats-visitors", visitorDays],
    queryFn: () => fetchStats("visitors", `&days=${visitorDays}`),
    refetchInterval: 30_000,
  });

  const o = overview || {};
  const a = audience || {};
  const v = visitors || {};

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
        <ClickableCard
          label="Активных подписок"
          value={o.active_subscriptions ?? "—"}
          icon="Users"
          color="neon-yellow"
          onClick={() => navigate("/rt-manage/subscriptions?filter=active")}
        />
        <ClickableCard
          label="Всего пользователей"
          value={o.total_users ?? "—"}
          sub={`+${o.new_users_30d ?? 0} за 30 дней`}
          icon="UserPlus"
          color="neon-cyan"
          onClick={() => navigate("/rt-manage/subscriptions")}
        />
        <ClickableCard
          label="Оплат за 30 дней"
          value={o.payments_30d ?? "—"}
          icon="CreditCard"
          color="green-400"
          onClick={() => navigate("/rt-manage/subscriptions?filter=paid_30d")}
        />
        <ClickableCard
          label="Выручка за 30 дней"
          value={o.revenue_30d ? `${o.revenue_30d.toLocaleString("ru")} ₽` : "—"}
          icon="TrendingUp"
          color="neon-yellow"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {/* Истекающие — кликабельно, ведёт в подписчиков */}
        <button
          onClick={() => navigate("/rt-manage/subscriptions?filter=expiring")}
          className="glass-card p-4 flex items-center gap-3 text-left hover:bg-white/5 hover:scale-[1.02] transition-all duration-150 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-400/10 border border-orange-400/20 flex items-center justify-center shrink-0">
            <Icon name="Clock" size={18} className="text-orange-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xl font-russo text-orange-400">{o.expiring_7d ?? "—"}</div>
            <div className="text-xs text-white/40">Истекают в ближайшие 7 дней</div>
            <div className="text-[10px] text-white/20 flex items-center gap-1 mt-1">
              <Icon name="ExternalLink" size={10} /> перейти к списку
            </div>
          </div>
        </button>

        {/* Ожидают — раскрывает список прямо здесь */}
        <button
          onClick={() => setShowPending((v) => !v)}
          className={cn(
            "glass-card p-4 flex items-center gap-3 text-left transition-all duration-150 cursor-pointer",
            showPending ? "bg-red-400/10 border-red-400/30" : "hover:bg-white/5 hover:scale-[1.02]"
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-red-400/10 border border-red-400/20 flex items-center justify-center shrink-0">
            <Icon name="AlertCircle" size={18} className="text-red-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xl font-russo text-red-400">{o.pending_payments ?? "—"}</div>
            <div className="text-xs text-white/40">Ожидают одобрения оплаты</div>
            <div className="text-[10px] text-white/20 flex items-center gap-1 mt-1">
              <Icon name={showPending ? "ChevronUp" : "ChevronDown"} size={10} />
              {showPending ? "скрыть список" : "показать список"}
            </div>
          </div>
        </button>
      </div>

      {/* Раскрывающийся список ожидающих */}
      {showPending && (
        <div className="glass-card p-5 mb-8 border-red-400/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-russo text-base text-white flex items-center gap-2">
              <Icon name="AlertCircle" size={15} className="text-red-400" />
              Ожидают одобрения оплаты
            </h2>
            <button
              onClick={() => navigate("/rt-manage/subscriptions?filter=pending")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-300 border border-sky-400/30 bg-sky-400/5 hover:bg-sky-400/15 transition-all"
            >
              <Icon name="ExternalLink" size={12} /> Открыть в подписчиках
            </button>
          </div>

          {pendingLoading ? (
            <div className="flex items-center gap-2 text-white/30 text-sm py-4">
              <Icon name="Loader2" size={14} className="animate-spin" /> Загружаю...
            </div>
          ) : pendingList?.length ? (
            <div className="space-y-1">
              {pendingList.map((s: { user_id: number; nickname: string; email: string; plan: string | null; created_at: string | null }) => (
                <div
                  key={s.user_id}
                  onClick={() => navigate("/rt-manage/subscriptions?filter=pending")}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-white/5 hover:bg-white/5 hover:border-red-400/20 cursor-pointer transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-red-400/15 border border-red-400/25 flex items-center justify-center shrink-0">
                    <Icon name="User" size={13} className="text-red-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{s.nickname}</div>
                    <div className="text-xs text-white/30">{s.email}</div>
                  </div>
                  {s.plan && (
                    <span className="text-[10px] text-sky-300 bg-sky-400/10 px-2 py-0.5 rounded border border-sky-400/20 shrink-0">
                      {PLAN_NAMES[s.plan] || s.plan}
                    </span>
                  )}
                  {s.created_at && (
                    <div className="text-xs text-white/25 w-20 text-right shrink-0">
                      {new Date(s.created_at).toLocaleDateString("ru")}
                    </div>
                  )}
                  <Icon name="ChevronRight" size={14} className="text-white/20 shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-white/30 text-sm py-4 text-center">Нет заявок, ожидающих одобрения</div>
          )}
        </div>
      )}

      {/* Посетители сайта */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-russo text-base text-white flex items-center gap-2">
            <Icon name="Activity" size={15} className="text-neon-cyan" />
            Посетители сайта
          </h2>
          <div className="flex gap-1">
            {[1, 7, 30].map(d => (
              <button key={d} onClick={() => setVisitorDays(d)}
                className={cn("px-3 py-1 rounded-lg text-xs transition-all", visitorDays === d ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30" : "text-white/30 hover:text-white/60")}>
                {d === 1 ? "Сегодня" : d === 7 ? "7 дней" : "30 дней"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/3 rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/40">Онлайн сейчас</span>
            </div>
            <div className="text-2xl font-russo text-green-400">{v.online_now ?? "—"}</div>
          </div>
          <div className="bg-white/3 rounded-xl p-3 flex flex-col gap-1">
            <div className="text-xs text-white/40">Уникальных за период</div>
            <div className="text-2xl font-russo text-neon-cyan">{v.unique_visitors ?? "—"}</div>
          </div>
          <div className="bg-white/3 rounded-xl p-3 flex flex-col gap-1">
            <div className="text-xs text-white/40">Просмотров страниц</div>
            <div className="text-2xl font-russo text-white/70">{v.total_views ?? "—"}</div>
          </div>
        </div>
        {v.top_pages?.length > 0 && (
          <div>
            <div className="text-xs text-white/30 mb-2 uppercase tracking-wider">Топ страниц</div>
            <div className="space-y-1">
              {v.top_pages.map((p: { path: string; visitors: number }) => (
                <div key={p.path} className="flex items-center gap-2">
                  <div className="text-xs text-white/50 w-40 truncate">{p.path}</div>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-cyan/50 rounded-full"
                      style={{ width: `${Math.min(100, (p.visitors / (v.top_pages[0]?.visitors || 1)) * 100)}%` }} />
                  </div>
                  <div className="text-xs text-white/40 w-10 text-right">{p.visitors}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Аудитория */}
      <div className="glass-card p-5 mb-6">
        <h2 className="font-russo text-base text-white mb-4 flex items-center gap-2">
          <Icon name="PieChart" size={15} className="text-neon-yellow" />
          Аудитория
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Всего зарегистрировались", value: a.total, color: "text-white/70" },
            { label: "Активные клиенты", value: a.active_clients, color: "text-green-400" },
            { label: "Купили впервые", value: a.first_time, color: "text-neon-cyan" },
            { label: "Купили повторно", value: a.repeat, color: "text-neon-yellow" },
            { label: "Не продлили", value: a.not_renewed, color: "text-orange-400" },
            { label: "Ни разу не покупали", value: a.never_bought, color: "text-white/40" },
          ].map(item => (
            <div key={item.label} className="bg-white/3 rounded-xl p-3 flex flex-col gap-1">
              <div className="text-xs text-white/40 leading-tight">{item.label}</div>
              <div className={cn("text-2xl font-russo", item.color)}>{item.value ?? "—"}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-white/8 grid grid-cols-2 gap-3">
          <div className="bg-white/3 rounded-xl p-3 flex flex-col gap-1">
            <div className="text-xs text-white/40">Уникальных клиентов (все время)</div>
            <div className="text-2xl font-russo text-neon-yellow">{a.sales_clients ?? "—"}</div>
          </div>
          <div className="bg-white/3 rounded-xl p-3 flex flex-col gap-1">
            <div className="text-xs text-white/40">Всего оплат (все время)</div>
            <div className="text-2xl font-russo text-neon-yellow">{a.sales_total ?? "—"}</div>
          </div>
        </div>
      </div>

      {/* Выручка по периоду */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-russo text-base text-white">Выручка по тарифам</h2>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[30, 90, 365].map(d => (
                <button key={d} onClick={() => setRevDays(d)}
                  className={cn("px-3 py-1 rounded-lg text-xs transition-all", revDays === d ? "bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/30" : "text-white/30 hover:text-white/60")}>
                  {d === 365 ? "Год" : d === 90 ? "Квартал" : "Месяц"}
                </button>
              ))}
            </div>
            <button
              disabled={exportLoading === "payments_csv"}
              onClick={async () => {
                setExportLoading("payments_csv");
                try {
                  await downloadCsv(
                    `${STATS_URL}?action=payments_csv&days=${revDays}`,
                    `payments_${revDays}d_${new Date().toISOString().slice(0,10)}.csv`,
                    authHeaders()
                  );
                } finally { setExportLoading(null); }
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all disabled:opacity-40"
            >
              <Icon name="Download" size={12} />
              CSV
            </button>
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
      <div className="glass-card p-5 mb-8">
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

      {/* Выгрузки */}
      <div className="glass-card p-5">
        <h2 className="font-russo text-base text-white mb-1">Выгрузка данных</h2>
        <p className="text-xs text-white/30 mb-5">CSV-файлы открываются в Excel и Google Таблицах</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: "subscribers_csv", label: "Подписчики", desc: "Все подписчики с тарифами и статусами", icon: "Users", color: "neon-yellow", filename: `subscribers_${new Date().toISOString().slice(0,10)}.csv` },
            { key: "payments_csv", label: "Оплаты за год", desc: "История оплат за последние 12 месяцев", icon: "CreditCard", color: "green-400", filename: `payments_${new Date().toISOString().slice(0,10)}.csv`, extra: "&days=365" },
            { key: "users_csv", label: "Все пользователи", desc: "Полный список зарегистрированных", icon: "UserPlus", color: "neon-cyan", filename: `users_${new Date().toISOString().slice(0,10)}.csv` },
            { key: "consents_csv", label: "Согласия", desc: "Лог принятия пользовательского соглашения", icon: "FileCheck", color: "white", filename: `consents_${new Date().toISOString().slice(0,10)}.csv` },
          ].map(item => (
            <button
              key={item.key}
              disabled={exportLoading === item.key}
              onClick={async () => {
                setExportLoading(item.key);
                try {
                  await downloadCsv(
                    `${STATS_URL}?action=${item.key}${item.extra || ""}`,
                    item.filename,
                    authHeaders()
                  );
                } finally {
                  setExportLoading(null);
                }
              }}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/3 border border-white/8 hover:bg-white/6 hover:border-white/15 transition-all text-left disabled:opacity-60 disabled:cursor-wait"
            >
              <div className={`w-10 h-10 rounded-xl bg-${item.color}/10 border border-${item.color}/20 flex items-center justify-center shrink-0`}>
                {exportLoading === item.key
                  ? <Icon name="Loader2" size={16} className={`text-${item.color} animate-spin`} />
                  : <Icon name={item.icon} size={16} className={`text-${item.color}`} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold text-${item.color}`}>{item.label}</div>
                <div className="text-xs text-white/30 mt-0.5">{item.desc}</div>
              </div>
              <Icon name="Download" size={14} className="text-white/20 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}