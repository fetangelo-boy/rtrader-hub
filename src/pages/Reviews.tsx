import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { reviewsData } from "@/data/reviews";

const TG_URL = "https://t.me/RTrader11";
const REVIEWS_API_URL = "https://functions.poehali.dev/e24a5560-b208-4c16-96e6-99c45f3e905e";

interface ReviewFormData {
  name: string;
  status: string;
  text: string;
}

export default function Reviews() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>({ name: "", status: "", text: "" });
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.text.trim()) return;
    setFormState("loading");
    try {
      const res = await fetch(REVIEWS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormState("success");
        setFormData({ name: "", status: "", text: "" });
      } else {
        setFormState("error");
      }
    } catch {
      setFormState("error");
    }
  };

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
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#4169FF] flex items-center justify-center shadow-lg">
              <Icon name="Star" size={22} className="text-white" />
            </div>
            <div>
              <div className="text-xs text-white/30 uppercase tracking-widest font-semibold">Раздел</div>
              <h1 className="font-russo text-2xl md:text-3xl text-white">{reviewsData.title}</h1>
            </div>
          </div>
          <p className="text-white/50 text-sm">{reviewsData.description}</p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {reviewsData.stats.map((s, i) => (
            <div key={i} className="glass-card p-4 text-center">
              <div className="font-russo text-2xl text-white mb-1">{s.val}</div>
              <div className="text-xs text-white/35">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Отзывы */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
          {reviewsData.items.map((r) => (
            <div key={r.id} className="review-card p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full brand-gradient-bg flex items-center justify-center text-black font-russo text-xs font-black">
                    {r.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white/85">{r.name}</div>
                    <div className="text-xs text-white/35">{r.status}</div>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    r.badge === "vip"
                      ? "bg-[#FF2D78]/15 text-[#FF2D78] border border-[#FF2D78]/30"
                      : "bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/25"
                  }`}
                >
                  {r.badge === "vip" ? "VIP" : "Комьюнити"}
                </span>
              </div>
              <div className="flex gap-0.5">
                {[...Array(r.rating)].map((_, s) => (
                  <Icon key={s} name="Star" size={12} style={{ color: "#FFD700", fill: "#FFD700" }} />
                ))}
              </div>
              <p className="text-white/55 text-sm leading-relaxed font-light flex-1">{r.text}</p>
              <div className="text-xs text-white/25">{r.date}</div>
            </div>
          ))}
        </div>

        {/* Скриншоты */}
        <div className="glass-card p-6 mb-10">
          <div className="text-xs text-white/25 uppercase tracking-widest font-semibold mb-4">Скриншоты из чата</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {reviewsData.screenshots.map((s) => (
              <button
                key={s.id}
                onClick={() => setLightbox(s.id)}
                className="group relative overflow-hidden rounded-xl aspect-[4/3] flex items-center justify-center border border-white/8 hover:border-white/20 transition-all"
              >
                {s.src ? (
                  <img src={s.src} alt={s.label} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#9B30FF]/8 to-[#00E5FF]/8" />
                )}
                {!s.src && (
                  <div className="relative z-10 flex flex-col items-center gap-3 text-white/30 group-hover:text-white/60 transition-colors">
                    <Icon name="MessageSquare" size={32} />
                    <span className="text-xs font-semibold">{s.label}</span>
                    <span className="text-xs opacity-60">Скоро будет добавлен</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Форма отзыва */}
        <div className="glass-card p-6 md:p-8">
          <div className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-2">Оставить отзыв</div>
          <h2 className="font-russo text-xl text-white mb-6">Поделись своим опытом</h2>

          {formState === "success" ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <Icon name="CheckCircle" size={28} className="text-green-400" />
              </div>
              <div className="font-russo text-lg text-white mb-2">Спасибо!</div>
              <p className="text-white/45 text-sm">Твой отзыв отправлен и появится после модерации.</p>
              <button onClick={() => setFormState("idle")} className="neon-btn-outline text-sm px-6 py-2 mt-6">
                Оставить ещё один
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Имя *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Алексей М."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#FFD700]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Статус</label>
                  <input
                    type="text"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    placeholder="Участник комьюнити"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#FFD700]/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Отзыв *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Расскажи о своём опыте в комьюнити RTrader..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#FFD700]/50 transition-colors resize-none"
                />
              </div>
              {formState === "error" && (
                <div className="text-xs text-red-400 flex items-center gap-1.5">
                  <Icon name="AlertCircle" size={12} /> Ошибка при отправке. Попробуй ещё раз.
                </div>
              )}
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={formState === "loading"}
                  className="neon-btn text-sm px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formState === "loading" ? "Отправляю..." : "Отправить отзыв"}
                </button>
                <span className="text-xs text-white/25">Отзыв появится после модерации</span>
              </div>
            </form>
          )}
        </div>

        {/* Лайтбокс */}
        {lightbox !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <div className="glass-card p-8 max-w-lg w-full text-center" onClick={(e) => e.stopPropagation()}>
              <div className="text-white/40 text-sm mb-4">Скриншот #{lightbox}</div>
              <div className="aspect-[4/3] bg-gradient-to-br from-[#9B30FF]/10 to-[#00E5FF]/10 rounded-xl flex items-center justify-center mb-4">
                <div className="flex flex-col items-center gap-3 text-white/30">
                  <Icon name="MessageSquare" size={48} />
                  <span className="text-sm">Место для скриншота из чата</span>
                </div>
              </div>
              <button onClick={() => setLightbox(null)} className="neon-btn-outline text-sm px-6 py-2">
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}