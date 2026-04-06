import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_DETAILS } from "@/config/subscription";

export default function RestorePassword() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
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
          <h2 className="text-base font-semibold text-foreground mb-2">Восстановление пароля</h2>

          {sent ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Icon name="CheckCircle" size={24} className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Напишите администратору в Telegram{" "}
                <a href={`https://t.me/${PAYMENT_DETAILS.adminTelegram.replace("@", "")}`}
                   target="_blank" rel="noreferrer"
                   className="text-primary hover:underline font-medium">
                  {PAYMENT_DETAILS.adminTelegram}
                </a>{" "}
                с указанием вашего email: <span className="text-foreground font-medium">{email}</span>
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-5">
                Введите email — мы покажем как связаться с администратором для сброса пароля.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Введите email"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Продолжить
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-xs text-muted-foreground mt-4">
            <Link to="/login" className="text-primary hover:underline">
              Вернуться к входу
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
