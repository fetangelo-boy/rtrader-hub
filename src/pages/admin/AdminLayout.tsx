import { Link, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { getAdminUsername } from "@/hooks/useAdminAuth";

interface Props {
  children: React.ReactNode;
  onLogout: () => void;
}

const NAV = [
  { href: "/rt-manage", label: "Обзор", icon: "LayoutDashboard" },
  { href: "/rt-manage/stats", label: "Статистика", icon: "BarChart2" },
  { href: "/rt-manage/subscriptions", label: "Подписчики", icon: "Users" },
  { href: "/rt-manage/pricing", label: "Тарифы", icon: "Tag" },
  { href: "/rt-manage/broadcast", label: "Рассылки TG", icon: "Send" },
  { href: "/rt-manage/reviews", label: "Отзывы", icon: "MessageSquare" },
  { href: "/rt-manage/content", label: "Тексты сайта", icon: "FileText" },
  { href: "/rt-manage/log", label: "Журнал", icon: "Activity" },
];

const NAV_CMS = [
  { href: "/rt-manage/cms/reflections", label: "Рефлексии", icon: "Brain" },
  { href: "/rt-manage/cms/analytics", label: "Аналитика", icon: "TrendingUp" },
  { href: "/rt-manage/cms/education", label: "Обучение", icon: "BookOpen" },
  { href: "/rt-manage/cms/tournaments", label: "Конкурсы", icon: "Trophy" },
  { href: "/rt-manage/cms/author", label: "Об авторе", icon: "User" },
];

export default function AdminLayout({ children, onLogout }: Props) {
  const location = useLocation();
  const username = getAdminUsername();

  return (
    <div className="neon-grid-bg min-h-screen font-montserrat text-white flex flex-col">
      {/* Топбар */}
      <header className="h-12 border-b border-white/8 flex items-center justify-between px-5 flex-shrink-0 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md brand-gradient-bg flex items-center justify-center">
            <span className="font-russo text-black text-[9px] font-black">RT</span>
          </div>
          <span className="font-russo text-xs tracking-wider text-white/60">RTRADER <span className="text-white/25">/ admin</span></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
            <div className="w-5 h-5 rounded-full brand-gradient-bg flex items-center justify-center flex-shrink-0">
              <Icon name="User" size={11} className="text-black" />
            </div>
            <span className="text-xs text-white/70 font-medium">{username || "admin"}</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/35 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20"
          >
            <Icon name="LogOut" size={13} /> Выйти
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Сайдбар */}
        <aside className="w-56 flex-shrink-0 border-r border-white/8 flex flex-col">
          <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
            {NAV.map((item) => {
              const active = item.href === "/rt-manage"
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);
              return (
                <Link key={item.href} to={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    active ? "bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20" : "text-white/45 hover:text-white hover:bg-white/5"
                  }`}>
                  <Icon name={item.icon} size={15} />{item.label}
                </Link>
              );
            })}

            <div className="text-xs text-white/20 uppercase tracking-widest px-3 pt-4 pb-1.5">Материалы</div>
            {NAV_CMS.map((item) => {
              const active = location.pathname.startsWith(item.href);
              return (
                <Link key={item.href} to={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                    active ? "bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20" : "text-white/40 hover:text-white hover:bg-white/5"
                  }`}>
                  <Icon name={item.icon} size={14} />{item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-white/8">
            <Link
              to="/"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#FFD700] border border-[#FFD700]/30 bg-[#FFD700]/5 hover:bg-[#FFD700]/15 hover:border-[#FFD700]/60 hover:shadow-[0_0_10px_rgba(255,215,0,0.2)] transition-all duration-200"
            >
              <Icon name="ArrowLeft" size={14} /> На сайт
            </Link>
          </div>
        </aside>

        {/* Контент */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}