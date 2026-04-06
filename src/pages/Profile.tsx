import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import func2url from "../../backend/func2url.json";

const AUTH_URL = (func2url as Record<string, string>).auth;

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

  const handleNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    setNickError("");
    setNickSuccess(false);
    setNickLoading(true);
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
    } finally {
      setNickLoading(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess(false);
    setPassLoading(true);
    try {
      const r = await fetch(`${AUTH_URL}?action=change_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
        body: JSON.stringify({ old_password: oldPass, new_password: newPass }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Ошибка");
      setPassSuccess(true);
      setOldPass("");
      setNewPass("");
    } catch (err: unknown) {
      setPassError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

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
              <span className="text-primary font-bold text-lg">
                {user?.nickname?.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground">{user?.nickname}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {subscription && (
            <div className={`rounded-lg px-4 py-3 flex items-center justify-between text-sm ${
              subscription.status === "active"
                ? "bg-green/10 border border-green/20"
                : "bg-muted border border-border"
            }`}>
              <div className="flex items-center gap-2">
                <Icon
                  name={subscription.status === "active" ? "CheckCircle" : "Clock"}
                  size={16}
                  className={subscription.status === "active" ? "text-green" : "text-muted-foreground"}
                />
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

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Изменить никнейм</h2>
          <form onSubmit={handleNickname} className="space-y-3">
            <div>
              <Label htmlFor="nickname">Никнейм</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Введите новый никнейм"
                required
              />
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
              <Input
                id="old_pass"
                type="password"
                value={oldPass}
                onChange={e => setOldPass(e.target.value)}
                placeholder="Текущий пароль"
                required
              />
            </div>
            <div>
              <Label htmlFor="new_pass">Новый пароль</Label>
              <Input
                id="new_pass"
                type="password"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Минимум 6 символов"
                required
              />
            </div>
            {passError && <p className="text-sm text-destructive">{passError}</p>}
            {passSuccess && <p className="text-sm text-green">Пароль изменён</p>}
            <Button type="submit" disabled={passLoading} variant="outline" className="w-full">
              {passLoading ? "Сохранение..." : "Изменить пароль"}
            </Button>
          </form>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <Icon name="LogOut" size={16} className="mr-2" />
          Выйти из аккаунта
        </Button>
      </div>
    </div>
  );
}
