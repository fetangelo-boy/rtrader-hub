import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { analyticsData } from "@/data/analytics";

const TG_URL = "https://t.me/RTrader11";

export default function Analytics() {
  const [activeCategory, setActiveCategory] = useState("Все");

  const filtered =
    activeCategory === "Все"
      ? analyticsData.ideas
      : analyticsData.ideas.filter((i) => i.category === activeCategory);

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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#FF8C00] flex items-center justify-center shadow-lg">
              <Icon name="TrendingUp" size={22} className="text-black" />
            </div>
            <div>
              <div className="text-xs text-white/30 uppercase tracking-widest font-semibold">Раздел</div>
              <h1 className="font-russo text-2xl md:text-3xl text-white">{analyticsData.title}</h1>
            </div>
          </div>
          <p className="text-white/50 text-sm leading-relaxed max-w-2xl">{analyticsData.description}</p>
        </div>

        {/* Фильтр категорий */}
        <div className="flex flex-wrap gap-2 mb-8">
          {analyticsData.categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-[#FFD700] text-black"
                  : "glass-card text-white/50 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Идеи */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-12">
          {filtered.map((idea) => (
            <div key={idea.id} className="glass-card p-5 flex flex-col gap-3 hover:border-white/20 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs text-white/30 mb-1">{idea.category} · {idea.date}</div>
                  <div className="font-russo text-base text-white leading-tight">{idea.title}</div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0 ${
                    idea.direction === "long"
                      ? "bg-green-500/15 text-green-400 border border-green-500/30"
                      : "bg-red-500/15 text-red-400 border border-red-500/30"
                  }`}
                >
                  {idea.direction === "long" ? "LONG" : "SHORT"}
                </span>
              </div>

              <p className="text-white/45 text-sm leading-relaxed flex-1">{idea.description}</p>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/8">
                <div>
                  <div className="text-xs text-white/30 mb-0.5">Вход</div>
                  <div className="text-xs font-semibold text-white/70">{idea.entry}</div>
                </div>
                <div>
                  <div className="text-xs text-white/30 mb-0.5">Цель</div>
                  <div className="text-xs font-semibold text-green-400">{idea.target}</div>
                </div>
                <div>
                  <div className="text-xs text-white/30 mb-0.5">Стоп</div>
                  <div className="text-xs font-semibold text-red-400">{idea.stop}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/30">Риск: {idea.risk}</span>
                <span className="font-russo text-sm" style={{ color: idea.accent }}>{idea.instrument}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="glass-card p-8 text-center">
          <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Хочешь больше?</div>
          <h2 className="font-russo text-xl text-white mb-3">Закрытые сигналы — в VIP-клубе</h2>
          <p className="text-white/45 text-sm mb-6 max-w-md mx-auto">
            В VIP — торговые сигналы в реальном времени с точными точками входа, целями и стопами.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/vip" className="neon-btn px-6 py-2.5 text-sm">
              Узнать о VIP-клубе
            </Link>
            <a href={TG_URL} target="_blank" rel="noopener noreferrer" className="neon-btn-outline px-6 py-2.5 text-sm">
              Telegram-канал
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
