import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { getAdminToken } from "@/hooks/useAdminAuth";
import HubNav from "@/components/HubNav";
import { useQuotes, type Quote } from "@/hooks/useQuotes";
import { useHomeContent } from "@/hooks/useHomeContent";
import {
  NAV_ITEMS, TICKER_ITEMS, STATS, SECTIONS,
  Reveal, Sparkline, VIP_URL, TG_URL,
} from "./IndexShared";

interface IndexHeroProps {
  scrolled: boolean;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  navTo: (href: string, isRoute?: boolean) => void;
}

const MINI_STATS_DEFAULT = [
  { key: "stats_members", icon: "Users", label: "участников", color: "#00E5FF" },
  { key: "stats_years", icon: "Clock", label: "на рынке", color: "#9B30FF" },
  { key: "stats_materials", icon: "FileText", label: "материалов", color: "#FFD700" },
];

// Цвета тикеров: GAZP=cyan, LKOH=red, NVTK=purple, SBER=emerald
const TICKER_NEON: Record<string, string> = {
  GAZP: "#00E5FF",
  LKOH: "#FF2D78",
  NVTK: "#9B30FF",
  SBER: "#00FFB2",
};
const TICKER_NEON_FALLBACK = ["#00E5FF", "#FF2D78", "#9B30FF", "#00FFB2"];

