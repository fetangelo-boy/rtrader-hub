import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const VIP_URL = "https://web-app-hosting--preview.poehali.dev/login";
const TG_URL = "https://t.me/RTrader11";

const NAV_ITEMS = [
  { label: "Комьюнити", href: "/community", isRoute: true },
  { label: "Аналитика", href: "/analytics", isRoute: true },
  { label: "Рефлексии", href: "/reflections", isRoute: true },
  { label: "Конкурсы", href: "/tournaments", isRoute: true },
  { label: "VIP-клуб", href: "/vip", isRoute: true },
  { label: "Обучение", href: "/education", isRoute: true },
  { label: "Отзывы", href: "/reviews", isRoute: true },
  { label: "Об авторе", href: "#author", isRoute: false },
];

const TICKER_ITEMS = [
  { name: "SBER", price: "318.45", change: "+1.2%", up: true },
  { name: "GAZP", price: "172.80", change: "-0.4%", up: false },
  { name: "LKOH", price: "7 240", change: "+0.8%", up: true },
  { name: "NVTK", price: "1 045", change: "+2.1%", up: true },
  { name: "GMKN", price: "143 600", change: "-1.1%", up: false },
  { name: "ROSN", price: "511.4", change: "+0.3%", up: true },
  { name: "Si-6.25", price: "85 320", change: "+0.6%", up: true },
  { name: "RI-6.25", price: "112 450", change: "+1.4%", up: true },
  { name: "BR-5.25", price: "74.85", change: "-0.9%", up: false },
  { name: "GOLD-6.25", price: "9 815", change: "+1.7%", up: true },
  { name: "NG-5.25", price: "2.84", change: "+3.2%", up: true },
  { name: "WHEAT-5.25", price: "582", change: "-0.5%", up: false },
];

const STATS = [
  { val: "2 500+", label: "трейдеров в сообществе" },
  { val: "7 лет", label: "на рынке" },
  { val: "200+", label: "материалов и разборов" },
  { val: "МосБиржа", label: "основная площадка" },
];

