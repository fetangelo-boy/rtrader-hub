import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { RenderText } from "@/lib/renderText";

const API_URL = "https://functions.poehali.dev/1177521b-9812-4631-b339-b216a5d91c4e";

const STATUS_META: Record<string, { label: string; color: string }> = {
  active:   { label: "Идёт сейчас", color: "#22c55e" },
  upcoming: { label: "Скоро",        color: "#FFD700" },
  finished: { label: "Завершён",     color: "#9ca3af" },
};

interface Item {
  id: number; name: string; status: string; start_date: string; end_date: string;
  instrument: string; description: string; body: string; tags: string;
  video_url: string; prize: string; participants: number; winner: string;
  result: string; image_url: string; created_at: string;
}

export default function Tournaments() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}?section=tournaments`)
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = activeStatus === "all" ? items
    : items.filter(i => i.status === activeStatus);

  const fmtDate = (d: string) => d ? d.split("T")[0].split("-").reverse().join(".") : "";

  return (
    <div className="neon-grid-bg min-h-screen text-white font-montserrat">
      <nav className="fixed top-0 inset-x-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg brand-gradient-bg flex items-center justify-center shadow-lg">
              <span className="font-russo text-black text-xs font-black">RT</span>
            </div>
            <span className="font-russo text-lg tracking-wider hidden sm:block">R<span className="brand-gradient">TRADER</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-white/50 hover:text-white text-sm transition-colors flex items-center gap-1.5">
              <Icon name="ArrowLeft" size={14} /> <span className="hidden sm:inline">На главную</span>
            </Link>
            <a href="https://t.me/RTrader11" target="_blank" rel="noopener noreferrer" className="neon-btn text-xs px-3 py-1.5">TG</a>
          </div>
        </div>
      </nav>

      <div className="pt-20 pb-16 container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF8C00] to-[#FF2D78] flex items-center justify-center shadow-lg flex-shrink-0">
              <Icon name="Trophy" size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-russo text-2xl text-white">Конкурсы и турниры</h1>
              <p className="text-white/40 text-xs mt-0.5">{items.length} конкурсов</p>
            </div>
          </div>
        </div>

        {/* Фильтр статуса */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: "all", label: "Все", color: "" },
            { key: "active", label: "Идёт сейчас", color: "#22c55e" },
            { key: "upcoming", label: "Скоро", color: "#FFD700" },
            { key: "finished", label: "Завершённые", color: "#9ca3af" },
          ].map(f => (
            <button key={f.key} onClick={() => setActiveStatus(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeStatus === f.key
                  ? f.color ? "" : "bg-[#FFD700] text-black"
                  : "glass-card text-white/50 hover:text-white"
              }`}
              style={activeStatus === f.key && f.color ? {
                background: `${f.color}20`, color: f.color, border: `1px solid ${f.color}40`
              } : {}}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30">
            <Icon name="Loader2" size={24} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center text-white/30 text-sm">Конкурсов пока нет</div>
        ) : (
          <div className="flex flex-col gap-4 mb-12">
            {filtered.map(item => {
              const isOpen = expanded === item.id;
              const st = STATUS_META[item.status] || STATUS_META.upcoming;
              const tagList = (item.tags || "").split(",").map(t => t.trim()).filter(Boolean);

              return (
                <div key={item.id} className="glass-card overflow-hidden hover:border-white/20 transition-all">
                  {/* Обложка */}
                  {item.image_url && (
                    <div className="w-full overflow-hidden border-b border-white/8">
                      <img src={item.image_url} alt={item.name}
                        className="w-full h-auto max-h-60 object-contain bg-white/3" />
                    </div>
                  )}
                  <div className="p-5">
                    {/* Шапка */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border"
                          style={{ color: st.color, borderColor: `${st.color}40`, background: `${st.color}10` }}>
                          {st.label}
                        </span>
                        {tagList.map(t => (
                          <span key={t} className="text-xs px-1.5 py-0.5 rounded-md bg-white/5 text-white/40">{t}</span>
                        ))}
                        {item.video_url && (
                          <a href={item.video_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs flex items-center gap-1 text-[#FFD700]/60 hover:text-[#FFD700] transition-colors">
                            <Icon name="Play" size={10} /> Видео
                          </a>
                        )}
                      </div>
                      <h3 className="font-russo text-lg text-white leading-tight">{item.name}</h3>
                    </div>

                    {/* Мета-поля */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 p-3 bg-white/3 rounded-xl border border-white/8">
                      {item.start_date && (
                        <div>
                          <div className="text-xs text-white/30 mb-0.5">Начало</div>
                          <div className="text-sm font-semibold text-white/70">{fmtDate(item.start_date)}</div>
                        </div>
                      )}
                      {item.end_date && (
                        <div>
                          <div className="text-xs text-white/30 mb-0.5">Конец</div>
                          <div className="text-sm font-semibold text-white/70">{fmtDate(item.end_date)}</div>
                        </div>
                      )}
                      {item.prize && (
                        <div>
                          <div className="text-xs text-white/30 mb-0.5">Приз</div>
                          <div className="text-sm font-semibold text-[#FFD700]">{item.prize}</div>
                        </div>
                      )}
                      {item.instrument && (
                        <div>
                          <div className="text-xs text-white/30 mb-0.5">Инструменты</div>
                          <div className="text-sm font-semibold text-white/70">{item.instrument}</div>
                        </div>
                      )}
                    </div>

                    {/* Победитель */}
                    {item.status === "finished" && item.winner && (
                      <div className="flex items-center gap-2 mb-3 p-3 bg-[#FFD700]/5 rounded-xl border border-[#FFD700]/20">
                        <Icon name="Trophy" size={14} className="text-[#FFD700] flex-shrink-0" />
                        <span className="text-sm text-white/70">
                          Победитель: <span className="text-[#FFD700] font-semibold">{item.winner}</span>
                          {item.result && <span className="text-green-400 ml-1.5">({item.result})</span>}
                        </span>
                      </div>
                    )}

                    {/* Описание */}
                    {item.description && !isOpen && (
                      <p className="text-white/50 text-sm leading-relaxed mb-3 line-clamp-2">{item.description}</p>
                    )}

                    {/* Полный текст */}
                    {isOpen && (
                      <div className="mb-4 pt-3 border-t border-white/8">
                        {item.description && (
                          <p className="text-white/60 text-sm leading-relaxed mb-4 italic">{item.description}</p>
                        )}
                        {item.body && (
                          <RenderText text={item.body} accent="#FFD700" className="text-white/60 text-sm" />
                        )}
                      </div>
                    )}

                    {/* Футер */}
                    {(item.body || item.description) && (
                      <div className="flex justify-end pt-2 border-t border-white/8">
                        <button onClick={() => setExpanded(isOpen ? null : item.id)}
                          className="text-xs flex items-center gap-1 text-[#FFD700]/60 hover:text-[#FFD700] transition-colors font-semibold">
                          {isOpen ? "Свернуть" : "Подробнее"}
                          <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}


      </div>
    </div>
  );
}