export const NAV_ITEMS = [
  { id: "intraday",    label: "Интрадей и мысли", icon: "Lightbulb",    type: "readonly", desc: "Текущие торговые идеи автора" },
  { id: "chat",        label: "Общий чат",         icon: "MessageSquare",type: "chat",     desc: "Общение всех подписчиков" },
  { id: "metals",      label: "Металлы",            icon: "Gem",          type: "chat",     desc: "Идеи и обсуждение металлов" },
  { id: "oil",         label: "Газ / Нефть",        icon: "Flame",        type: "chat",     desc: "Идеи по нефти и газу" },
  { id: "products",    label: "Продукты",           icon: "Wheat",        type: "chat",     desc: "Сельхозтовары и сырьё" },
  { id: "video",       label: "Видео-обзоры",       icon: "Video",        type: "readonly", desc: "Обзоры рынка от автора" },
  { id: "tech",        label: "Техвопросы",         icon: "Wrench",       type: "chat",     desc: "Технические вопросы" },
  { id: "access_info", label: "Доступ",             icon: "KeyRound",     type: "readonly", desc: "Инструкции по доступу и VPN" },
  { id: "knowledge",   label: "База знаний",        icon: "BookOpen",     type: "readonly", desc: "Обучающие материалы" },
  { id: "subscribe",   label: "Подписка",           icon: "CreditCard",   type: "payment",  desc: "Тарифы и оплата" },
];

export const TICKER_DATA = [
  { sym: "XAU/USD", price: "2 347.80", change: "+0.42%" },
  { sym: "XAG/USD", price: "27.84",    change: "-0.18%" },
  { sym: "BRENT",   price: "83.15",    change: "+1.12%" },
  { sym: "WTI",     price: "78.92",    change: "+0.87%" },
  { sym: "NG",      price: "2.431",    change: "-0.55%" },
  { sym: "BTC/USD", price: "67 420",   change: "+2.31%" },
  { sym: "EUR/USD", price: "1.0842",   change: "-0.09%" },
  { sym: "S&P 500", price: "5 248.80", change: "+0.33%" },
];