const SECTIONS = [
  {
    id: "community",
    href: "/community",
    icon: "Users",
    title: "Комьюнити трейдеров",
    short: "Чаты, обсуждения, обмен опытом и поддержка",
    description:
      "Живые обсуждения рынка, обмен идеями и опытом. Чаты по инструментам, еженедельные онлайн-встречи и взаимная поддержка трейдеров всех уровней.",
    bullets: [
      "Чат по акциям и фьючерсам 24/5",
      "Тематические каналы по инструментам",
      "Еженедельные созвоны и разборы",
      "Поддержка и обмен опытом",
    ],
    cta: "Подробнее о комьюнити",
    accent: "#00E5FF",
    glow: "rgba(0,229,255,0.25)",
    grad: "from-[#00E5FF] to-[#4169FF]",
    isRoute: true,
  },
  {
    id: "analytics",
    href: "/analytics",
    icon: "TrendingUp",
    title: "Аналитика и торговые идеи",
    short: "Обзоры рынков, уровни, сценарии, идеи с рисками",
    description:
      "Еженедельные торговые идеи и технический анализ ключевых активов Мосбиржи. Уровни, сценарии и торговые условия с указанием рисков — без воды.",
    bullets: [
      "Торговые идеи по акциям РФ",
      "Анализ сырьевых и металлических фьючерсов",
      "Глобальный рынок и геополитика",
      "Условия входа, цели, риски",
    ],
    cta: "Смотреть аналитику",
    accent: "#FFD700",
    glow: "rgba(255,200,0,0.25)",
    grad: "from-[#FFD700] to-[#FF8C00]",
    isRoute: true,
  },
  {
    id: "reflexions",
    href: "/reflections",
    icon: "Brain",
    title: "Рефлексии трейдера",
    short: "Психология, дисциплина, работа с убытками",
    description:
      "Глубокие статьи о психологии торговли, дисциплине и работе с эмоциями. Потому что успех в трейдинге на 80% — это работа над собой.",
    bullets: [
      "Работа с эмоциями в убыточных сделках",
      "Как выработать торговую дисциплину",
      "Психология решений под давлением",
      "Дневник трейдера: зачем и как вести",
    ],
    cta: "Ко всем рефлексиям",
    accent: "#9B30FF",
    glow: "rgba(155,48,255,0.3)",
    grad: "from-[#9B30FF] to-[#FF2D78]",
    isRoute: true,
  },
  {
    id: "contests",
    href: "/tournaments",
    icon: "Trophy",
    title: "Конкурсы и турниры",
    short: "Виртуальная торговля, рейтинг, призы",
    description:
      "Соревнования на виртуальных счетах — проверь стратегии без риска. Турнирная таблица в реальном времени, недельные и месячные чемпионаты.",
    bullets: [
      "Виртуальный счёт для соревнований",
      "Live-турнирная таблица",
      "Недельные и месячные чемпионаты",
      "Разборы стратегий победителей",
    ],
    cta: "Смотреть турниры",
    accent: "#FF8C00",
    glow: "rgba(255,140,0,0.3)",
    grad: "from-[#FF8C00] to-[#FF2D78]",
    isRoute: true,
  },
  {
    id: "vip",
    href: "/vip",
    icon: "Crown",
    title: "VIP-клуб RTrader",
    short: "Закрытое комьюнити, сигналы, разборы портфеля",
    description:
      "Эксклюзивный доступ к закрытым торговым сигналам, разборам портфеля в реальном времени и прямым консультациям с автором.",
    bullets: [
      "Закрытое комьюнити трейдеров",
      "Регулярная аналитика и сигналы",
      "Структурированные разборы сделок",
      "Прямой доступ к автору и поддержка",
    ],
    cta: "Узнать о VIP-клубе",
    accent: "#FF2D78",
    glow: "rgba(255,45,120,0.35)",
    grad: "from-[#FF2D78] to-[#9B30FF]",
    isRoute: true,
  },
  {
    id: "education",
    href: "/education",
    icon: "BookOpen",
    title: "Обучение и база знаний",
    short: "Структурированный курс от основ до стратегий",
    description:
      "Структурированный курс от базовых принципов рынка до продвинутых стратегий торговли. Видеоуроки, разборы сделок, тесты.",
    bullets: [
      "Основы теханализа и фундаментала",
      "Торговля фьючерсами на сырьё и металлы",
      "Психология и риск-менеджмент",
      "Разборы реальных сделок",
    ],
    cta: "Перейти к обучению",
    accent: "#4169FF",
    glow: "rgba(65,105,255,0.3)",
    grad: "from-[#4169FF] to-[#9B30FF]",
    isRoute: true,
  },
];

const REVIEWS_TEXT = [
  {
    name: "Алексей М.",
    status: "VIP-клуб",
    badge: "vip",
    text: "Торгую фьючерсами уже год после обучения здесь. Самое ценное — живые разборы сделок и честный взгляд на риски. Без воды и пустых обещаний. Автор объясняет не «как стать миллионером», а как не потерять то, что есть.",
  },
  {
    name: "Дмитрий К.",
    status: "Участник комьюнити",
    badge: "community",
    text: "Нашёл RTrader когда уже слил депозит дважды. Рефлексии трейдера — это отдельная история: читал как книгу про себя. Понял, что проблема была не в стратегии, а в психологии. Рекомендую всем новичкам.",
  },
  {
    name: "Марина С.",
    status: "VIP-клуб",
    badge: "vip",
    text: "Подписалась на VIP скептически. Оказалось — реально работающие сигналы с объяснением логики. Теперь не просто копирую, а понимаю, почему именно эта точка входа. Это меняет всё.",
  },
  {
    name: "Павел Н.",
    status: "Участник комьюнити",
    badge: "community",
    text: "Комьюнити живое и полезное. Обсуждаем сделки в реальном времени, помогаем друг другу разбирать ошибки. Нет токсичности, нет хайпа. Просто трейдеры, которые хотят расти.",
  },
  {
    name: "Виктор О.",
    status: "VIP-клуб",
    badge: "vip",
    text: "Участвовал в первом турнире — занял 3-е место. Честная оценка стратегий, без подтасовок. А главное — разбор итогов от автора. Такого не найти больше нигде бесплатно.",
  },
  {
    name: "Татьяна Р.",
    status: "Участник комьюнити",
    badge: "community",
    text: "Аналитика по нефти и золоту — просто находка. Раньше ориентировалась только на новости, теперь понимаю теханализ. Уровни, которые публикуются, реально работают на графике.",
  },
];

