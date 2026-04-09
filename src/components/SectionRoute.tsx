import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useSiteSections } from "@/hooks/useSiteSections";
import { useAuth } from "@/context/AuthContext";

interface Props {
  sectionKey: string;
  children: React.ReactNode;
}

export default function SectionRoute({ sectionKey, children }: Props) {
  const { data: sections, isLoading } = useSiteSections();
  const { user } = useAuth();

  // Админы и владельцы видят всё всегда
  const isAdmin = !!user && (user.role === "owner" || user.role === "admin");
  if (isAdmin) return <>{children}</>;

  // Пока данные грузятся — показываем контент (нет мерцания)
  if (isLoading || !sections) return <>{children}</>;

  const section = sections.find(s => s.key === sectionKey);

  // Если раздел скрыт — блокируем
  if (section && !section.is_visible) {
    return (
      <div className="min-h-screen neon-grid-bg text-white flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
            <Icon name="Lock" size={28} className="text-white/30" />
          </div>
          <div>
            <h1 className="font-russo text-xl text-white mb-2">Раздел временно закрыт</h1>
            <p className="text-sm text-white/40 leading-relaxed">
              {section.label} сейчас недоступен. Следите за обновлениями в Telegram.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              <Icon name="ArrowLeft" size={14} /> На главную
            </Link>
            <a
              href="https://t.me/RTrader11"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 text-sm text-[#FFD700] hover:bg-[#FFD700]/20 transition-all"
            >
              <Icon name="Send" size={14} /> Telegram
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
