import { useState, useEffect, useRef } from "react";

export const VIP_URL = "/club";
export const TG_URL = "https://t.me/RTrader11";

export const NAV_ITEMS = [
  { label: "Чат", href: "/community", isRoute: true },
  { label: "Аналитика", href: "/analytics", isRoute: true },
  { label: "Рефлексии", href: "/reflections", isRoute: true },
  { label: "Конкурсы", href: "/tournaments", isRoute: true },
  { label: "VIP-клуб", href: "/vip", isRoute: true },
  { label: "Обучение", href: "/education", isRoute: true },
  { label: "Отзывы", href: "/reviews", isRoute: true },
  { label: "Об авторе", href: "#author", isRoute: false },
];

export const TICKER_ITEMS = [
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

export const STATS = [
  { val: "2 500+", label: "трейдеров в сообществе" },
  { val: "7 лет", label: "на рынке" },
  { val: "200+", label: "материалов и разборов" },
  { val: "МосБиржа", label: "основная площадка" },
];

export const SECTIONS = [
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

export const REVIEWS_TEXT = [
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

export const REVIEWS_SCREENSHOTS = [
  { id: 1, placeholder: true, label: "Отзыв из чата #1" },
  { id: 2, placeholder: true, label: "Отзыв из чата #2" },
  { id: 3, placeholder: true, label: "Отзыв из чата #3" },
];

export const ECOSYSTEM = [
  { name: "Telegram", icon: "Send", url: TG_URL, color: "#00E5FF" },
  { name: "Dzen", icon: "Newspaper", url: "https://dzen.ru", color: "#FF8C00" },
  { name: "VK", icon: "Users", url: "https://vk.com", color: "#4169FF" },
  { name: "RuTube", icon: "Play", url: "https://rutube.ru", color: "#FF2D78" },
];

export const FAQ_ITEMS = [
  {
    q: "Для кого RTrader?",
    a: "Для начинающих и опытных трейдеров, торгующих на Мосбирже: акции, фьючерсы на сырьё, металлы, продовольствие. Подойдёт тем, кто хочет систематизировать подход и найти сообщество единомышленников.",
  },
  {
    q: "Чем VIP-клуб отличается от бесплатного контента?",
    a: "В VIP-клубе — закрытые торговые сигналы с обоснованием, разборы портфеля в реальном времени, прямое общение с автором и приоритетная поддержка. Бесплатный контент — аналитика, рефлексии, обучение — доступен всем.",
  },
  {
    q: "Нужен ли опыт для участия?",
    a: "Нет. В комьюнити есть как новички, так и трейдеры с многолетним стажем. Обучение построено от основ до продвинутых стратегий.",
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

export function useIntersection(ref: React.RefObject<Element>) {
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

export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
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

export function Sparkline({ color, up }: { color: string; up: boolean }) {
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