import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import MiniFooter from "@/components/MiniFooter";
import { SubscribeSection } from "@/components/trade/SectionContent";

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
      <div className="flex-1 flex flex-col">
        <SubscribeSection />
      </div>
      <MiniFooter />
    </div>
  );
}
