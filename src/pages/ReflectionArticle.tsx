import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { RenderText } from "@/lib/renderText";
import HubNav from "@/components/HubNav";
import MediaGallery from "@/components/MediaGallery";
import MiniFooter from "@/components/MiniFooter";

const API_URL = "https://functions.poehali.dev/1177521b-9812-4631-b339-b216a5d91c4e";
const TG_URL = "https://t.me/RTrader11";

const TAG_ACCENTS: Record<string, string> = {
  Психология: "#9B30FF", Дисциплина: "#FFD700", Эмоции: "#FF2D78",
};

interface MediaItem { type: "image" | "audio" | "video" | "link"; url: string; label?: string; }
interface Article {
  id: number; title: string; tag: string; tags: string; read_time: string;
  preview: string; body: string; image_url?: string; media_items?: MediaItem[]; created_at: string;
}

export default function ReflectionArticle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const goToTag = (tag: string) => {
    navigate(`/reflections?tag=${encodeURIComponent(tag)}`);
  };

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
  const bodyText = article.body || article.preview || "";

  return (
    <div className="neon-grid-bg min-h-screen text-white font-montserrat">
      {/* OLD NAV — для отката раскомментируй и убери HubNav */}
      <HubNav />

      <div className="pt-12 pb-20 container mx-auto px-4 max-w-2xl">
        {/* Обложка — object-contain чтобы не обрезать */}
        {article.image_url && (
          <div className="w-full rounded-2xl overflow-hidden mb-8 border border-white/10 bg-white/3 flex items-center justify-center">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-auto max-h-[480px] object-contain"
            />
          </div>
        )}

        {/* Мета */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {tags.map(t => (
            <button key={t} type="button" onClick={() => goToTag(t)}
              className="text-xs px-2.5 py-1 rounded-full font-semibold border hover:opacity-80 transition-opacity"
              style={{ color: TAG_ACCENTS[t] || accent, borderColor: `${TAG_ACCENTS[t] || accent}40`, background: `${TAG_ACCENTS[t] || accent}10` }}>
              {t}
            </button>
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

        {/* Текст с ссылками и хэштегами */}
        <RenderText
          text={bodyText}
          onTag={goToTag}
          accent={accent}
          className="text-white/65 text-base"
        />

        {/* Медиа-материалы */}
        {article.media_items && article.media_items.length > 0 && (
          <div className="mt-8">
            <MediaGallery items={article.media_items} />
          </div>
        )}

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
      <MiniFooter />
    </div>
  );
}