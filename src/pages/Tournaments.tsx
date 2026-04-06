import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { tournamentsData } from "@/data/tournaments";

const TG_URL = "https://t.me/RTrader11";

export default function Tournaments() {
  return (
    <div className="neon-grid-bg min-h-screen text-white font-montserrat">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg brand-gradient-bg flex items-center justify-center shadow-lg">
              <span className="font-russo text-black text-sm font-black">RT</span>
            </div>
            <span className="font-russo text-xl tracking-wider">
              R<span className="brand-gradient">TRADER</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-white/50 hover:text-white text-sm transition-colors flex items-center gap-1.5">
              <Icon name="ArrowLeft" size={14} /> На главную
            </Link>
            <a href={TG_URL} target="_blank" rel="noopener noreferrer" className="neon-btn text-xs px-4 py-2">
              Telegram
            </a>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF8C00] to-[#FF2D78] flex items-center justify-center shadow-lg">
              <Icon name="Trophy" size={22} className="text-white" />
            </div>
            <div>
              <div className="text-xs text-white/30 uppercase tracking-widest font-semibold">Раздел</div>
              <h1 className="font-russo text-2xl md:text-3xl text-white">{tournamentsData.title}</h1>
            </div>
          </div>
          <p className="text-white/50 text-sm leading-relaxed max-w-2xl">{tournamentsData.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Текущие турниры */}
            <div>
              <div className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-4">Актуальные турниры</div>
              <div className="flex flex-col gap-4">
                {tournamentsData.current.map((t) => (
                  <div key={t.id} className="glass-card p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-russo text-base text-white mb-1">{t.name}</h3>
                        <div className="text-xs text-white/40">{t.instrument}</div>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${
                          t.status === "active"
                            ? "bg-green-500/15 text-green-400 border border-green-500/30"
                            : "bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30"
                        }`}
                      >
                        {t.status === "active" ? "Идёт" : "Скоро"}
                      </span>
                    </div>
                    <p className="text-white/45 text-sm mb-4">{t.description}</p>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center">
                        <div className="text-xs text-white/30 mb-1">Участников</div>
                        <div className="font-russo text-white">{t.participants || "—"}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-white/30 mb-1">Старт</div>
                        <div className="text-xs text-white/70">{t.startDate}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-white/30 mb-1">Финиш</div>
                        <div className="text-xs text-white/70">{t.endDate}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/8">
                      <div className="flex items-center gap-1.5 text-xs text-white/40">
                        <Icon name="Gift" size={12} style={{ color: t.accent }} />
                        {t.prize}
                      </div>
                      <a
                        href={TG_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold flex items-center gap-1"
                        style={{ color: t.accent }}
                      >
                        Участвовать <Icon name="ArrowRight" size={11} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Прошлые турниры */}
            <div>
              <div className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-4">История турниров</div>
              <div className="glass-card overflow-hidden">
                {tournamentsData.past.map((p, i) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-4 ${
                      i !== tournamentsData.past.length - 1 ? "border-b border-white/8" : ""
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-white/70">{p.name}</div>
                      <div className="text-xs text-white/30">{p.date} · {p.participants} участников</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/30 mb-0.5">Победитель</div>
                      <div className="text-sm font-semibold text-[#FFD700]">{p.winner}</div>
                      <div className="text-xs text-green-400 font-bold">{p.result}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Правая колонка — Лидерборд */}
          <div>
            <div className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-4">Текущий рейтинг</div>
            <div className="glass-card overflow-hidden">
              {tournamentsData.leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 p-3.5 ${
                    entry.rank < tournamentsData.leaderboard.length ? "border-b border-white/8" : ""
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-russo text-sm flex-shrink-0 ${
                      entry.rank === 1
                        ? "bg-[#FFD700] text-black"
                        : entry.rank === 2
                        ? "bg-white/20 text-white"
                        : entry.rank === 3
                        ? "bg-[#FF8C00]/40 text-[#FF8C00]"
                        : "bg-white/8 text-white/40"
                    }`}
                  >
                    {entry.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white/80 truncate">{entry.name}</div>
                    <div className="text-xs text-white/30">{entry.trades} сделок</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-green-400">{entry.result}</div>
                    <span className={`text-xs ${entry.badge === "vip" ? "text-[#FF2D78]" : "text-[#00E5FF]"}`}>
                      {entry.badge === "vip" ? "VIP" : "Участник"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
