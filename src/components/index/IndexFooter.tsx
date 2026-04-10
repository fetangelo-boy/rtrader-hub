import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { NAV_ITEMS, ECOSYSTEM } from "./IndexShared";

interface IndexFooterProps {
  navTo: (href: string, isRoute?: boolean) => void;
}

export default function IndexFooter({ navTo }: IndexFooterProps) {
  return (
    <footer className="border-t border-white/6 py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg brand-gradient-bg flex items-center justify-center">
              <span className="font-russo text-black text-xs font-black">RT</span>
            </div>
            <div>
              <div className="font-russo text-white text-sm tracking-wider">RTRADER</div>
              <div className="text-xs text-white/20">rtrader11.ru</div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {NAV_ITEMS.map((item) => (
              <button key={item.href} onClick={() => navTo(item.href, item.isRoute)}
                className="text-xs text-white/22 hover:text-white/60 transition-colors font-medium uppercase tracking-widest">
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {ECOSYSTEM.map((item) => (
              <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg glass-card flex items-center justify-center transition-all hover:scale-110"
                style={{ color: item.color }} title={item.name}>
                <Icon name={item.icon} size={14} />
              </a>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/18">
          <span>© 2026 RTrader. Материалы носят информационный характер и не являются инвестиционными рекомендациями.</span>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link to="/legal/terms" className="hover:text-white/50 transition-colors">Пользовательское соглашение</Link>
            <Link to="/legal/privacy" className="hover:text-white/50 transition-colors">Политика конфиденциальности</Link>
            <Link to="/legal/rules" className="hover:text-white/50 transition-colors">Правила модерации</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}