const REVIEWS_SCREENSHOTS = [
  { id: 1, placeholder: true, label: "Отзыв из чата #1" },
  { id: 2, placeholder: true, label: "Отзыв из чата #2" },
  { id: 3, placeholder: true, label: "Отзыв из чата #3" },
];

const ECOSYSTEM = [
  { name: "Telegram", icon: "Send", url: TG_URL, color: "#00E5FF" },
  { name: "Dzen", icon: "Newspaper", url: "https://dzen.ru", color: "#FF8C00" },
  { name: "VK", icon: "Users", url: "https://vk.com", color: "#4169FF" },
  { name: "RuTube", icon: "Play", url: "https://rutube.ru", color: "#FF2D78" },
];

const FAQ_ITEMS = [
  {
    q: "Для кого RTrader?",
    a: "Для начинающих и опытных трейдеров, торгующих на Мосбирже: акции, фьючерсы на сырьё, металлы, продовольствие. Подойдёт тем, кто хочет систематизировать подход и найти сообщество единомышленников.",
  },
  {
    q: "Чем VIP-клуб отличается от бесплатного контента?",
    a: "В VIP-клубе — закрытые торговые сигналы в реальном времени, разборы портфеля автора, приватные стратегии и прямой доступ к консультациям. Бесплатный контент — это аналитика, статьи и материалы по психологии.",
  },
  {
    q: "Как участвовать в конкурсах?",
    a: "Регистрируешься, получаешь виртуальный счёт и торгуешь. Результаты отображаются в реальном времени в общей турнирной таблице. Без реальных денег — только стратегия и мастерство.",
  },
  {
    q: "Какие рынки покрывает RTrader?",
    a: "Фокус — Московская биржа: акции РФ, фьючерсы на нефть, газ, золото, металлы, зерновые. Также следим за глобальным рынком и геополитикой.",
  },
  {
    q: "Где найти все материалы RTrader?",
    a: "Всё основное живёт здесь, на rtrader11.ru. Telegram-канал дублирует публикации. Dzen, VK и RuTube — часть экосистемы, там появляется дополнительный контент.",
  },
];

