import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { getAdminToken } from "@/hooks/useAdminAuth";

const LOG_URL = "https://functions.poehali.dev/b7d41118-f036-4353-9124-c42eb2513380";

const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  login:           { label: "Вход в систему",       icon: "LogIn",       color: "text-green-400" },
  review_approve:  { label: "Отзыв одобрен",         icon: "CheckCircle", color: "text-green-400" },
  review_reject:   { label: "Отзыв отклонён",        icon: "XCircle",     color: "text-red-400" },
  review_delete:   { label: "Отзыв удалён",          icon: "Trash2",      color: "text-red-400" },
  content_update:  { label: "Текст сайта изменён",   icon: "FileEdit",    color: "text-blue-400" },
  cms_create:      { label: "Материал создан",        icon: "PlusCircle",  color: "text-green-400" },
  cms_update:      { label: "Материал изменён",       icon: "Pencil",      color: "text-yellow-400" },
  cms_delete:      { label: "Материал удалён",        icon: "Trash2",      color: "text-red-400" },
  cms_visibility:  { label: "Видимость изменена",     icon: "Eye",         color: "text-purple-400" },
};

interface LogEntry {
  id: number;
  username: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

function formatDetails(action: string, details: Record<string, unknown>): string {
  if (action === "review_approve" || action === "review_reject") {
    return `Отзыв #${details.review_id}`;
  }
  if (action === "review_delete") {
    return `Отзыв #${details.review_id}${details.name ? ` — ${details.name}` : ""}`;
  }
  if (action === "content_update") {
    return `[${details.section}] ${details.key}`;
  }
  if (action === "cms_create") {
    return `${details.section_label || details.section}${details.title ? ` — ${details.title}` : ""} (id: ${details.id})`;
  }
  if (action === "cms_update") {
    const fields = Array.isArray(details.fields) ? (details.fields as string[]).join(", ") : "";
    return `${details.section_label || details.section}${details.id ? ` #${details.id}` : ""}${fields ? ` [${fields}]` : ""}`;
  }
  if (action === "cms_delete") {
    return `${details.section_label || details.section}${details.id ? ` #${details.id}` : ""}${details.title ? ` — ${details.title}` : ""}`;
  }
  if (action === "cms_visibility") {
    return `${details.section_label || details.section} #${details.id} → ${details.is_visible ? "показан" : "скрыт"}`;
  }
  return "";
}

export default function AdminActivityLog() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const res = await fetch(`${LOG_URL}?limit=200`, {
      headers: { "X-Admin-Token": getAdminToken() },
    });
    if (res.ok) {
      const data = await res.json();
      setLog(data.log || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const users = Array.from(new Set(log.map((e) => e.username)));
  const filtered = filter === "all" ? log : log.filter((e) => e.username === filter);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Администрирование</div>
          <h1 className="font-russo text-2xl text-white">Журнал действий</h1>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white transition-colors"
        >
          <Icon name="RefreshCw" size={14} /> Обновить
        </button>
      </div>

      {/* Фильтр по пользователю */}
      {users.length > 1 && (
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              filter === "all"
                ? "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30"
                : "text-white/40 border-white/10 hover:text-white"
            }`}
          >
            Все
          </button>
          {users.map((u) => (
            <button
              key={u}
              onClick={() => setFilter(u)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                filter === u
                  ? "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30"
                  : "text-white/40 border-white/10 hover:text-white"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-white/30 text-sm">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-white/30 text-sm">
          Действий пока нет
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map((entry) => {
            const meta = ACTION_LABELS[entry.action] || { label: entry.action, icon: "Activity", color: "text-white/50" };
            const detail = formatDetails(entry.action, entry.details || {});
            return (
              <div
                key={entry.id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/3 border border-white/6 hover:bg-white/5 transition-colors"
              >
                <div className={`flex-shrink-0 ${meta.color}`}>
                  <Icon name={meta.icon} size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/80">{meta.label}</span>
                    {detail && <span className="text-xs text-white/35 truncate">{detail}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1">
                    <div className="w-4 h-4 rounded-full brand-gradient-bg flex items-center justify-center flex-shrink-0">
                      <Icon name="User" size={9} className="text-black" />
                    </div>
                    <span className="text-xs text-white/60">{entry.username}</span>
                  </div>
                  <span className="text-xs text-white/25">{entry.created_at}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
