import { Link, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";

interface Props {
  children: React.ReactNode;
  onLogout: () => void;
}

const NAV = [
  { href: "/rt-manage", label: "Обзор", icon: "LayoutDashboard" },
  { href: "/rt-manage/reviews", label: "Отзывы", icon: "MessageSquare" },
  { href: "/rt-manage/content", label: "Тексты сайта", icon: "FileText" },
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

  return (
    <div className="neon-grid-bg min-h-screen font-montserrat text-white flex">
      {/* Сайдбар */}
      <aside className="w-56 flex-shrink-0 border-r border-white/8 flex flex-col">
        <div className="p-5 border-b border-white/8">
          <Link to="/" className="flex items-center gap-2.5 mb-0.5">
            <div className="w-7 h-7 rounded-lg brand-gradient-bg flex items-center justify-center">
              <span className="font-russo text-black text-xs font-black">RT</span>
            </div>
            <span className="font-russo text-sm tracking-wider text-white/80">RTRADER</span>
          </Link>
          <div className="text-xs text-white/25 mt-1 ml-9">admin panel</div>
        </div>

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
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/35 hover:text-white/70 transition-colors"
          >
            <Icon name="ExternalLink" size={14} /> На сайт
          </Link>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/35 hover:text-red-400 transition-colors"
          >
            <Icon name="LogOut" size={14} /> Выйти
          </button>
        </div>
      </aside>

      {/* Контент */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}