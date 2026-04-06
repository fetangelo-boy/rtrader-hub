import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { reflectionsData } from "@/data/reflections";

const TG_URL = "https://t.me/RTrader11";

export default function Reflections() {
  const [activeTag, setActiveTag] = useState("Все");

  const filtered =
    activeTag === "Все"
      ? reflectionsData.articles
      : reflectionsData.articles.filter((a) => a.tag === activeTag);

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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9B30FF] to-[#FF2D78] flex items-center justify-center shadow-lg">
              <Icon name="Brain" size={22} className="text-white" />
            </div>
            <div>
              <div className="text-xs text-white/30 uppercase tracking-widest font-semibold">Раздел</div>
              <h1 className="font-russo text-2xl md:text-3xl text-white">{reflectionsData.title}</h1>
            </div>
          </div>
          <p className="text-white/50 text-sm leading-relaxed max-w-2xl">{reflectionsData.description}</p>
        </div>

        {/* Теги */}
        <div className="flex flex-wrap gap-2 mb-8">
          {reflectionsData.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTag === tag
                  ? "bg-[#9B30FF] text-white"
                  : "glass-card text-white/50 hover:text-white"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Статьи */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-12">
          {filtered.map((article) => (
            <div
              key={article.id}
              className="glass-card p-6 flex flex-col gap-3 cursor-pointer hover:border-white/20 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-semibold border"
                  style={{
                    color: article.accent,
                    borderColor: `${article.accent}40`,
                    background: `${article.accent}10`,
                  }}
                >
                  {article.tag}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-white/30">
                  <Icon name="Clock" size={11} />
                  {article.readTime}
                </div>
              </div>

              <h3 className="font-russo text-base text-white leading-tight group-hover:text-white transition-colors">
                {article.title}
              </h3>

              <p className="text-white/45 text-sm leading-relaxed flex-1">{article.preview}</p>

              <div className="flex items-center justify-between pt-2 border-t border-white/8">
                <span className="text-xs text-white/30">{article.date}</span>
                <span
                  className="text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all"
                  style={{ color: article.accent }}
                >
                  Читать <Icon name="ArrowRight" size={11} />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="glass-card p-8 text-center">
          <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Больше материалов</div>
          <h2 className="font-russo text-xl text-white mb-3">Подпишись на Telegram</h2>
          <p className="text-white/45 text-sm mb-6 max-w-md mx-auto">
            Новые статьи о психологии и дисциплине — в Telegram-канале RTrader.
          </p>
          <a href={TG_URL} target="_blank" rel="noopener noreferrer" className="neon-btn px-6 py-2.5 text-sm inline-flex items-center gap-2">
            <Icon name="Send" size={14} /> Перейти в Telegram
          </a>
        </div>
      </div>
    </div>
  );
}
