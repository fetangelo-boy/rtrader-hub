import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { PAYMENT_DETAILS } from "@/config/subscription";

export default function NoAccess() {
  const { user, logout, subscription } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
          <Icon name="Lock" size={32} className="text-primary" />
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold text-foreground uppercase tracking-wider mb-2">
            RTrading CLUB
          </h1>
          <p className="text-muted-foreground">Привет, {user?.nickname}!</p>
        </div>

        {subscription && subscription.status === "pending" ? (
          <div className="bg-card border border-border rounded-xl p-6 space-y-3 text-left">
            <div className="flex items-center gap-2 text-yellow-500">
              <Icon name="Clock" size={18} />
              <span className="font-medium text-sm">Заявка на рассмотрении</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Ваша заявка на подписку получена. Администратор проверит оплату и откроет доступ в течение нескольких часов.
            </p>
            <p className="text-sm text-muted-foreground">
              По вопросам:{" "}
              <a
                href={`https://t.me/${PAYMENT_DETAILS.adminTelegram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {PAYMENT_DETAILS.adminTelegram}
              </a>
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Для доступа к закрытому клубу необходима активная подписка.
            </p>
            <Button onClick={() => navigate("/subscribe")} className="w-full">
              Оформить подписку
            </Button>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
