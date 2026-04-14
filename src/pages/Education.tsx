import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { RenderText } from "@/lib/renderText";
import HubNav from "@/components/HubNav";
import MediaGallery from "@/components/MediaGallery";
import MiniFooter from "@/components/MiniFooter";

const TG_URL = "https://t.me/RTrader11";
const VIP_URL = "/vip";
const API_URL = "https://functions.poehali.dev/1177521b-9812-4631-b339-b216a5d91c4e";

const LEVEL_COLORS: Record<string, string> = {
  Начинающий: "#22c55e", Средний: "#FFD700", Продвинутый: "#9B30FF", Любой: "#38BDF8",
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
  id: number; number: string; title: string; description: string;
  body: string; lessons: number; duration: string; level: string;
  topics: string; tags: string; video_url: string; image_url: string;
  media_items: MediaItem[]; is_free: boolean; created_at: string;
}

export default function Education() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}?section=education`)
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = activeFilter === "all" ? items
    : activeFilter === "free" ? items.filter(i => i.is_free)
    : items.filter(i => !i.is_free);

  return (
    <div className="neon-grid-bg min-h-screen text-white font-montserrat">
      {/* OLD NAV — для отката раскомментируй и убери HubNav */}
      <HubNav />

      <div className="pt-12 pb-16 container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#38BDF8] to-[#9B30FF] flex items-center justify-center shadow-lg flex-shrink-0">
              <Icon name="BookOpen" size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-russo text-2xl text-white">Обучение</h1>
              <p className="text-white/40 text-xs mt-0.5">{items.length} материалов</p>
            </div>
          </div>
        </div>

        {/* Фильтр */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "all", label: "Все" },
            { key: "free", label: "Бесплатно" },
            { key: "vip", label: "VIP" },
          ].map(f => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeFilter === f.key ? "bg-[#38BDF8] text-black" : "glass-card text-white/50 hover:text-white"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30">
            <Icon name="Loader2" size={24} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center text-white/30 text-sm">Материалов пока нет</div>
        ) : (
          <div className="flex flex-col gap-4 mb-12">
            {filtered.map(item => {
              const isOpen = expanded === item.id;
              const accent = LEVEL_COLORS[item.level] || "#38BDF8";
              const tagList = (item.tags || "").split(",").map(t => t.trim()).filter(Boolean);

              return (
                <div key={item.id} className="glass-card overflow-hidden hover:border-white/20 transition-all">
                  {/* Обложка */}
                  {item.image_url && (
                    <div className="w-full overflow-hidden border-b border-white/8">
                      <img src={item.image_url} alt={item.title}
                        className="w-full h-auto max-h-60 object-contain bg-white/3" />
                    </div>
                  )}
                  <div className="p-5">
                    {/* Шапка */}
                    <div className="flex items-start gap-3 mb-3">
                      {item.number && (
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/10 font-mono text-xs text-white/40">
                          {item.number}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            item.is_free ? "bg-green-500/15 text-green-400" : "bg-[#9B30FF]/15 text-[#9B30FF]"
                          }`}>
                            {item.is_free ? "Бесплатно" : "VIP"}
                          </span>
                          {item.level && (
                            <span className="text-xs px-2 py-0.5 rounded-full border font-semibold"
                              style={{ color: accent, borderColor: `${accent}40`, background: `${accent}10` }}>
                              {item.level}
                            </span>
                          )}
                          {item.duration && (
                            <span className="text-xs text-white/30 flex items-center gap-1">
                              <Icon name="Clock" size={10} /> {item.duration}
                            </span>
                          )}
                          {tagList.map(t => (
                            <span key={t} className="text-xs px-1.5 py-0.5 rounded-md bg-white/5 text-white/40">{t}</span>
                          ))}
                        </div>
                        <h3 className="font-russo text-base text-white leading-tight">{item.title}</h3>
                      </div>
                    </div>

                    {/* Описание / тело */}
                    {item.description && !isOpen && (
                      <p className="text-white/50 text-sm leading-relaxed mb-3 line-clamp-3">{item.description}</p>
                    )}
                    {isOpen && (
                      <div className="mb-4 pt-3 border-t border-white/8">
                        {item.description && (
                          <p className="text-white/60 text-sm leading-relaxed mb-4 italic">{item.description}</p>
                        )}
                        {item.body && (
                          <RenderText text={item.body} accent={accent} className="text-white/60 text-sm" />
                        )}
                      </div>
                    )}

                    {/* Видео-плеер */}
                    {isOpen && item.video_url && (() => {
                      const embed = getEmbedUrl(item.video_url);
                      return embed ? (
                        <div className="mb-4 rounded-xl overflow-hidden border border-white/10 bg-black/30 aspect-video">
                          <iframe src={embed} className="w-full h-full" allow="clipboard-write; autoplay; fullscreen" allowFullScreen style={{ border: "none" }} />
                        </div>
                      ) : (
                        <div className="mb-4">
                          <a href={item.video_url} target="_blank" rel="noopener noreferrer"
                            className="text-sm flex items-center gap-2 transition-colors" style={{ color: accent }}>
                            <Icon name="Play" size={14} /> Смотреть видео
                          </a>
                        </div>
                      );
                    })()}

                    {/* Медиа */}
                    {isOpen && item.media_items && item.media_items.length > 0 && (
                      <MediaGallery items={item.media_items} />
                    )}

                    {/* Футер */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/8">
                      <div className="flex items-center gap-3">
                        {item.lessons > 0 && (
                          <span className="text-xs text-white/30">{item.lessons} уроков</span>
                        )}
                      </div>
                      {(item.body || item.description || item.video_url) && (
                        <button onClick={() => setExpanded(isOpen ? null : item.id)}
                          className="text-xs flex items-center gap-1 font-semibold transition-colors"
                          style={{ color: `${accent}99` }}
                          onMouseOver={e => (e.currentTarget.style.color = accent)}
                          onMouseOut={e => (e.currentTarget.style.color = `${accent}99`)}>
                          {isOpen ? "Свернуть" : "Смотреть"}
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
          <h2 className="font-russo text-xl text-white mb-3">Полный курс — в VIP-клубе</h2>
          <p className="text-white/45 text-sm mb-6 max-w-md mx-auto">
            В VIP-клубе — все обучающие материалы, разборы сделок и персональная поддержка.
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