function ReviewsSection() {
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <section id="reviews">
      <Reveal>
        <div className="glass-card p-8 md:p-10">
          <div className="text-xs text-white/25 uppercase tracking-widest font-semibold mb-2">Что говорят участники</div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <h2 className="font-russo text-2xl md:text-3xl text-white">Отзывы</h2>
            <p className="text-white/35 text-sm font-light max-w-sm">
              Реальные отклики участников комьюнити и VIP-клуба
            </p>
          </div>

          {/* Текстовые отзывы */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
            {REVIEWS_TEXT.map((r, i) => (
              <div key={i} className="review-card p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full brand-gradient-bg flex items-center justify-center text-black font-russo text-xs font-black">
                      {r.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/85">{r.name}</div>
                      <div className="text-xs text-white/35">{r.status}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.badge === "vip" ? "bg-[#FF2D78]/15 text-[#FF2D78] border border-[#FF2D78]/30" : "bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/25"}`}>
                    {r.badge === "vip" ? "VIP" : "Комьюнити"}
                  </span>
                </div>
                <div className="flex gap-0.5 mb-1">
                  {[...Array(5)].map((_, s) => (
                    <Icon key={s} name="Star" size={12} style={{ color: "#FFD700", fill: "#FFD700" }} />
                  ))}
                </div>
                <p className="text-white/55 text-sm leading-relaxed font-light flex-1">{r.text}</p>
              </div>
            ))}
          </div>

          {/* Скриншоты из Telegram */}
          <div className="border-t border-white/8 pt-8">
            <div className="text-xs text-white/25 uppercase tracking-widest font-semibold mb-4">Скриншоты из чата</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {REVIEWS_SCREENSHOTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setLightbox(s.id)}
                  className="screenshot-card group relative overflow-hidden rounded-xl aspect-[4/3] flex items-center justify-center"
                >
                  {/* Placeholder — заменить на реальный img src */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#9B30FF]/8 to-[#00E5FF]/8" />
                  <div className="relative z-10 flex flex-col items-center gap-3 text-white/30 group-hover:text-white/60 transition-colors">
                    <Icon name="MessageSquare" size={32} />
                    <span className="text-xs font-semibold">{s.label}</span>
                    <span className="text-xs opacity-60">Нажмите для просмотра</span>
                  </div>
                  <div className="absolute inset-0 border border-[#9B30FF]/20 group-hover:border-[#9B30FF]/50 rounded-xl transition-colors" />
                </button>
              ))}
            </div>
            <p className="text-white/20 text-xs mt-3 font-light">
              * Для добавления реальных скриншотов — замените placeholder-блоки на <code className="text-white/35">&lt;img&gt;</code> с нужными URL
            </p>
          </div>
        </div>
      </Reveal>

      {/* Лайтбокс */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="glass-card p-8 max-w-lg w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-white/40 text-sm mb-4">Скриншот #{lightbox}</div>
            <div className="aspect-[4/3] bg-gradient-to-br from-[#9B30FF]/10 to-[#00E5FF]/10 rounded-xl flex items-center justify-center mb-4">
              <div className="flex flex-col items-center gap-3 text-white/30">
                <Icon name="MessageSquare" size={48} />
                <span className="text-sm">Место для скриншота из чата</span>
              </div>
            </div>
            <button onClick={() => setLightbox(null)}
              className="neon-btn-outline text-sm px-6 py-2">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function useIntersection(ref: React.RefObject<Element>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return visible;
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref as React.RefObject<Element>);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function Sparkline({ color, up }: { color: string; up: boolean }) {
  const points = up
    ? "0,20 10,16 20,18 30,12 40,14 50,8 60,10 70,6 80,8 90,4 100,2"
    : "0,2 10,6 20,4 30,8 40,6 50,12 60,10 70,14 80,12 90,16 100,18";
  const id = `g${color.replace("#", "")}`;
  return (
    <svg viewBox="0 0 100 22" className="w-16 h-5" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,22 ${points} 100,22`} fill={`url(#${id})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MiniDashboard() {
  return (
    <div className="hidden lg:flex flex-col gap-3 w-72 xl:w-80 flex-shrink-0">
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-white/40 uppercase tracking-widest font-semibold">RI-6.25</div>
            <div className="font-russo text-white text-xl">112 450</div>
          </div>
          <span className="text-green-400 text-sm font-bold">+1.4%</span>
        </div>
        <div className="w-full h-14">
          <svg viewBox="0 0 200 48" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9B30FF" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#9B30FF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              points="0,48 0,36 20,28 40,32 60,20 80,24 100,14 120,16 140,8 160,10 180,4 200,6 200,48"
              fill="url(#chartGrad)"
            />
            <polyline
              points="0,36 20,28 40,32 60,20 80,24 100,14 120,16 140,8 160,10 180,4 200,6"
              fill="none" stroke="#9B30FF" strokeWidth="1.5" strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-white/25">Индекс РТС</span>
          <span className="text-xs text-white/25">сегодня</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Комьюнити", val: "2.5K", icon: "Users", color: "#00E5FF" },
          { label: "Аналитика", val: "47", icon: "TrendingUp", color: "#FFD700" },
          { label: "Турниры", val: "12", icon: "Trophy", color: "#FF8C00" },
        ].map((item) => (
          <div key={item.label} className="glass-card p-3 flex flex-col gap-1.5">
            <Icon name={item.icon} size={14} style={{ color: item.color }} />
            <div className="font-russo text-white text-base leading-none">{item.val}</div>
            <div className="text-white/30 text-xs">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="glass-card p-3 space-y-2">
        {TICKER_ITEMS.slice(0, 4).map((t) => (
          <div key={t.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-russo text-white/60 w-20">{t.name}</span>
              <Sparkline color={t.up ? "#4ade80" : "#f87171"} up={t.up} />
            </div>
            <span className={`text-xs font-bold ${t.up ? "text-green-400" : "text-red-400"}`}>{t.change}</span>
          </div>
        ))}
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
  const pausedRef = useRef(false);      // true = пауза (hover карточки / drag)
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(0);          // синхронная копия active для interval
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

  // Запуск / остановка таймера
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

  // Автоплей стартует сразу при монтировании
  useEffect(() => {
    startTimer();
    return () => {
      stopTimer();
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, [startTimer, stopTimer]);

  // Пауза при hover карточки
  const onCardEnter = (i: number) => {
    setHoveredCard(i);
    pausedRef.current = true;
  };
  const onCardLeave = () => {
    setHoveredCard(null);
    pausedRef.current = false;
  };

  // Временная пауза при ручном действии (стрелки, drag)
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

  const next = () => {
    pauseTemporary();
    scrollToIdx(activeRef.current + 1);
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

export default function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const tickerDouble = [...TICKER_ITEMS, ...TICKER_ITEMS];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const routerNavigate = useNavigate();
  const navTo = (href: string, isRoute?: boolean) => {
    setMenuOpen(false);
    if (isRoute) {
      routerNavigate(href);
    } else {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="neon-grid-bg min-h-screen text-white font-montserrat">

      {/* NAV */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/70 backdrop-blur-xl border-b border-white/10" : "bg-transparent"}`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navTo("#hero")} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg brand-gradient-bg flex items-center justify-center shadow-lg">
              <span className="font-russo text-black text-sm font-black">RT</span>
            </div>
            <span className="font-russo text-xl tracking-wider">R<span className="brand-gradient">TRADER</span></span>
          </button>

          <div className="hidden xl:flex items-center gap-5">
            {NAV_ITEMS.map((item) => (
              <button key={item.href} onClick={() => navTo(item.href, item.isRoute)} className="nav-link">{item.label}</button>
            ))}
          </div>

          <div className="hidden xl:flex items-center gap-3">
            <a href={TG_URL} target="_blank" rel="noopener noreferrer"
              className="neon-btn-outline text-xs px-3 py-2 flex items-center gap-1.5">
              <Icon name="Send" size={13} /> Telegram
            </a>
            <a href={VIP_URL} target="_blank" rel="noopener noreferrer"
              className="neon-btn text-xs px-4 py-2 flex items-center gap-1.5">
              <Icon name="Crown" size={13} /> VIP-клуб
            </a>
          </div>

          <button className="xl:hidden p-2 text-white/70 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <Icon name={menuOpen ? "X" : "Menu"} size={24} />
          </button>
        </div>

        {menuOpen && (
          <div className="xl:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 px-4 py-6">
            <div className="flex flex-col gap-3">
              {NAV_ITEMS.map((item) => (
                <button key={item.href} onClick={() => navTo(item.href, item.isRoute)}
                  className="text-left nav-link text-base py-2 border-b border-white/5">{item.label}</button>
              ))}
              <div className="flex gap-3 pt-4">
                <a href={TG_URL} target="_blank" rel="noopener noreferrer" className="neon-btn-outline flex-1 text-center text-sm py-2">Telegram</a>
                <a href={VIP_URL} target="_blank" rel="noopener noreferrer" className="neon-btn flex-1 text-center text-sm py-2">VIP-клуб</a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section id="hero" className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-24">
        {/* Moscow skyline — AI-generated neon retrowav image */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Само изображение — правая половина, снизу */}
          <img
            src="https://cdn.poehali.dev/projects/39a4ac3c-06be-41f0-97f1-cc3959260964/files/4b1069f6-e9ad-462d-9ecb-0fa02243b605.jpg"
            alt=""
            className="absolute bottom-0 right-0 h-[78%] w-auto object-contain object-right-bottom select-none"
            style={{ opacity: 0.55, mixBlendMode: "screen" }}
          />
          {/* Маска: затухание снизу */}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(6,5,26,0.85) 0%, rgba(6,5,26,0.3) 25%, transparent 55%)" }} />
          {/* Неоновое свечение под изображением */}
          <div className="absolute bottom-0 right-0 w-[65%] h-48 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 65% bottom, rgba(0,229,255,0.1) 0%, rgba(155,48,255,0.1) 50%, transparent 75%)" }} />
        </div>

        {/* Тёмный оверлей слева — текст читается поверх города */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to right, rgba(6,5,26,0.95) 0%, rgba(6,5,26,0.82) 38%, rgba(6,5,26,0.4) 60%, rgba(6,5,26,0.05) 80%, transparent 100%)" }} />

        {/* Ambient glows */}
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
                <a href={VIP_URL} target="_blank" rel="noopener noreferrer"
                  className="neon-btn text-sm px-6 py-3 flex items-center gap-2">
                  <Icon name="Crown" size={16} />
                  Войти в VIP-клуб
                </a>
                <Link to="/education"
                  className="text-sm text-white/40 hover:text-white/75 transition-colors underline underline-offset-4 decoration-white/20 hover:decoration-white/50 flex items-center gap-1.5 px-2">
                  Перейти к обучению
                  <Icon name="ArrowRight" size={13} />
                </Link>
              </div>
            </div>

            <MiniDashboard />
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

      {/* MAIN BLOCKS */}
      <main className="container mx-auto px-4 space-y-6 pb-20">
        {SECTIONS.map((section, idx) => (
          <section key={section.id} id={section.id}>
            <Reveal delay={idx * 50}>
              <div className="glass-card p-8 md:p-10">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${section.grad}`}
                        style={{ boxShadow: `0 0 20px ${section.glow}` }}
                      >
                        <Icon name={section.icon} size={20} className="text-white" />
                      </div>
                      <div>
                        <div className="text-xs text-white/25 uppercase tracking-widest font-semibold">
                          {String(idx + 1).padStart(2, "0")}
                        </div>
                        <h2 className="font-russo text-white text-xl leading-tight">{section.title}</h2>
                      </div>
                    </div>
                    <p className="text-white/50 leading-relaxed mb-6 font-light text-sm max-w-lg">
                      {section.description}
                    </p>
                    <Link
                      to={section.href}
                      className="neon-btn-outline text-sm px-5 py-2.5 inline-flex items-center gap-2"
                    >
                      {section.cta} <Icon name="ArrowRight" size={14} />
                    </Link>
                  </div>
                  <div className="flex-shrink-0 w-full md:w-64 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2">
                    {section.bullets.map((b, i) => (
                      <div key={i} className="flex items-start gap-2.5 py-2 border-b border-white/5 last:border-0">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: `${section.accent}22`, border: `1px solid ${section.accent}44` }}>
                          <Icon name="Check" size={11} style={{ color: section.accent }} />
                        </div>
                        <span className="text-xs text-white/55 leading-relaxed">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </section>
        ))}

        {/* VIP BANNER */}
        <Reveal>
          <div className="vip-card p-10 md:p-14 text-center relative overflow-hidden animate-glow-pulse">
            <div className="absolute inset-0 bg-gradient-to-br from-[#9B30FF]/10 to-[#FF2D78]/10 pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-[#FFD700] text-sm font-semibold mb-3">
                <Icon name="Crown" size={16} /> Закрытый клуб
              </div>
              <h2 className="font-russo text-3xl md:text-4xl text-white mb-3">
                Готов торговать на следующем уровне?
              </h2>
              <p className="text-white/40 mb-7 max-w-lg mx-auto font-light text-sm">
                Закрытое комьюнити, регулярная аналитика, разборы портфеля и прямой контакт с автором.
              </p>
              <Link to="/vip"
                className="neon-btn inline-flex items-center gap-2 text-base px-8 py-3.5">
                <Icon name="Crown" size={18} /> Узнать о VIP-клубе
              </Link>
            </div>
          </div>
        </Reveal>

        {/* AUTHOR */}
        <section id="author">
          <Reveal>
            <div className="glass-card p-8 md:p-10">
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl brand-gradient-bg flex items-center justify-center text-3xl animate-float"
                    style={{ boxShadow: "0 0 30px rgba(155,48,255,0.3)" }}>
                    📈
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-white/25 uppercase tracking-widest font-semibold mb-2">Об авторе</div>
                  <h2 className="font-russo text-2xl md:text-3xl text-white mb-3">
                    RTrader — это <span className="brand-gradient">живой опыт</span>
                  </h2>
                  <p className="text-white/48 text-sm leading-relaxed font-light mb-4 max-w-2xl">
                    Практикующий трейдер Московской биржи с 7-летним стажем. Торгую акции и фьючерсы
                    на сырьё, металлы, продовольствие. Слежу за глобальным рынком и геополитикой —
                    потому что они задают фон для каждой сделки. RTrader создан не как очередной
                    инфо-проект, а как рабочий инструмент.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["7 лет на рынке", "МосБиржа", "Фьючерсы", "Психология трейдинга"].map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold border border-white/10 bg-white/5 text-white/45">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* REVIEWS */}
        <ReviewsSection />

        {/* ECOSYSTEM */}
        <Reveal>
          <div className="glass-card p-8 md:p-10">
            <div className="text-xs text-white/25 uppercase tracking-widest font-semibold mb-2">Внешние площадки</div>
            <h2 className="font-russo text-2xl md:text-3xl text-white mb-6">Экосистема RTrader</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {ECOSYSTEM.map((item) => (
                <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                  className="glass-card p-5 flex flex-col items-center gap-3 text-center group hover:scale-105 transition-transform duration-200">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${item.color}22`, border: `1px solid ${item.color}44`, boxShadow: `0 0 16px ${item.color}33` }}>
                    <Icon name={item.icon} size={18} style={{ color: item.color }} />
                  </div>
                  <span className="text-sm font-semibold text-white/60 group-hover:text-white transition-colors">{item.name}</span>
                </a>
              ))}
            </div>
          </div>
        </Reveal>

        {/* FAQ */}
        <section id="faq">
          <Reveal>
            <div className="glass-card p-8 md:p-10">
              <div className="text-xs text-white/25 uppercase tracking-widest font-semibold mb-2">Вопросы и ответы</div>
              <h2 className="font-russo text-2xl md:text-3xl text-white mb-6">FAQ</h2>
              <div className="space-y-2">
                {FAQ_ITEMS.map((faq, i) => (
                  <div key={i}
                    className="border border-white/8 rounded-xl overflow-hidden cursor-pointer hover:border-white/15 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <div className="flex items-center justify-between p-5">
                      <span className="text-white/85 font-semibold text-sm pr-4">{faq.q}</span>
                      <Icon name={openFaq === i ? "ChevronUp" : "ChevronDown"} size={16}
                        className="text-[#9B30FF] flex-shrink-0 transition-transform duration-200" />
                    </div>
                    {openFaq === i && (
                      <div className="px-5 pb-5 text-white/45 text-sm leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* CONTACTS */}
        <Reveal>
          <div className="glass-card p-8 md:p-10 text-center">
            <div className="text-xs text-white/25 uppercase tracking-widest font-semibold mb-2">Связаться</div>
            <h2 className="font-russo text-2xl md:text-3xl text-white mb-3">Остались вопросы?</h2>
            <p className="text-white/40 text-sm mb-6 font-light">Напиши в Telegram — ответим быстро</p>
            <a href={TG_URL} target="_blank" rel="noopener noreferrer"
              className="neon-btn-outline inline-flex items-center gap-2">
              <Icon name="Send" size={16} /> Написать в Telegram
            </a>
          </div>
        </Reveal>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/6 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg brand-gradient-bg flex items-center justify-center">
                <span className="font-russo text-black text-xs font-black">RT</span>
              </div>
              <div>
                <div className="font-russo text-white text-sm tracking-wider">RTRADER</div>
                <div className="text-xs text-white/20">rtrader11.ru</div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              {NAV_ITEMS.map((item) => (
                <button key={item.href} onClick={() => navTo(item.href, item.isRoute)}
                  className="text-xs text-white/22 hover:text-white/60 transition-colors font-medium uppercase tracking-widest">
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {ECOSYSTEM.map((item) => (
                <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg glass-card flex items-center justify-center transition-all hover:scale-110"
                  style={{ color: item.color }} title={item.name}>
                  <Icon name={item.icon} size={14} />
                </a>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/18">
            <span>© 2026 RTrader. Материалы носят информационный характер и не являются инвестиционными рекомендациями.</span>
            <span>Торговля на бирже сопряжена с риском потери капитала.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}