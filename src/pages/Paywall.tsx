import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import MiniFooter from "@/components/MiniFooter";

export default function Paywall() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <button onClick={() => navigate("/")} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="ArrowLeft" size={20} />
        </button>
        <h1 className="font-display text-base font-semibold text-foreground uppercase tracking-wide">Подписка</h1>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Icon name="Clock" size={28} className="text-primary" />
          </div>
          <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wide">
            Скоро открытие
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Тарифы и условия подписки готовятся к публикации.<br />
            Напиши нам в Telegram — расскажем подробности.
          </p>
          <a
            href="https://t.me/RTrader11"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Icon name="Send" size={15} />
            Написать в Telegram
          </a>
        </div>
      </div>
      <MiniFooter />
    </div>
  );
}