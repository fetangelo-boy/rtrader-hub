import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Icon from "@/components/ui/icon";
import { getAdminToken } from "@/hooks/useAdminAuth";
import func2url from "../../../backend/func2url.json";
import { cn } from "@/lib/utils";

const NOTIFY_URL = (func2url as Record<string, string>)["tg-notify"];

function authHeaders() {
  return { "X-Auth-Token": getAdminToken() || "", "Content-Type": "application/json" };
}

export default function AdminBroadcast() {
  const [text, setText] = useState("");
  const [target, setTarget] = useState<"all" | "active">("active");
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["tg-stats"],
    queryFn: async () => {
      const r = await fetch(`${NOTIFY_URL}?action=stats`, { headers: authHeaders() });
      return r.json();
    },
  });

  const sendReminders = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${NOTIFY_URL}?action=reminders`, { method: "POST", headers: authHeaders() });
      return r.json();
    },
  });

  const broadcast = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${NOTIFY_URL}?action=broadcast`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ text, target }),
      });
      return r.json();
    },
    onSuccess: (d) => {
      setResult(d);
      setText("");
    },
  });

  const s = stats || {};

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Telegram</div>
        <h1 className="font-russo text-2xl text-white">Рассылки и уведомления</h1>
      </div>

      {/* Статистика привязок */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-russo text-neon-cyan">{s.linked ?? "—"}</div>
          <div className="text-xs text-white/40 mt-1">Привязали Telegram</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-russo text-neon-yellow">{s.linked_active ?? "—"}</div>
          <div className="text-xs text-white/40 mt-1">Активные + TG</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-russo text-white/60">{s.total_users ?? "—"}</div>
          <div className="text-xs text-white/40 mt-1">Всего пользователей</div>
        </div>
      </div>

      {/* Напоминания */}
      <div className="glass-card p-5 mb-6">
        <h2 className="font-russo text-base text-white mb-2">Напоминания об истечении</h2>
        <p className="text-xs text-white/40 mb-4">
          Отправить напоминания пользователям, у которых подписка истекает через 3 дня, 1 день и сегодня.
        </p>
        {sendReminders.data && (
          <div className="mb-3 text-sm text-green-400">
            ✅ Отправлено: {sendReminders.data.sent} сообщений
            (3 дня: {sendReminders.data.three_day}, 1 день: {sendReminders.data.one_day}, сегодня: {sendReminders.data.today})
          </div>
        )}
        <button
          onClick={() => sendReminders.mutate()}
          disabled={sendReminders.isPending}
          className="px-4 py-2 rounded-xl bg-orange-400/20 text-orange-400 border border-orange-400/30 text-sm hover:bg-orange-400/30 transition-all disabled:opacity-50"
        >
          <Icon name="Bell" size={14} className="inline mr-2" />
          {sendReminders.isPending ? "Отправляю..." : "Отправить напоминания"}
        </button>
      </div>

      {/* Массовая рассылка */}
      <div className="glass-card p-5">
        <h2 className="font-russo text-base text-white mb-4">Массовая рассылка</h2>

        <div className="flex gap-2 mb-4">
          {(["active", "all"] as const).map(t => (
            <button key={t} onClick={() => setTarget(t)}
              className={cn("px-4 py-2 rounded-xl text-sm transition-all border",
                target === t
                  ? "bg-neon-yellow/20 text-neon-yellow border-neon-yellow/30"
                  : "text-white/40 border-white/10 hover:text-white/70"
              )}>
              {t === "active" ? `Активные подписчики (${s.linked_active ?? "?"})` : `Все с TG (${s.linked ?? "?"})`}
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Текст сообщения... Поддерживается HTML: <b>жирный</b>, <i>курсив</i>"
          rows={5}
          maxLength={3000}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-neon-yellow/40 resize-none transition-colors mb-1"
        />
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-white/20">{text.length}/3000</span>
        </div>

        {result && (
          <div className="mb-4 p-3 rounded-xl bg-green-400/10 border border-green-400/20 text-sm text-green-400">
            ✅ Отправлено: <b>{result.sent}</b> из <b>{result.total}</b>
            {result.failed > 0 && `, не доставлено: ${result.failed}`}
          </div>
        )}

        <button
          onClick={() => { setResult(null); broadcast.mutate(); }}
          disabled={!text.trim() || broadcast.isPending}
          className={cn("w-full py-3 rounded-xl font-semibold text-sm transition-all",
            text.trim() && !broadcast.isPending
              ? "bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/30 hover:bg-neon-yellow/30"
              : "bg-white/5 text-white/20 cursor-not-allowed"
          )}
        >
          {broadcast.isPending ? "Отправляю..." : `Разослать ${target === "active" ? "активным" : "всем"}`}
        </button>
      </div>
    </div>
  );
}