function MiniDashboard({ quotes, content }: { quotes: Quote[], content?: Record<string, string> }) {
  const imoex = quotes.find(q => q.name === "IMOEX");
  const moexStocks = quotes.filter(q => q.name !== "IMOEX" && (q as Quote & { source?: string }).source === "moex");
  const list = moexStocks.length > 0 ? moexStocks.slice(0, 4) : quotes.filter(q => q.name !== "IMOEX").slice(0, 4);

  return (
    <div className="hidden lg:flex flex-col gap-3 w-80 xl:w-96 flex-shrink-0">

      {/* Индекс МосБиржи — всегда показываем блок, даже если нет данных */}
      <div style={{ padding: "14px 20px" }}>
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-1"
          style={{ color: "rgba(255,215,0,0.45)" }}>
          Индекс МосБиржи · IMOEX
        </div>
        <div className="flex items-end justify-between">
          <div className="font-russo text-2xl leading-none"
            style={{ color: "#FFD700", textShadow: "0 0 18px rgba(255,215,0,0.4)" }}>
            {imoex ? imoex.price : "—"}
          </div>
          {imoex && (
            <span className={`text-sm font-black ${imoex.up ? "text-green-400" : "text-red-400"}`}
              style={{ textShadow: imoex.up ? "0 0 10px rgba(74,222,128,0.6)" : "0 0 10px rgba(248,113,113,0.6)" }}>
              {imoex.change}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
            style={{ background: imoex ? "#4ade80" : "rgba(255,215,0,0.4)" }} />
          <span className="text-[10px]" style={{ color: "rgba(255,215,0,0.25)" }}>
            {imoex ? "МосБиржа · задержка 15 мин" : "МосБиржа закрыта"}
          </span>
        </div>
      </div>

      {/* Статистика */}
      <div style={{ padding: "8px 20px" }}>
        <div className="grid grid-cols-3 gap-3">
          {MINI_STATS_DEFAULT.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1 text-center">
              <Icon name={item.icon} size={13} style={{ color: item.color, filter: `drop-shadow(0 0 5px ${item.color}88)` }} />
              <div className="font-russo text-sm leading-none"
                style={{ color: "#FFD700", textShadow: "0 0 8px rgba(255,215,0,0.3)" }}>
                {content?.[item.key] ?? "—"}
              </div>
              <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Список акций */}
      <div style={{ padding: "6px 20px" }}>
        <div className="space-y-2.5">
          {(list.length > 0 ? list : TICKER_ITEMS.slice(0, 4)).map((t, i) => {
            const neon = TICKER_NEON[t.name] ?? TICKER_NEON_FALLBACK[i % TICKER_NEON_FALLBACK.length];
            return (
              <div key={t.name} className="flex items-center justify-between">
                <span className="text-xs font-russo font-bold w-14"
                  style={{ color: neon, textShadow: `0 0 8px ${neon}99` }}>
                  {t.name}
                </span>
                <span className="text-xs font-semibold flex-1 text-center"
                  style={{ color: "rgba(255,215,0,0.55)" }}>
                  {t.price}
                </span>
                <span className={`text-xs font-bold ${t.up ? "text-green-400" : "text-red-400"}`}
                  style={{ textShadow: t.up ? "0 0 7px rgba(74,222,128,0.5)" : "0 0 7px rgba(248,113,113,0.5)" }}>
                  {t.change}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionCarousel() {
  const [active, setActive] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(0);
  const cardW = 280;
  const gap = 16;

  const scrollToIdx = useCallback((idx: number, smooth = true) => {
    const next = ((idx % SECTIONS.length) + SECTIONS.length) % SECTIONS.length;
    activeRef.current = next;
    setActive(next);
    const container = containerRef.current;
    if (!container) return;
    const offset = next * (cardW + gap) - container.clientWidth / 2 + cardW / 2;
    container.scrollTo({ left: Math.max(0, offset), behavior: smooth ? "smooth" : "auto" });
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) {
        scrollToIdx(activeRef.current + 1);
      }
    }, 3500);
  }, [stopTimer, scrollToIdx]);

  useEffect(() => {
    startTimer();
    return () => {
      stopTimer();
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, [startTimer, stopTimer]);

  const onCardEnter = (i: number) => {
    setHoveredCard(i);
    pausedRef.current = true;
  };
  const onCardLeave = () => {
    setHoveredCard(null);
    pausedRef.current = false;
  };

  const pauseTemporary = () => {
    pausedRef.current = true;
    if (cooldownRef.current) clearTimeout(cooldownRef.current);
    cooldownRef.current = setTimeout(() => {
      if (!isDragging.current) pausedRef.current = false;
    }, 2500);
  };

  const prev = () => {
    pauseTemporary();
    scrollToIdx(activeRef.current - 1);
  };
  const next = () => {
    pauseTemporary();
    scrollToIdx(activeRef.current + 1);
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    startX.current = e.pageX;
    scrollStart.current = e.currentTarget.scrollLeft;
    pauseTemporary();
  };
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    e.currentTarget.scrollLeft = scrollStart.current - (e.pageX - startX.current);
  };
  const onMouseUp = () => {
    if (isDragging.current) {
      isDragging.current = false;
      pauseTemporary();
    }
  };

  const navigate = useNavigate();
  const navigateTo = (section: (typeof SECTIONS)[0]) => {
    if (section.isRoute) {
      navigate(section.href);
    } else {
      const el = document.querySelector(section.href);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div
        ref={containerRef}
        className="overflow-x-auto scrollbar-hide pb-4 cursor-grab active:cursor-grabbing"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div className="flex gap-4 px-4 md:px-0" style={{ width: "max-content" }}>
          {SECTIONS.map((s, i) => {
            const isActive = i === active;
            const isHovered = i === hoveredCard;
            return (
              <div
                key={s.id}
                onClick={() => { pauseTemporary(); scrollToIdx(i); }}
                onMouseEnter={() => onCardEnter(i)}
                onMouseLeave={onCardLeave}
                className="carousel-card flex-shrink-0 flex flex-col gap-4 p-6 cursor-pointer select-none"
                style={{
                  width: cardW,
                  transform: isHovered
                    ? "scale(1.06) perspective(800px) rotateY(-4deg) translateY(-4px)"
                    : isActive
                      ? "scale(1.04) perspective(800px) rotateY(-3deg)"
                      : "scale(1) perspective(800px) rotateY(0deg)",
                  transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s ease, border-color 0.35s ease",
                  borderColor: isActive || isHovered ? s.accent : "rgba(255,255,255,0.08)",
                  boxShadow: isActive || isHovered
                    ? `0 0 30px ${s.glow}, 0 8px 40px rgba(0,0,0,0.4)`
                    : "0 4px 20px rgba(0,0,0,0.3)",
                }}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.grad}`}
                  style={{ boxShadow: `0 0 16px ${s.glow}` }}
                >
                  <Icon name={s.icon} size={18} className="text-white" />
                </div>
                <div>
                  <div className="font-russo text-white text-base leading-tight mb-1">{s.title}</div>
                  <div className="text-xs text-white/45 leading-relaxed">{s.short}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateTo(s); }}
                  className="mt-auto text-xs font-semibold flex items-center gap-1.5 hover:gap-3 transition-all duration-200"
                  style={{ color: s.accent }}
                >
                  {s.cta} <Icon name="ArrowRight" size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-5">
        <button onClick={prev}
          className="w-9 h-9 rounded-full glass-card flex items-center justify-center text-white/50 hover:text-white transition-all">
          <Icon name="ChevronLeft" size={16} />
        </button>
        <div className="flex gap-2 items-center">
          {SECTIONS.map((_, i) => (
            <button key={i} onClick={() => { pauseTemporary(); scrollToIdx(i); }}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === active ? 18 : 6,
                height: 6,
                background: i === active ? SECTIONS[active].accent : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
        <button onClick={next}
          className="w-9 h-9 rounded-full glass-card flex items-center justify-center text-white/50 hover:text-white transition-all">
          <Icon name="ChevronRight" size={16} />
        </button>
      </div>
    </div>
  );
}

export default function IndexHero({ scrolled, menuOpen, setMenuOpen, navTo }: IndexHeroProps) {
  const { data: quotes = [] } = useQuotes();
  const { data: content } = useHomeContent();
  const tickerItems = quotes.length > 0 ? quotes : TICKER_ITEMS;
  const tickerDouble = [...tickerItems, ...tickerItems];

  return (
    <>
      {/* NAV */}
      <HubNav />

      {/* HERO */}
      <section id="hero" className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-24">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src="https://cdn.poehali.dev/projects/39a4ac3c-06be-41f0-97f1-cc3959260964/files/4b1069f6-e9ad-462d-9ecb-0fa02243b605.jpg"
            alt=""
            className="absolute bottom-0 right-0 h-[78%] w-auto object-contain object-right-bottom select-none"
            style={{ opacity: 0.55, mixBlendMode: "screen" }}
          />
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(6,5,26,0.85) 0%, rgba(6,5,26,0.3) 25%, transparent 55%)" }} />
          <div className="absolute bottom-0 right-0 w-[65%] h-48 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 65% bottom, rgba(0,229,255,0.1) 0%, rgba(155,48,255,0.1) 50%, transparent 75%)" }} />
        </div>

        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to right, rgba(6,5,26,0.95) 0%, rgba(6,5,26,0.82) 38%, rgba(6,5,26,0.4) 60%, rgba(6,5,26,0.05) 80%, transparent 100%)" }} />

        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#9B30FF]/6 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-[#00E5FF]/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 pb-12">
          <div className="flex items-center gap-16 xl:gap-20">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#00E5FF] uppercase tracking-widest mb-8 animate-fade-in-up">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse inline-block" />
                Трейдинговый супер‑портал · Мосбиржа
              </div>

              <h1 className="font-russo leading-none mb-5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                <span className="block text-white text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl brand-gradient">
                  {content?.hero_title ?? "RTrader — трейдинговый портал"}
                </span>
              </h1>

              <p className="text-white/55 text-base md:text-lg leading-relaxed mb-8 max-w-lg font-light animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                {content?.hero_subtitle ?? "Для того, кто хочет понимать рынок, расти в трейдинге, принимать осознанные решения и зарабатывать без иллюзий «лёгких денег»."}
              </p>

              <div className="flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                <Link to="/community"
                  className="neon-btn text-sm px-6 py-3 flex items-center gap-2">
                  <Icon name="Users" size={16} />
                  К комьюнити и аналитике
                </Link>
                <Link to={VIP_URL}
                  className="neon-btn text-sm px-6 py-3 flex items-center gap-2">
                  <Icon name="Crown" size={16} />
                  Войти в VIP-клуб
                </Link>
                <Link to="/education"
                  className="text-sm text-white/40 hover:text-white/75 transition-colors underline underline-offset-4 decoration-white/20 hover:decoration-white/50 flex items-center gap-1.5 px-2">
                  Перейти к обучению
                  <Icon name="ArrowRight" size={13} />
                </Link>
              </div>
            </div>

            <MiniDashboard quotes={quotes} content={content as Record<string, string> | undefined} />
          </div>
        </div>


      </section>

      {/* TICKER */}
      <div className="ticker-wrap py-2.5">
        <div className="flex animate-ticker whitespace-nowrap">
          {tickerDouble.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-5 text-xs">
              <span className="font-russo text-white/60">{t.name}</span>
              <span className="text-white/35">{t.price}</span>
              <span className={t.up ? "text-green-400" : "text-red-400"}>{t.change}</span>
              <span className="text-white/10 ml-1">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div className="container mx-auto px-4 py-12">
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="glass-card p-5 text-center">
                <div className="font-russo brand-gradient text-2xl xl:text-3xl mb-1">{s.val}</div>
                <div className="text-white/35 text-xs font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* CAROUSEL */}
      <div className="container mx-auto px-4 pb-16">
        <Reveal className="mb-8 text-center">
          <div className="text-xs text-white/25 uppercase tracking-widest font-semibold mb-2">Разделы портала</div>
          <h2 className="font-russo text-3xl md:text-4xl text-white">Что есть в RTrader</h2>
        </Reveal>
        <Reveal delay={100}>
          <SectionCarousel />
        </Reveal>
      </div>
    </>
  );
}