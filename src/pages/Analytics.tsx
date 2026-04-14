import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import HubNav from "@/components/HubNav";
import { RenderText } from "@/lib/renderText";
import MediaGallery from "@/components/MediaGallery";
import MiniFooter from "@/components/MiniFooter";

const TG_URL = "https://t.me/RTrader11";
const VIP_URL = "/vip";
const API_URL = "https://functions.poehali.dev/1177521b-9812-4631-b339-b216a5d91c4e";

const RISK_COLORS: Record<string, string> = {
  низкий: "#22c55e", средний: "#FFD700", высокий: "#ff4444",
};

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      let id = u.searchParams.get("v");
      if (!id && u.hostname === "youtu.be") id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}?rel=0`;
    }
    if (u.hostname.includes("rutube.ru")) {
      const m = url.match(/rutube\.ru\/(?:video|play\/embed)\/([a-f0-9]+)/i);
      if (m) return `https://rutube.ru/play/embed/${m[1]}/`;
    }
    if (u.hostname.includes("vk.com") && u.pathname.includes("/video")) {
      const m = url.match(/video(-?\d+)_(\d+)/);
      if (m) return `https://vk.com/video_ext.php?oid=${m[1]}&id=${m[2]}&hd=2`;
    }
    return null;
  } catch { return null; }
}

interface MediaItem { type: "image" | "audio" | "video" | "link"; url: string; label?: string; }
interface Item {
  id: number; type: string; instrument: string; title: string; category: string;
  direction: string; entry: string; target: string; stop: string; risk: string;
  description: string; body: string; tags: string; video_url: string;
  image_url: string; media_items: MediaItem[]; created_at: string;
}

// OLD NAV — оставлен для отката:
// const NAV = (<nav className="fixed top-0 inset-x-0 z-50 bg-black/70 ...">...</nav>);

