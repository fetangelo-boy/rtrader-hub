import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { PAYMENT_DETAILS } from "@/config/subscription";
import func2url from "../../backend/func2url.json";

const TG_BOT_URL = (func2url as Record<string, string>)["tg-vip-bot"];

export default function NoAccess() {
  const { user, token, logout, subscription } = useAuth();
  const navigate = useNavigate();

  const [tgLinked, setTgLinked] = useState<boolean | null>(null);
  const [tgUsername, setTgUsername] = useState<string | null>(null);
  const [tgLinkLoading, setTgLinkLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${TG_BOT_URL}?action=status`, { headers: { "X-Auth-Token": token } })
      .then(r => r.json())
      .then(d => { setTgLinked(d.linked); setTgUsername(d.telegram_username || null); })
      .catch(() => {});
  }, [token]);

  const handleConnectTg = async () => {
    setTgLinkLoading(true);
    try {
      const r = await fetch(`${TG_BOT_URL}?action=gen_link`, { headers: { "X-Auth-Token": token || "" } });
      const d = await r.json();
      if (d.url) window.open(d.url, "_blank");
    } finally { setTgLinkLoading(false); }
  };

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

        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
            <Icon name="Send" size={15} className="text-[#29b6f6]" />
            Привязать Telegram
          </h2>
          {tgLinked === null ? (
            <p className="text-xs text-muted-foreground">Загрузка...</p>
          ) : tgLinked ? (
            <div className="flex items-center gap-2 rounded-lg bg-green/10 border border-green/20 px-4 py-3">
              <Icon name="CheckCircle" size={15} className="text-green shrink-0" />
              <div>
                <p className="text-sm text-green font-medium">Telegram подключён</p>
                {tgUsername && <p className="text-xs text-muted-foreground">@{tgUsername}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Если у тебя уже есть оплаченная подписка — привяжи Telegram и бот выдаст доступ автоматически.
              </p>
              <Button
                onClick={handleConnectTg}
                disabled={tgLinkLoading}
                className="w-full bg-[#29b6f6] hover:bg-[#0288d1] text-white"
              >
                <Icon name="Send" size={15} className="mr-2" />
                {tgLinkLoading ? "Генерирую ссылку..." : "Подключить Telegram"}
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <Link to="/" className="text-xs text-primary hover:underline">
            ← Вернуться на портал rtrader11.ru
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );
}