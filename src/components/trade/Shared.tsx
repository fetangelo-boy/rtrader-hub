import { useState, useEffect } from "react";
import { TICKER_DATA } from "./data";
import { useQuotes } from "@/hooks/useQuotes";

export function TickerBar() {
  const [offset, setOffset] = useState(0);
  const { data: quotes = [] } = useQuotes();

  const items = quotes.length > 0
    ? [...quotes, ...quotes, ...quotes]
    : [...TICKER_DATA, ...TICKER_DATA, ...TICKER_DATA];

  const itemWidth = 160;

  useEffect(() => {
    const id = setInterval(() => setOffset(p => (p - 1) % (items.length / 3 * itemWidth)), 30);
    return () => clearInterval(id);
  }, [items.length]);

  return (
    <div className="h-8 flex items-center overflow-hidden bg-card border-b border-border">
      <div
        className="flex items-center gap-8 whitespace-nowrap pl-4"
        style={{ transform: `translateX(${offset}px)`, transition: "none" }}
      >
        {items.map((t, i) => {
          const isReal = quotes.length > 0;
          const sym   = isReal ? (t as typeof quotes[0]).name  : (t as typeof TICKER_DATA[0]).sym;
          const price = isReal ? (t as typeof quotes[0]).price : (t as typeof TICKER_DATA[0]).price;
          const change = isReal ? (t as typeof quotes[0]).change : (t as typeof TICKER_DATA[0]).change;
          const up    = isReal ? (t as typeof quotes[0]).up : change.startsWith("+");
          return (
            <div key={i} className="flex items-center gap-2 flex-shrink-0">
              <span className="font-mono text-xs text-muted-foreground">{sym}</span>
              <span className="font-mono text-xs font-medium text-foreground">{price}</span>
              <span className={`font-mono text-xs ${up ? "text-green" : "text-red"}`}>{change}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RoleBadge({ role: _ }: { role: string }) {
  return null;
}

const OWNER_AVATAR = "https://cdn.poehali.dev/projects/39a4ac3c-06be-41f0-97f1-cc3959260964/bucket/c3403a0e-54b2-46e6-85af-1b13315b44ed.png";

export function UserAvatar({ name, role, size = "sm" }: { name: string; role: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const sz = size === "md" ? "w-10 h-10 text-sm" : "w-7 h-7 text-xs";
  if (role === "owner") {
    return (
      <img
        src={OWNER_AVATAR}
        alt={name}
        className={`${sz} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  const bg =
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