export default function Analytics() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}?section=analytics`)
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = activeType === "all" ? items
    : items.filter(i => (i.type || "signal") === activeType);

  const signals = items.filter(i => (i.type || "signal") === "signal");
  const reviews = items.filter(i => i.type === "review");

  return (
    <div className="neon-grid-bg min-h-screen text-white font-montserrat">
      <HubNav />

      <div className="pt-12 pb-16 container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#FF8C00] flex items-center justify-center shadow-lg flex-shrink-0">
              <Icon name="TrendingUp" size={20} className="text-black" />
            </div>
            <div>
              <h1 className="font-russo text-2xl text-white">Аналитика и торговые идеи</h1>
              <p className="text-white/40 text-xs mt-0.5">
                {signals.length} сигналов · {reviews.length} обзоров
              </p>
            </div>
          </div>
        </div>

        {/* Переключатель типа */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: "all", label: "Все" },
            { key: "signal", label: "Сигналы" },
            { key: "review", label: "Обзоры" },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveType(t.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeType === t.key ? "bg-[#FFD700] text-black" : "glass-card text-white/50 hover:text-white"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30">
            <Icon name="Loader2" size={24} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center text-white/30 text-sm">Записей пока нет</div>
        ) : (
          <div className="flex flex-col gap-4 mb-12">
            {filtered.map(item => {
              const isSignal = (item.type || "signal") === "signal";
              const isOpen = expanded === item.id;
              const dateStr = item.created_at ? item.created_at.split("T")[0] : "";
              const tagList = (item.tags || "").split(",").map(t => t.trim()).filter(Boolean);

              return (
                <div key={item.id} className="glass-card overflow-hidden transition-all hover:border-white/20">
                  {/* Обложка */}
                  {item.image_url && (
                    <div className="w-full overflow-hidden border-b border-white/8">
                      <img src={item.image_url} alt={item.title}
                        className="w-full h-auto max-h-80 object-contain bg-white/3" />
                    </div>
                  )}
                  <div className="p-5">
                    {/* Шапка */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            isSignal ? "bg-green-500/15 text-green-400" : "bg-[#FFD700]/15 text-[#FFD700]"
                          }`}>
                            {isSignal ? "СИГНАЛ" : "ОБЗОР"}
                          </span>
                          {isSignal && item.instrument && (
                            <span className="font-russo text-sm text-[#FFD700]">{item.instrument}</span>
                          )}
                          {isSignal && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                              item.direction === "long"
                                ? "bg-green-500/10 text-green-400 border-green-500/30"
                                : "bg-red-500/10 text-red-400 border-red-500/30"
                            }`}>
                              {item.direction?.toUpperCase()}
                            </span>
                          )}
                          {tagList.map(t => (
                            <span key={t} className="text-xs px-1.5 py-0.5 rounded-md bg-white/5 text-white/40">{t}</span>
                          ))}
                          <span className="text-xs text-white/25">{dateStr}</span>
                        </div>
                        <h3 className="font-russo text-base text-white leading-tight">{item.title}</h3>
                      </div>
                    </div>

                    {/* Точки сигнала */}
                    {isSignal && (
                      <div className="grid grid-cols-3 gap-3 mb-3 p-3 bg-white/3 rounded-xl border border-white/8">
                        <div>
                          <div className="text-xs text-white/30 mb-0.5">Вход</div>
                          <div className="text-sm font-semibold text-white/80">{item.entry || "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/30 mb-0.5">Цель</div>
                          <div className="text-sm font-semibold text-green-400">{item.target || "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/30 mb-0.5">Стоп</div>
                          <div className="text-sm font-semibold text-red-400">{item.stop || "—"}</div>
                        </div>
                      </div>
                    )}

                    {/* Краткое описание */}
                    {(item.description || (isSignal ? "" : item.body)) && (
                      <div className="mb-3">
                        {isSignal ? (
                          <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
                        ) : !isOpen && (
                          <p className="text-white/50 text-sm leading-relaxed line-clamp-3">{item.body}</p>
                        )}
                      </div>
                    )}

                    {/* Видео-плеер */}
                    {!isSignal && isOpen && item.video_url && (() => {
                      const embed = getEmbedUrl(item.video_url);
                      return embed ? (
                        <div className="mb-4 rounded-xl overflow-hidden border border-white/10 bg-black/30 aspect-video">
                          <iframe src={embed} className="w-full h-full" allow="clipboard-write; autoplay; fullscreen" allowFullScreen style={{ border: "none" }} />
                        </div>
                      ) : (
                        <div className="mb-4">
                          <a href={item.video_url} target="_blank" rel="noopener noreferrer"
                            className="text-sm flex items-center gap-2 text-[#FFD700]/70 hover:text-[#FFD700] transition-colors">
                            <Icon name="Play" size={14} /> Смотреть видео
                          </a>
                        </div>
                      );
                    })()}

                    {/* Полный текст обзора */}
                    {!isSignal && item.body && isOpen && (
                      <div className="mb-4 pt-3 border-t border-white/8">
                        <RenderText text={item.body} accent="#FFD700" className="text-white/60 text-sm" />
                      </div>
                    )}

                    {/* Футер */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/8">
                      <div className="flex items-center gap-3">
                        {isSignal && item.risk && (
                          <span className="text-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full inline-block"
                              style={{ background: RISK_COLORS[item.risk] || "#FFD700" }} />
                            <span className="text-white/40">Риск: {item.risk}</span>
                          </span>
                        )}
                      </div>
                      {!isSignal && (item.body || (item.media_items && item.media_items.length > 0) || item.video_url) && (
                        <button onClick={() => setExpanded(isOpen ? null : item.id)}
                          className="text-xs flex items-center gap-1 text-[#FFD700]/70 hover:text-[#FFD700] transition-colors font-semibold">
                          {isOpen ? "Свернуть" : "Смотреть / читать"}
                          <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="glass-card p-8 text-center">
          <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Хочешь больше?</div>
          <h2 className="font-russo text-xl text-white mb-3">Закрытые сигналы — в VIP-клубе</h2>
          <p className="text-white/45 text-sm mb-6 max-w-md mx-auto">
            В VIP — торговые сигналы в реальном времени с точными точками входа, целями и стопами.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={VIP_URL} className="neon-btn px-6 py-2.5 text-sm">Узнать о VIP-клубе</Link>
            <a href={TG_URL} target="_blank" rel="noopener noreferrer" className="neon-btn-outline px-6 py-2.5 text-sm">Telegram-канал</a>
          </div>
        </div>
      </div>
      <MiniFooter />
    </div>
  );
}