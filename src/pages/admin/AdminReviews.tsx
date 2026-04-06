import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getAdminToken } from "@/hooks/useAdminAuth";

const API_URL = "https://functions.poehali.dev/fee7830f-a5a8-4b57-9942-7b9462f259c1";

interface Review {
  id: number;
  name: string;
  status: string;
  text: string;
  is_approved: boolean;
  created_at: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [actionId, setActionId] = useState<number | null>(null);

  const headers = {
    "Content-Type": "application/json",
    "X-Admin-Token": getAdminToken(),
  };

  const fetchReviews = async () => {
    setLoading(true);
    const res = await fetch(API_URL, { headers });
    const data = await res.json();
    setReviews(data.reviews || []);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const approve = async (id: number) => {
    setActionId(id);
    await fetch(`${API_URL}?id=${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ is_approved: true }),
    });
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, is_approved: true } : r));
    setActionId(null);
  };

  const reject = async (id: number) => {
    setActionId(id);
    await fetch(`${API_URL}?id=${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ is_approved: false }),
    });
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, is_approved: false } : r));
    setActionId(null);
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить отзыв безвозвратно?")) return;
    setActionId(id);
    await fetch(`${API_URL}?id=${id}`, { method: "DELETE", headers });
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setActionId(null);
  };

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return !r.is_approved;
    if (filter === "approved") return r.is_approved;
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.is_approved).length;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Admin</div>
          <h1 className="font-russo text-2xl text-white flex items-center gap-3">
            Отзывы
            {pendingCount > 0 && (
              <span className="text-sm px-2.5 py-0.5 rounded-full bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30 font-semibold">
                {pendingCount} новых
              </span>
            )}
          </h1>
        </div>
        <button
          onClick={fetchReviews}
          className="glass-card px-3 py-2 text-xs text-white/50 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <Icon name="RefreshCw" size={12} /> Обновить
        </button>
      </div>

      {/* Фильтр */}
      <div className="flex gap-2 mb-6">
        {([["all", "Все"], ["pending", "На модерации"], ["approved", "Одобренные"]] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === val ? "bg-[#FFD700] text-black" : "glass-card text-white/50 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-white/30 text-sm flex items-center gap-2">
          <Icon name="Loader2" size={16} className="animate-spin" /> Загружаю...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-white/30 text-sm">
          {filter === "pending" ? "Новых отзывов нет — всё проверено!" : "Нет отзывов в этой категории"}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className={`glass-card p-5 flex flex-col gap-3 ${
                r.is_approved ? "border-green-500/15" : "border-[#FFD700]/15"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-white/85 text-sm">{r.name}</span>
                    {r.status && (
                      <span className="text-xs text-white/35">{r.status}</span>
                    )}
                  </div>
                  <div className="text-xs text-white/30">{r.created_at} · #{r.id}</div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                    r.is_approved
                      ? "bg-green-500/15 text-green-400 border border-green-500/25"
                      : "bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/25"
                  }`}
                >
                  {r.is_approved ? "Одобрен" : "На модерации"}
                </span>
              </div>

              <p className="text-white/60 text-sm leading-relaxed">{r.text}</p>

              <div className="flex items-center gap-2 pt-1">
                {!r.is_approved && (
                  <button
                    onClick={() => approve(r.id)}
                    disabled={actionId === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/25 text-xs font-semibold hover:bg-green-500/25 transition-all disabled:opacity-50"
                  >
                    <Icon name="Check" size={12} /> Одобрить
                  </button>
                )}
                {r.is_approved && (
                  <button
                    onClick={() => reject(r.id)}
                    disabled={actionId === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/50 border border-white/10 text-xs font-semibold hover:text-white transition-all disabled:opacity-50"
                  >
                    <Icon name="EyeOff" size={12} /> Скрыть
                  </button>
                )}
                <button
                  onClick={() => remove(r.id)}
                  disabled={actionId === r.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50 ml-auto"
                >
                  <Icon name="Trash2" size={12} /> Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}