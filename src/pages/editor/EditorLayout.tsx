import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { href: "/editor/reflections", label: "Рефлексии", icon: "Brain" },
  { href: "/editor/analytics", label: "Аналитика", icon: "TrendingUp" },
  { href: "/editor/education", label: "Обучение", icon: "BookOpen" },
  { href: "/editor/tournaments", label: "Конкурсы", icon: "Trophy" },
];

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="neon-grid-bg min-h-screen font-montserrat text-white flex flex-col">
      <header className="h-12 border-b border-white/8 flex items-center justify-between px-5 flex-shrink-0 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-500 flex items-center justify-center">
            <Icon name="PenLine" size={12} className="text-white" />
          </div>
          <span className="font-russo text-xs tracking-wider text-white/60">
            RTRADER <span className="text-white/25">/ редактор</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
            <div className="w-5 h-5 rounded-full bg-purple-500/30 border border-purple-400/40 flex items-center justify-center flex-shrink-0">
              <Icon name="User" size={11} className="text-purple-300" />
            </div>
            <span className="text-xs text-white/70 font-medium">{user?.nickname}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-400/20 font-bold tracking-wider">EDITOR</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/35 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20"
          >
            <Icon name="LogOut" size={13} /> Выйти
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 flex-shrink-0 border-r border-white/8 flex flex-col">
          <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
            <div className="text-xs text-white/20 uppercase tracking-widest px-3 pb-2 pt-1">Публикации</div>
            {NAV.map((item) => {
              const active = location.pathname.startsWith(item.href);
              return (
                <Link key={item.href} to={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    active
                      ? "bg-purple-500/15 text-purple-300 border border-purple-400/25"
                      : "text-white/45 hover:text-white hover:bg-white/5"
                  }`}>
                  <Icon name={item.icon} size={15} />{item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-white/8 flex flex-col gap-2">
            <Link
              to="/"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#FFD700] border border-[#FFD700]/30 bg-[#FFD700]/5 hover:bg-[#FFD700]/15 hover:border-[#FFD700]/60 transition-all"
            >
              <Icon name="ArrowLeft" size={14} /> На сайт
            </Link>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
