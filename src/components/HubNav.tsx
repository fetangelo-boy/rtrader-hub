import { Link, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

const SECTIONS = [
  { label: "Комьюнити",  href: "/community",    icon: "Users",     accent: "#00E5FF" },
  { label: "Аналитика",  href: "/analytics",    icon: "TrendingUp",accent: "#FFD700" },
  { label: "Рефлексии",  href: "/reflections",  icon: "Brain",     accent: "#9B30FF" },
  { label: "Конкурсы",   href: "/tournaments",  icon: "Trophy",    accent: "#FF8C00" },
  { label: "VIP-клуб",   href: "/vip",          icon: "Crown",     accent: "#FF2D78" },
  { label: "Обучение",   href: "/education",    icon: "BookOpen",  accent: "#4169FF" },
  { label: "Отзывы",     href: "/reviews",      icon: "Star",      accent: "#FFD700" },
];

export default function HubNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isAdmin = !!user && (user.role === "owner" || user.role === "admin");

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-screen-xl mx-auto px-4 h-12 flex items-center justify-between gap-2">

        {/* Логотип */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="w-7 h-7 rounded-lg brand-gradient-bg flex items-center justify-center shadow-lg">
            <span className="font-russo text-black text-[10px] font-black">RT</span>
          </div>
          <span className="font-russo text-sm tracking-wider hidden sm:block">
            R<span className="brand-gradient">TRADER</span>
          </span>
        </Link>

        {/* Разделы */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 justify-center px-2">
          {SECTIONS.map((s) => {
            const active = pathname.startsWith(s.href);
            return (
              <Link
                key={s.href}
                to={s.href}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0"
                style={{
                  color: active ? s.accent : "rgba(255,255,255,0.5)",
                  background: active ? `${s.accent}18` : "transparent",
                  border: `1px solid ${active ? s.accent + "55" : "transparent"}`,
                  boxShadow: active ? `0 0 8px ${s.accent}33` : "none",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = s.accent;
                    (e.currentTarget as HTMLElement).style.background = `${s.accent}10`;
                    (e.currentTarget as HTMLElement).style.border = `1px solid ${s.accent}33`;
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.border = "1px solid transparent";
                  }
                }}
              >
                <Icon name={s.icon as Parameters<typeof Icon>[0]["name"]} size={11} />
                {s.label}
              </Link>
            );
          })}
        </div>

        {/* Правые кнопки */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isAdmin && (
            <Link
              to="/rt-manage"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border border-[#FFD700]/30 text-[#FFD700]/70 hover:text-[#FFD700] hover:border-[#FFD700]/60 bg-[#FFD700]/5 transition-all duration-200"
              title="Панель управления"
            >
              <Icon name="Shield" size={11} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          <a

            href="https://t.me/RTrader11"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border border-white/15 text-white/50 hover:text-white hover:border-white/30 transition-all duration-200"
          >
            <Icon name="Send" size={12} />
            <span className="hidden sm:inline">TG</span>
          </a>
          <Link
            to="/club"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#FFD700]/40 text-[#FFD700] bg-[#FFD700]/5 hover:bg-[#FFD700]/15 hover:border-[#FFD700]/70 hover:shadow-[0_0_10px_rgba(255,215,0,0.25)] transition-all duration-200"
          >
            <Icon name="Crown" size={12} />
            <span className="hidden sm:inline">В клуб</span>
          </Link>
        </div>
      </div>
    </div>
  );
}