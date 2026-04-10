import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import HubNav from "@/components/HubNav";
import MiniFooter from "@/components/MiniFooter";

const API_URL = "https://functions.poehali.dev/1177521b-9812-4631-b339-b216a5d91c4e";

const TAGS = ["Все", "Психология", "Дисциплина", "Эмоции"];
const TAG_ACCENTS: Record<string, string> = {
  Психология: "#9B30FF", Дисциплина: "#FFD700", Эмоции: "#FF2D78",
};

interface Article {
  id: number; title: string; tag: string; tags: string; read_time: string;
  preview: string; image_url?: string; created_at: string;
}

interface Cta {
  eyebrow: string; title: string; text: string; btn: string; url: string;
}

export default function Reflections() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [cta, setCta] = useState<Cta>({ eyebrow: "", title: "", text: "", btn: "", url: "" });
  const [searchParams] = useSearchParams();
  const urlTag = searchParams.get("tag");
  const [activeTag, setActiveTag] = useState(urlTag && TAGS.includes(urlTag) ? urlTag : "Все");

  useEffect(() => {
    fetch(`${API_URL}?section=reflections`)
      .then(r => r.json())
      .then(d => { setArticles(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));

    fetch(`${API_URL}?section=author`)
      .then(r => r.json())
      .then(d => {
        if (d.item) {
          setCta({
            eyebrow: d.item.reflections_cta_eyebrow || "",
            title:   d.item.reflections_cta_title   || "",
            text:    d.item.reflections_cta_text     || "",
            btn:     d.item.reflections_cta_btn      || "",
            url:     d.item.reflections_cta_url      || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  const filtered = activeTag === "Все"
    ? articles
    : articles.filter(a => {
        const allTags = (a.tags || a.tag || "").split(",").map((t: string) => t.trim());
        return allTags.includes(activeTag);
      });

  return (
    <div className="neon-grid-bg min-h-screen text-white font-montserrat">
      {/* OLD NAV — для отката раскомментируй и убери HubNav */}
      <HubNav />

      <div className="pt-12 pb-16 container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9B30FF] to-[#FF2D78] flex items-center justify-center shadow-lg flex-shrink-0">
              <Icon name="Brain" size={20} className="text-white" />
            </div>
            <div>
              <div className="text-xs text-white/30 uppercase tracking-widest font-semibold">Раздел</div>
              <h1 className="font-russo text-2xl text-white">Рефлексии трейдера</h1>
            </div>
          </div>
          <p className="text-white/50 text-sm leading-relaxed max-w-2xl">
            Психология, дисциплина и работа с собой — то, о чём не говорят в учебниках.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {TAGS.map(tag => (
            <button key={tag} onClick={() => setActiveTag(tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTag === tag ? "bg-[#9B30FF] text-white" : "glass-card text-white/50 hover:text-white"
              }`}>
              {tag}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-white/30 text-sm py-12 justify-center">
            <Icon name="Loader2" size={16} className="animate-spin" /> Загружаю...
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center text-white/30 text-sm">
            Материалов пока нет — скоро появятся
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {filtered.map(article => {
              const tagList = (article.tags || article.tag || "").split(",").map((t: string) => t.trim()).filter(Boolean);
              const accent = TAG_ACCENTS[tagList[0]] || "#9B30FF";
              const dateStr = article.created_at ? article.created_at.split("T")[0] : "";
              return (
                <Link key={article.id} to={`/reflections/${article.id}`}
                  className="glass-card flex flex-col gap-0 hover:border-white/20 transition-all group overflow-hidden">
                  {article.image_url && (
                    <div className="w-full h-40 overflow-hidden flex-shrink-0">
                      <img src={article.image_url} alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex gap-1.5 flex-wrap">
                        {tagList.map(t => (
                          <span key={t} className="text-xs px-2.5 py-0.5 rounded-full font-semibold border"
                            style={{ color: TAG_ACCENTS[t] || accent, borderColor: `${TAG_ACCENTS[t] || accent}40`, background: `${TAG_ACCENTS[t] || accent}10` }}>
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-white/30">
                        <Icon name="Clock" size={11} /> {article.read_time}
                      </div>
                    </div>
                    <h3 className="font-russo text-base text-white leading-tight">{article.title}</h3>
                    <p className="text-white/45 text-sm leading-relaxed flex-1 line-clamp-3">{article.preview}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/8">
                      <span className="text-xs text-white/30">{dateStr}</span>
                      <span className="text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all"
                        style={{ color: accent }}>
                        Читать <Icon name="ArrowRight" size={11} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA-блок — только если заполнен через CMS */}
        {(cta.title || cta.btn) && (
          <div className="glass-card px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div className="flex-1 min-w-0">
              {cta.eyebrow && (
                <div className="text-xs text-white/30 uppercase tracking-widest mb-0.5">{cta.eyebrow}</div>
              )}
              {cta.title && (
                <div className="font-russo text-base text-white leading-tight">{cta.title}</div>
              )}
              {cta.text && (
                <p className="text-white/45 text-xs mt-1 leading-relaxed">{cta.text}</p>
              )}
            </div>
            {cta.btn && cta.url && (
              <a href={cta.url}
                target={cta.url.startsWith("http") ? "_blank" : undefined}
                rel={cta.url.startsWith("http") ? "noopener noreferrer" : undefined}
                className="neon-btn text-xs px-5 py-2 whitespace-nowrap flex-shrink-0">
                {cta.btn}
              </a>
            )}
          </div>
        )}
      </div>
      <MiniFooter />
    </div>
  );
}