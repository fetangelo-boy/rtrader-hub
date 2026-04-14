import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { getAdminUsername } from "@/hooks/useAdminAuth";
import { usePendingAlerts, testChime } from "@/hooks/usePendingAlerts";

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
  { href: "/rt-manage/chat", label: "Модерация чата", icon: "ShieldAlert" },
  { href: "/rt-manage/reviews", label: "Отзывы", icon: "MessageSquare" },
  { href: "/rt-manage/sections", label: "Разделы сайта", icon: "LayoutGrid" },
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

const PLAN_LABELS: Record<string, string> = {
  week: "1 нед", month: "1 мес", quarter: "3 мес", halfyear: "6 мес", loyal: "Лояльный",
};

export default function AdminLayout({ children, onLogout }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const username = getAdminUsername();
  const { totalPending, newCount, showBanner, dismissBanner, pending, soundEnabled, toggleSound } = usePendingAlerts();

  const handleGoToPending = () => {
    dismissBanner();
    navigate("/rt-manage/subscriptions?filter=pending");
  };

  return (
    <div className="neon-grid-bg min-h-screen font-montserrat text-white flex flex-col">
      {/* Топбар */}
      <header className="h-12 border-b border-white/8 flex items-center justify-between px-5 flex-shrink-0 bg-black/30 backdrop-blur-sm">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-6 h-6 rounded-md brand-gradient-bg flex items-center justify-center">
            <span className="font-russo text-black text-[9px] font-black">RT</span>
          </div>
          <span className="font-russo text-xs tracking-wider text-white/60">RTRADER <span className="text-white/25">/ admin</span></span>
        </a>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSound}
            title={soundEnabled ? "Звук включён — нажми чтобы выключить" : "Звук выключен — нажми чтобы включить"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border ${
              soundEnabled
                ? "text-sky-300 bg-sky-400/10 border-sky-400/25 hover:bg-sky-400/20"
                : "text-white/30 bg-white/5 border-white/10 hover:text-white/50 hover:bg-white/10"
            }`}
          >
            <Icon name={soundEnabled ? "Volume2" : "VolumeX"} size={13} />
            <span className="hidden sm:inline">{soundEnabled ? "Звук вкл" : "Звук выкл"}</span>
          </button>
          {soundEnabled && (
            <button
              onClick={testChime}
              title="Проверить звук"
              className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-white/30 flex items-center justify-center hover:text-sky-300 hover:bg-sky-400/10 hover:border-sky-400/25 transition-all"
            >
              <Icon name="Bell" size={12} />
            </button>
          )}
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
              const isSubscriptions = item.href === "/rt-manage/subscriptions";
              return (
                <Link key={item.href} to={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    active ? "bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20" : "text-white/45 hover:text-white hover:bg-white/5"
                  }`}>
                  <Icon name={item.icon} size={15} />
                  <span className="flex-1">{item.label}</span>
                  {isSubscriptions && totalPending > 0 && (
                    <span className="relative flex items-center justify-center w-5 h-5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-60 animate-ping" />
                      <span className="relative inline-flex items-center justify-center rounded-full bg-sky-400 text-black text-[10px] font-black w-5 h-5">
                        {totalPending}
                      </span>
                    </span>
                  )}
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

      {/* Всплывающее уведомление о новых заявках */}
      {showBanner && newCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#0f1a2e] border border-sky-400/40 rounded-2xl shadow-[0_0_30px_rgba(56,189,248,0.2)] overflow-hidden">
            {/* Заголовок */}
            <div className="flex items-center justify-between px-4 py-3 bg-sky-400/10 border-b border-sky-400/20">
              <div className="flex items-center gap-2">
                <span className="relative flex items-center justify-center w-5 h-5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-50 animate-ping" />
                  <span className="relative inline-flex items-center justify-center rounded-full bg-sky-400 text-black text-[10px] font-black w-5 h-5">
                    {newCount}
                  </span>
                </span>
                <span className="text-sky-300 font-semibold text-sm">
                  {newCount === 1 ? "Новая заявка на подписку" : `Новых заявок: ${newCount}`}
                </span>
              </div>
              <button
                onClick={dismissBanner}
                className="text-white/30 hover:text-white/70 transition-colors"
              >
                <Icon name="X" size={15} />
              </button>
            </div>

            {/* Список первых заявок */}
            <div className="px-4 py-3 space-y-2 max-h-48 overflow-y-auto">
              {pending.slice(0, 3).map((s) => (
                <div key={s.user_id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-sky-400/15 border border-sky-400/30 flex items-center justify-center flex-shrink-0">
                      <Icon name="User" size={11} className="text-sky-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-white text-xs font-medium truncate">{s.nickname}</div>
                      <div className="text-white/40 text-[10px] truncate">{s.email}</div>
                    </div>
                  </div>
                  {s.plan && (
                    <span className="text-[10px] text-sky-300 bg-sky-400/10 border border-sky-400/20 rounded-md px-1.5 py-0.5 flex-shrink-0">
                      {PLAN_LABELS[s.plan] ?? s.plan}
                    </span>
                  )}
                </div>
              ))}
              {pending.length > 3 && (
                <div className="text-white/30 text-xs text-center pt-1">
                  и ещё {pending.length - 3}...
                </div>
              )}
            </div>

            {/* Кнопки */}
            <div className="px-4 pb-4 flex gap-2">
              <button
                onClick={handleGoToPending}
                className="flex-1 py-2 rounded-xl bg-sky-400 text-black text-xs font-bold hover:bg-sky-300 transition-colors"
              >
                Открыть заявки
              </button>
              <button
                onClick={dismissBanner}
                className="px-3 py-2 rounded-xl bg-white/5 text-white/50 text-xs hover:bg-white/10 transition-colors border border-white/10"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}