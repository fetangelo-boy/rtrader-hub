import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CONSENTS = [
  { id: "terms",   text: "Я принимаю",        link: "Пользовательское соглашение",    href: "/legal/terms" },
  { id: "privacy", text: "Я ознакомлен(а) с", link: "Политикой конфиденциальности",   href: "/legal/privacy" },
  { id: "rules",   text: "Я принимаю",        link: "Правила модерации",              href: "/legal/rules" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tgToken = searchParams.get("tg_token") || "";
  const inviteCode = searchParams.get("invite") || "";

  const [form, setForm] = useState({
    nickname: "",
    email: "",
    password: "",
    gdpr_consent: false,
    invite_code: inviteCode,
    tg_token: tgToken,
  });
  const [consents, setConsents] = useState({ terms: false, privacy: false, rules: false });
  const allConsented = consents.terms && consents.privacy && consents.rules;
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!allConsented) { setError("Необходимо принять все документы"); return; }
    setLoading(true);
    try {
      await register({ ...form, gdpr_consent: true });
      navigate("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
            <Icon name="TrendingUp" size={24} className="text-primary" />
          </div>
          <h1 className="font-display text-xl tracking-widest text-foreground uppercase mb-1">RTrading CLUB</h1>
          <p className="text-sm text-muted-foreground">Закрытый трейдинг-клуб</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-5">Регистрация</h2>

          {tgToken && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#29b6f6]/10 border border-[#29b6f6]/30 text-sm text-[#29b6f6]">
              <Icon name="Send" size={14} />
              Telegram будет привязан автоматически
            </div>
          )}

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nickname">Никнейм</Label>
              <Input
                id="nickname"
                type="text"
                value={form.nickname}
                onChange={(e) => set("nickname", e.target.value)}
                placeholder="Введите никнейм"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="Введите email"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Минимум 6 символов"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                </button>
              </div>
            </div>

            {form.invite_code && (
              <div>
                <Label htmlFor="invite_code">Код приглашения</Label>
                <Input
                  id="invite_code"
                  type="text"
                  value={form.invite_code}
                  disabled
                  className="opacity-60"
                />
              </div>
            )}

            <div className="space-y-2.5">
              {CONSENTS.map(c => (
                <div key={c.id} className="flex items-start gap-2">
                  <input
                    id={`consent-${c.id}`}
                    type="checkbox"
                    checked={consents[c.id as keyof typeof consents]}
                    onChange={(e) => setConsents(prev => ({ ...prev, [c.id]: e.target.checked }))}
                    className="mt-0.5 accent-primary flex-shrink-0"
                  />
                  <label htmlFor={`consent-${c.id}`} className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                    {c.text}{" "}
                    <a href={c.href} target="_blank" rel="noopener noreferrer"
                      className="text-primary hover:underline" onClick={e => e.stopPropagation()}>
                      {c.link}
                    </a>
                  </label>
                </div>
              ))}
            </div>

            <Button type="submit" disabled={loading || !allConsented} className="w-full">
              {loading ? "Регистрация..." : "Зарегистрироваться"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}