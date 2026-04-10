import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import func2url from "../../backend/func2url.json";
import { cn } from "@/lib/utils";

const AUTH_URL = (func2url as Record<string, string>).auth;
const TG_BOT_URL = (func2url as Record<string, string>)["tg-vip-bot"];

export default function Profile() {
  const { user, token, subscription, logout } = useAuth();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState(user?.nickname || "");
  const [nickLoading, setNickLoading] = useState(false);
  const [nickError, setNickError] = useState("");
  const [nickSuccess, setNickSuccess] = useState(false);

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState(false);

  const [tgLinked, setTgLinked] = useState<boolean | null>(null);
  const [tgUsername, setTgUsername] = useState<string | null>(null);
  const [tgLinkLoading, setTgLinkLoading] = useState(false);
  const [tgLinkError, setTgLinkError] = useState("");
  const [tgLinkUrl, setTgLinkUrl] = useState("");
  const [tgCopied, setTgCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${TG_BOT_URL}?action=status`, { headers: { "X-Auth-Token": token } })
      .then(r => r.json())
      .then(d => { setTgLinked(d.linked); setTgUsername(d.telegram_username || null); })
      .catch(() => {});
  }, [token]);

  const handleNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    setNickError(""); setNickSuccess(false); setNickLoading(true);
    try {
      const r = await fetch(`${AUTH_URL}?action=update_nickname`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
        body: JSON.stringify({ nickname }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Ошибка");
      setNickSuccess(true);
    } catch (err: unknown) {
      setNickError(err instanceof Error ? err.message : "Ошибка");
    } finally { setNickLoading(false); }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(""); setPassSuccess(false); setPassLoading(true);
    try {
      const r = await fetch(`${AUTH_URL}?action=change_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
        body: JSON.stringify({ old_password: oldPass, new_password: newPass }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Ошибка");
      setPassSuccess(true); setOldPass(""); setNewPass("");
    } catch (err: unknown) {
      setPassError(err instanceof Error ? err.message : "Ошибка");
    } finally { setPassLoading(false); }
  };

  const handleConnectTg = async () => {
    setTgLinkLoading(true);
    setTgLinkError("");
    setTgLinkUrl("");
    try {
      const r = await fetch(`${TG_BOT_URL}?action=gen_link`, { headers: { "X-Auth-Token": token || "" } });
      const d = await r.json();
      if (d.url) {
        setTgLinkUrl(d.url);
      } else {
        setTgLinkError(d.error || "Не удалось сгенерировать ссылку. Попробуйте ещё раз.");
      }
    } catch {
      setTgLinkError("Ошибка соединения. Попробуйте ещё раз.");
    } finally { setTgLinkLoading(false); }
  };

  const handleCopyTg = () => {
    navigator.clipboard.writeText(tgLinkUrl);
    setTgCopied(true);
    setTimeout(() => setTgCopied(false), 2000);
  };

  const handleUnlinkTg = async () => {
    await fetch(`${TG_BOT_URL}?action=unlink`, { method: "POST", headers: { "X-Auth-Token": token || "" } });
    setTgLinked(false); setTgUsername(null);
  };

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const subExpiresAt = subscription?.expires_at
    ? new Date(subscription.expires_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <h1 className="font-display text-lg font-semibold text-foreground uppercase tracking-wide">Профиль</h1>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">{user?.nickname?.slice(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-semibold text-foreground">{user?.nickname}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {user?.role === "editor" && (
            <a href="/editor" className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all">
              <Icon name="PenLine" size={15} />
              <span className="font-medium">Панель редактора</span>
              <Icon name="ArrowRight" size={13} className="ml-auto" />
            </a>
          )}

          {subscription && (
            <div className={cn("rounded-lg px-4 py-3 flex items-center justify-between text-sm",
              subscription.status === "active" ? "bg-green/10 border border-green/20" : "bg-muted border border-border"
            )}>
              <div className="flex items-center gap-2">
                <Icon name={subscription.status === "active" ? "CheckCircle" : "Clock"} size={16}
                  className={subscription.status === "active" ? "text-green" : "text-muted-foreground"} />
                <span className={subscription.status === "active" ? "text-green font-medium" : "text-muted-foreground"}>
                  {subscription.status === "active" ? "Подписка активна" : "Заявка на рассмотрении"}
                </span>
              </div>
              {subExpiresAt && subscription.status === "active" && (
                <span className="text-xs text-muted-foreground">до {subExpiresAt}</span>
              )}
            </div>
          )}
        </div>

        {/* Telegram */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Icon name="Send" size={16} className="text-[#29b6f6]" />
            Telegram-уведомления
          </h2>
          {tgLinked === null ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : tgLinked ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-green/10 border border-green/20 px-4 py-3">
                <Icon name="CheckCircle" size={15} className="text-green shrink-0" />
                <div>
                  <p className="text-sm text-green font-medium">Telegram подключён</p>
                  {tgUsername && <p className="text-xs text-muted-foreground">@{tgUsername}</p>}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Будешь получать напоминания об истечении подписки.</p>
              <button onClick={handleUnlinkTg} className="text-xs text-destructive hover:underline">
                Отвязать Telegram
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {subscription?.status === "active" ? (
                <div className="rounded-lg border border-[#29b6f6]/30 bg-[#29b6f6]/5 px-4 py-3">
                  <p className="text-sm text-[#29b6f6] font-medium mb-1">Подключи Telegram ← важно</p>
                  <p className="text-xs text-muted-foreground">
                    Ты получишь уведомление за 3 дня и за 1 день до окончания подписки — чтобы не потерять доступ к клубу.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Подключи Telegram, чтобы получать уведомления о подписке прямо в мессенджер.
                </p>
              )}
              {!tgLinkUrl ? (
                <Button onClick={handleConnectTg} disabled={tgLinkLoading} className="w-full bg-[#29b6f6] hover:bg-[#0288d1] text-white">
                  <Icon name="Send" size={15} className="mr-2" />
                  {tgLinkLoading ? "Генерирую ссылку..." : "Получить ссылку для Telegram"}
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Откройте ссылку в нужном аккаунте Telegram:</p>
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                    <a href={tgLinkUrl} target="_blank" rel="noreferrer" className="flex-1 text-xs text-[#29b6f6] truncate hover:underline">{tgLinkUrl}</a>
                    <button onClick={handleCopyTg} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors" title="Скопировать">
                      <Icon name={tgCopied ? "Check" : "Copy"} size={14} className={tgCopied ? "text-green" : ""} />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Ссылка действует 15 минут.</p>
                  <button onClick={() => setTgLinkUrl("")} className="text-xs text-muted-foreground hover:text-foreground underline">Сгенерировать новую</button>
                </div>
              )}
              {tgLinkError && <p className="text-xs text-destructive">{tgLinkError}</p>}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Изменить никнейм</h2>
          <form onSubmit={handleNickname} className="space-y-3">
            <div>
              <Label htmlFor="nickname">Никнейм</Label>
              <Input id="nickname" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Введите новый никнейм" required />
            </div>
            {nickError && <p className="text-sm text-destructive">{nickError}</p>}
            {nickSuccess && <p className="text-sm text-green">Никнейм обновлён</p>}
            <Button type="submit" disabled={nickLoading} variant="outline" className="w-full">
              {nickLoading ? "Сохранение..." : "Сохранить"}
            </Button>
          </form>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Изменить пароль</h2>
          <form onSubmit={handlePassword} className="space-y-3">
            <div>
              <Label htmlFor="old_pass">Текущий пароль</Label>
              <Input id="old_pass" type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} placeholder="Текущий пароль" required />
            </div>
            <div>
              <Label htmlFor="new_pass">Новый пароль</Label>
              <Input id="new_pass" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Минимум 6 символов" required />
            </div>
            {passError && <p className="text-sm text-destructive">{passError}</p>}
            {passSuccess && <p className="text-sm text-green">Пароль изменён</p>}
            <Button type="submit" disabled={passLoading} variant="outline" className="w-full">
              {passLoading ? "Изменение..." : "Изменить пароль"}
            </Button>
          </form>
        </div>

        <Button onClick={handleLogout} variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
          <Icon name="LogOut" size={16} className="mr-2" />
          Выйти из аккаунта
        </Button>
      </div>
    </div>
  );
}