import { useState, useEffect } from "react";
import { TICKER_DATA } from "./data";

export function TickerBar() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setOffset(p => (p - 1) % (TICKER_DATA.length * 160)), 30);
    return () => clearInterval(id);
  }, []);
  const items = [...TICKER_DATA, ...TICKER_DATA, ...TICKER_DATA];
  return (
    <div className="h-8 flex items-center overflow-hidden bg-card border-b border-border">
      <div
        className="flex items-center gap-8 whitespace-nowrap pl-4"
        style={{ transform: `translateX(${offset}px)`, transition: "none" }}
      >
        {items.map((t, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0">
            <span className="font-mono text-xs text-muted-foreground">{t.sym}</span>
            <span className="font-mono text-xs font-medium text-foreground">{t.price}</span>
            <span className={`font-mono text-xs ${t.change.startsWith("+") ? "text-green" : "text-red"}`}>
              {t.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RoleBadge({ role }: { role: string }) {
  if (role === "owner") return <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">Автор</span>;
  if (role === "admin")  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-medium">Админ</span>;
  return null;
}

export function UserAvatar({ name, role, size = "sm" }: { name: string; role: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const sz = size === "md" ? "w-10 h-10 text-sm" : "w-7 h-7 text-xs";
  const bg =
    role === "owner" ? "bg-primary text-primary-foreground" :
    role === "admin" ? "bg-blue-500/20 text-blue-400" :
    "bg-secondary text-muted-foreground";
  return (
    <div className={`${sz} ${bg} rounded-full flex items-center justify-center font-medium flex-shrink-0`}>
      {initials}
    </div>
  );
}

export function RightPanel({ children }: { children?: React.ReactNode }) {
  return (
    <div className="w-64 hidden lg:flex flex-col border-l border-border bg-card/50 p-4 gap-4">
      {children}
    </div>
  );
}
