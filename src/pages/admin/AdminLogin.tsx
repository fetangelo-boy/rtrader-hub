import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  onLogin: (username: string, password: string) => void;
  loading: boolean;
  error: string;
}

export default function AdminLogin({ onLogin, loading, error }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) onLogin(username.trim(), password.trim());
  };

  return (
    <div className="neon-grid-bg min-h-screen flex items-center justify-center font-montserrat">
      <div className="glass-card p-10 w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl brand-gradient-bg flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Icon name="Shield" size={26} className="text-black" />
          </div>
          <div className="font-russo text-white text-xl mb-1">Admin RTrader</div>
          <div className="text-white/35 text-xs">Закрытая зона управления</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Логин</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введи логин"
              autoFocus
              autoComplete="username"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#FFD700]/50 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введи пароль"
              autoComplete="current-password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#FFD700]/50 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <Icon name="AlertCircle" size={13} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="neon-btn py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Проверяю..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
