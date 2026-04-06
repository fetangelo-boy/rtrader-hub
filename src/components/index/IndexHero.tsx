import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { getAdminToken } from "@/hooks/useAdminAuth";
import { useQuotes, type Quote } from "@/hooks/useQuotes";
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

const MINI_STATS = [
  { val: "2 500+", icon: "Users", label: "участников", color: "#00E5FF" },
  { val: "7 лет", icon: "Clock", label: "на рынке", color: "#9B30FF" },
  { val: "200+", icon: "FileText", label: "материалов", color: "#FFD700" },
];

function MiniDashboard({ quotes }: { quotes: Quote[] }) {
  // IMOEX — первым если есть, иначе первый из списка
  const imoex = quotes.find(q => q.name === "IMOEX");
  const main = imoex || quotes[0];
  // Акции МосБиржи для списка (исключаем IMOEX)
  const moexStocks = quotes.filter(q => q.name !== "IMOEX" && (q as Quote & { source?: string }).source === "moex");
  const list = moexStocks.length > 0 ? moexStocks.slice(0, 4) : quotes.slice(0, 4);
  const card = { background: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 14, backdropFilter: "blur(20px)" } as React.CSSProperties;

  return (
    <div className="hidden lg:flex flex-col gap-2.5 w-72 xl:w-80 flex-shrink-0">
      {/* Главный инструмент — IMOEX */}
      <div style={{ ...card, padding: "14px 18px" }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
              {main ? main.name : "IMOEX"} · Индекс МосБиржи
            </div>
            <div className="font-russo text-white text-xl leading-tight mt-0.5">
              {main ? main.price : "—"}
            </div>
          </div>
          {main && (
            <span className={`text-sm font-bold ${main.up ? "text-green-400" : "text-red-400"}`}>
              {main.change}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/15">МосБиржа · задержка 15 мин</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
        </div>
      </div>

      {/* Статистика */}
      <div style={{ ...card, padding: "12px 18px" }}>
        <div className="grid grid-cols-3 gap-2">
          {MINI_STATS.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1 text-center">
              <Icon name={item.icon} size={13} style={{ color: item.color }} />
              <div className="font-russo text-white text-sm leading-none">{item.val}</div>
              <div className="text-white/20 text-[10px]">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Список акций — без sparkline, только тикер + цена + изменение */}
      <div style={{ ...card, padding: "10px 18px" }}>
        <div className="space-y-2.5">
          {(list.length > 0 ? list : TICKER_ITEMS.slice(0, 4)).map((t) => (
            <div key={t.name} className="flex items-center justify-between">
              <span className="text-[11px] font-russo text-white/40 w-14 truncate">{t.name}</span>
              <span className="text-[11px] text-white/30 flex-1 text-center">{t.price}</span>
              <span className={`text-[11px] font-bold ${t.up ? "text-green-400" : "text-red-400"}`}>{t.change}</span>
            </div>
          ))}
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
  const tickerItems = quotes.length > 0 ? quotes : TICKER_ITEMS;
  const tickerDouble = [...tickerItems, ...tickerItems];

  return (
    <>
      {/* NAV */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/70 backdrop-blur-xl border-b border-white/10" : "bg-transparent"}`}>
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button onClick={() => navTo("#hero")} className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg brand-gradient-bg flex items-center justify-center shadow-lg">
              <span className="font-russo text-black text-xs font-black">RT</span>
            </div>
            <span className="font-russo text-lg tracking-wider hidden sm:block">R<span className="brand-gradient">TRADER</span></span>
          </button>

          <div className="hidden 2xl:flex items-center gap-4 flex-1 justify-center">
            {NAV_ITEMS.map((item) => (
              <button key={item.href} onClick={() => navTo(item.href, item.isRoute)}
                className="nav-link text-xs whitespace-nowrap">{item.label}</button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {getAdminToken() && (
              <Link to="/rt-manage"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#FFD700]/70 hover:text-[#FFD700] border border-[#FFD700]/20 hover:border-[#FFD700]/40 bg-[#FFD700]/5 hover:bg-[#FFD700]/10 transition-all"
                title="Панель администратора">
                <Icon name="Shield" size={13} />
                <span className="hidden lg:inline">Admin</span>
              </Link>
            )}
            <a href={TG_URL} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-all text-xs"
              title="Telegram">
              <Icon name="Send" size={13} />
              <span className="hidden sm:inline">TG</span>
            </a>
            <Link to={VIP_URL}
              className="neon-btn text-xs px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap">
              <Icon name="Crown" size={13} />
              <span className="hidden sm:inline">VIP</span>
            </Link>
            <button className="2xl:hidden p-1.5 text-white/70 hover:text-white ml-1" onClick={() => setMenuOpen(!menuOpen)}>
              <Icon name={menuOpen ? "X" : "Menu"} size={22} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="2xl:hidden bg-black/97 backdrop-blur-xl border-t border-white/10 px-4 py-5">
            <div className="flex flex-col gap-1 mb-5">
              {NAV_ITEMS.map((item) => (
                <button key={item.href} onClick={() => navTo(item.href, item.isRoute)}
                  className="text-left text-sm text-white/60 hover:text-white py-2.5 px-3 rounded-xl hover:bg-white/5 transition-all border-b border-white/5 last:border-0">
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <a href={TG_URL} target="_blank" rel="noopener noreferrer"
                className="flex-1 text-center py-2.5 rounded-xl border border-white/15 text-white/60 text-sm hover:text-white hover:border-white/30 transition-all">
                Telegram
              </a>
              <Link to={VIP_URL}
                className="neon-btn flex-1 text-center text-sm py-2.5">
                VIP-клуб
              </Link>
            </div>
          </div>
        )}
      </nav>

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
                <span className="block text-white text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl">RTrader —</span>
                <span className="block brand-gradient text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl">трейдинговый</span>
                <span className="block text-white text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl">супер‑портал</span>
              </h1>

              <p className="text-white/55 text-base md:text-lg leading-relaxed mb-8 max-w-lg font-light animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                Для того, кто хочет понимать рынок, расти в трейдинге,<br className="hidden sm:block" />
                принимать осознанные решения и зарабатывать<br className="hidden sm:block" />
                без иллюзий «лёгких денег».
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

            <MiniDashboard quotes={quotes} />
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/25 text-xs">
          <span className="uppercase tracking-widest text-[10px]">Прокрути</span>
          <Icon name="ChevronDown" size={16} className="animate-bounce" />
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