import Icon from "@/components/ui/icon";

interface Counts {
  active: number;
  expiring: number;
  expired: number;
  pending: number;
}

interface Props {
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  noTgFilter: boolean;
  setNoTgFilter: (v: (prev: boolean) => boolean) => void;
  search: string;
  setSearch: (v: string) => void;
  msg: string;
  counts: Counts;
  totalCount: number;
}

export default function SubscribersToolbar({
  statusFilter, setStatusFilter,
  noTgFilter, setNoTgFilter,
  search, setSearch,
  msg, counts, totalCount,
}: Props) {
  return (
    <>
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

      {/* Баннер paid_30d */}
      {statusFilter === "paid_30d" && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon name="CreditCard" size={14} />
            Оплатили за последние 30 дней — {totalCount} чел.
          </div>
          <button onClick={() => setStatusFilter("all")} className="text-xs text-white/40 hover:text-white flex items-center gap-1">
            <Icon name="X" size={11} /> сбросить
          </button>
        </div>
      )}

      {/* Статкарточки */}
      {statusFilter !== "paid_30d" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { key: "active",   label: "Активных",       color: "#22c55e" },
            { key: "expiring", label: "Истекает скоро", color: "#FFD700" },
            { key: "expired",  label: "Истекло",        color: "#9ca3af" },
            { key: "pending",  label: "Ожидают",        color: "#38BDF8" },
          ].map(s => (
            <button key={s.key} onClick={() => setStatusFilter(statusFilter === s.key ? "all" : s.key)}
              className={`glass-card p-3 text-left transition-all ${statusFilter === s.key ? "border-white/25" : ""}`}>
              <div className="text-2xl font-russo" style={{ color: s.color }}>{counts[s.key as keyof Counts]}</div>
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
          <button onClick={() => { setStatusFilter("all"); setNoTgFilter(() => false); }}
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
    </>
  );
}
