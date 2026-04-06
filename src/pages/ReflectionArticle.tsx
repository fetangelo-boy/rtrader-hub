import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/1177521b-9812-4631-b339-b216a5d91c4e";
const TG_URL = "https://t.me/RTrader11";

const TAG_ACCENTS: Record<string, string> = {
  Психология: "#9B30FF", Дисциплина: "#FFD700", Эмоции: "#FF2D78",
};

interface Article {
  id: number; title: string; tag: string; tags: string; read_time: string;
  preview: string; body: string; image_url?: string; created_at: string;
}

export default function ReflectionArticle() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}?section=reflections`)
      .then(r => r.json())
      .then(d => {
        const found = (d.items || []).find((a: Article) => String(a.id) === id);
        if (found) setArticle(found);
        else setNotFound(true);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="neon-grid-bg min-h-screen flex items-center justify-center text-white/30">
      <Icon name="Loader2" size={24} className="animate-spin" />
    </div>
  );

  if (notFound || !article) return (
    <div className="neon-grid-bg min-h-screen flex items-center justify-center flex-col gap-4">
      <div className="text-white/30 text-lg">Статья не найдена</div>
      <Link to="/reflections" className="neon-btn-outline text-sm px-5 py-2">← К рефлексиям</Link>
    </div>
  );

  const tags = (article.tags || article.tag || "").split(",").map(t => t.trim()).filter(Boolean);
  const dateStr = article.created_at ? article.created_at.split("T")[0] : "";
  const accent = TAG_ACCENTS[tags[0]] || "#9B30FF";

  return (
    <div className="neon-grid-bg min-h-screen text-white font-montserrat">
      <nav className="fixed top-0 inset-x-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg brand-gradient-bg flex items-center justify-center shadow-lg">
              <span className="font-russo text-black text-sm font-black">RT</span>
            </div>
            <span className="font-russo text-xl tracking-wider">R<span className="brand-gradient">TRADER</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/reflections" className="text-white/50 hover:text-white text-sm transition-colors flex items-center gap-1.5">
              <Icon name="ArrowLeft" size={14} /> Рефлексии
            </Link>
            <a href={TG_URL} target="_blank" rel="noopener noreferrer" className="neon-btn text-xs px-4 py-2">Telegram</a>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20 container mx-auto px-4 max-w-3xl">
        {/* Обложка */}
        {article.image_url && (
          <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8 border border-white/10">
            <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Мета */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {tags.map(t => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-full font-semibold border"
              style={{ color: TAG_ACCENTS[t] || accent, borderColor: `${TAG_ACCENTS[t] || accent}40`, background: `${TAG_ACCENTS[t] || accent}10` }}>
              {t}
            </span>
          ))}
          <span className="flex items-center gap-1 text-xs text-white/30">
            <Icon name="Clock" size={11} /> {article.read_time}
          </span>
          <span className="text-xs text-white/25">{dateStr}</span>
        </div>

        {/* Заголовок */}
        <h1 className="font-russo text-2xl md:text-3xl text-white leading-tight mb-6">
          {article.title}
        </h1>

        {/* Текст */}
        <div className="text-white/65 text-base leading-relaxed space-y-4">
          {(article.body || article.preview || "").split("\n").map((para, i) =>
            para.trim() ? <p key={i}>{para}</p> : <br key={i} />
          )}
        </div>

        {/* Навигация */}
        <div className="mt-12 pt-8 border-t border-white/8 flex items-center justify-between">
          <Link to="/reflections" className="neon-btn-outline text-sm px-5 py-2 flex items-center gap-2">
            <Icon name="ArrowLeft" size={13} /> Все рефлексии
          </Link>
          <a href={TG_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
            <Icon name="Send" size={14} /> Telegram
          </a>
        </div>
      </div>
    </div>
  );
}
