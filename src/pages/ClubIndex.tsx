import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { NAV_ITEMS } from "@/components/trade/data";
import { TickerBar, RightPanel } from "@/components/trade/Shared";
import { ChatSection, SubscribeSection } from "@/components/trade/SectionContent";
import { useAuth } from "@/context/AuthContext";

function renderSection(active: string) {
  switch (active) {
    case "intraday":    return <ChatSection sectionId="intraday" title="Интрадей и мысли" readonly />;
    case "chat":        return <ChatSection sectionId="chat" title="Общий чат" />;
    case "metals":      return <ChatSection sectionId="metals" title="Металлы" />;
    case "oil":         return <ChatSection sectionId="oil" title="Газ / Нефть" />;
    case "products":    return <ChatSection sectionId="products" title="Продукты" />;
    case "video":       return <ChatSection sectionId="video" title="Видео-обзоры" readonly />;
    case "tech":        return <ChatSection sectionId="tech" title="Технические вопросы" />;
    case "access_info": return <ChatSection sectionId="access_info" title="Доступ и VPN" readonly />;
    case "knowledge":   return <ChatSection sectionId="knowledge" title="База знаний" readonly />;
    case "subscribe":   return <SubscribeSection />;
    default:            return <ChatSection sectionId="intraday" title="Интрадей и мысли" readonly />;
  }
}

export default function ClubIndex() {
  const { user, logout, subscription } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState("intraday");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const current = NAV_ITEMS.find(n => n.id === active)!;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="flex items-center justify-between px-4 h-12 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Icon name="Menu" size={20} />
          </button>
          <span className="font-display text-sm tracking-widest text-foreground uppercase">RTrading CLUB</span>
        </div>
        <div className="flex items-center gap-2">
          {subscription?.status === "active" && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              <Icon name="Star" size={10} />
              VIP
            </span>
          )}
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-foreground">
              {user?.nickname?.slice(0, 2).toUpperCase()}
            </div>
            <span className="hidden sm:block">{user?.nickname}</span>
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title="Выйти"
          >
            <Icon name="LogOut" size={16} />
          </button>
        </div>
      </header>

      <TickerBar />

      <div className="flex flex-1 overflow-hidden relative">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`
          w-56 flex-shrink-0 border-r border-border bg-card flex flex-col
          lg:relative lg:translate-x-0
          fixed inset-y-0 left-0 z-30 transition-transform
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `} style={{ top: 0, paddingTop: "88px" }}>
          <nav className="flex-1 overflow-y-auto py-2">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => { setActive(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                  active === item.id
                    ? "bg-primary/10 text-primary border-r-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon name={item.icon as Parameters<typeof Icon>[0]["name"]} size={15} />
                <span>{item.label}</span>
                {item.type === "readonly" && (
                  <Icon name="Eye" size={10} className="ml-auto opacity-40" />
                )}
              </button>
            ))}
          </nav>

          {user?.role === "owner" || user?.role === "admin" ? (
            <div className="p-2 border-t border-border">
              <button
                onClick={() => navigate("/admin")}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
              >
                <Icon name="Settings" size={14} />
                Панель управления
              </button>
            </div>
          ) : null}
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {renderSection(active)}
          </div>
        </main>

        <RightPanel>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Раздел</div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{current?.label}</p>
            <p className="text-xs text-muted-foreground">{current?.desc}</p>
          </div>
          {subscription?.status === "active" && (
            <div className="mt-auto">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs space-y-1">
                <div className="flex items-center gap-1 text-primary font-medium">
                  <Icon name="Star" size={12} />
                  VIP подписка
                </div>
                <p className="text-muted-foreground">
                  Активна до{" "}
                  {new Date(subscription.expires_at).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
            </div>
          )}
        </RightPanel>
      </div>
    </div>
  );
}
