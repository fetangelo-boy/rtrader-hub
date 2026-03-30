import type { User, Channel, Message } from "@/types/chat";

export const MOCK_CURRENT_USER: User = {
  id: "me",
  name: "Вы",
  initials: "ВЫ",
  role: "member",
  isOnline: true,
};

export const MOCK_USERS: User[] = [
  { id: "u1", name: "Алексей М.", initials: "АМ", role: "vip", isOnline: true },
  { id: "u2", name: "Дмитрий К.", initials: "ДК", role: "admin", isOnline: true },
  { id: "u3", name: "Сергей П.", initials: "СП", role: "member", isOnline: false },
  { id: "u4", name: "Наталья В.", initials: "НВ", role: "vip", isOnline: true },
  { id: "u5", name: "Игорь Т.", initials: "ИТ", role: "member", isOnline: false },
  { id: "u6", name: "Анна Р.", initials: "АР", role: "member", isOnline: true },
];

export const MOCK_CHANNELS: Channel[] = [
  {
    id: "general",
    name: "general",
    description: "Общие обсуждения трейдинга",
    icon: "Hash",
    unreadCount: 3,
    lastMessage: "Смотрю на Si, похоже разворот",
    lastMessageAt: "14:32",
    category: "general",
  },
  {
    id: "intraday",
    name: "intraday",
    description: "Внутридневная торговля",
    icon: "TrendingUp",
    unreadCount: 7,
    lastMessage: "Мосбиржа открылась ростом +1.2%",
    lastMessageAt: "14:45",
    category: "trading",
  },
  {
    id: "metals",
    name: "metals",
    description: "Золото, серебро, платина",
    icon: "Gem",
    unreadCount: 0,
    lastMessage: "Gold пробил 2400",
    lastMessageAt: "13:10",
    category: "trading",
  },
  {
    id: "futures",
    name: "futures",
    description: "Фьючерсы и деривативы",
    icon: "BarChart2",
    unreadCount: 2,
    lastMessage: "RTS январь — откроемся где?",
    lastMessageAt: "12:50",
    category: "trading",
  },
  {
    id: "psychology",
    name: "psychology",
    description: "Психология трейдера",
    icon: "Brain",
    unreadCount: 0,
    lastMessage: "Главное — не торговать на эмоциях",
    lastMessageAt: "11:00",
    category: "general",
  },
  {
    id: "vip-signals",
    name: "vip-сигналы",
    description: "Эксклюзивные сигналы для VIP",
    icon: "Star",
    unreadCount: 5,
    lastMessage: "Лонг Si от 88.40, цель 89.00",
    lastMessageAt: "14:55",
    category: "vip",
  },
];

const makeMessages = (channelId: string, items: Omit<Message, "channelId">[]): Message[] =>
  items.map((m) => ({ ...m, channelId }));

export const MOCK_MESSAGES: Record<string, Message[]> = {
  general: makeMessages("general", [
    { id: "g1", author: MOCK_USERS[1], text: "Доброе утро, трейдеры! Сегодня нефть открылась чуть выше вчерашнего закрытия.", createdAt: "09:01" },
    { id: "g2", author: MOCK_USERS[0], text: "Да, Brent уже +0.8%. Посмотрим что будет на американской сессии.", createdAt: "09:05" },
    { id: "g3", author: MOCK_USERS[2], text: "Индекс МБ вчера закрылся в минусе, сегодня пока нейтрально", createdAt: "09:12" },
    { id: "g4", author: MOCK_USERS[3], text: "Смотрю на Si, похоже разворот готовится. Буду ждать подтверждения.", createdAt: "14:32" },
  ]),
  intraday: makeMessages("intraday", [
    { id: "i1", author: MOCK_USERS[1], text: "Мосбиржа открылась ростом +1.2%, объёмы хорошие", createdAt: "10:00" },
    { id: "i2", author: MOCK_USERS[4], text: "Газпром пробил уровень 165, торгую лонг", createdAt: "10:14" },
    { id: "i3", author: MOCK_USERS[0], text: "Осторожно, может быть ложный пробой. Смотрю на объём.", createdAt: "10:16" },
    { id: "i4", author: MOCK_USERS[5], text: "Я закрыл половину позиции на 165.50, жду откат", createdAt: "10:25" },
    { id: "i5", author: MOCK_USERS[1], text: "Правильное решение. Выход частями — грамотный риск-менеджмент.", createdAt: "10:27" },
    { id: "i6", author: MOCK_USERS[2], text: "Сбербанк тоже двигается, смотрите на 285+", createdAt: "14:45" },
  ]),
  metals: makeMessages("metals", [
    { id: "m1", author: MOCK_USERS[0], text: "Gold пробил 2400 — исторический максимум", createdAt: "13:00" },
    { id: "m2", author: MOCK_USERS[3], text: "Да, геополитика давит. Серебро тоже растёт.", createdAt: "13:05" },
    { id: "m3", author: MOCK_USERS[1], text: "Платина отстаёт, интересная ситуация для спреда.", createdAt: "13:10" },
  ]),
  futures: makeMessages("futures", [
    { id: "f1", author: MOCK_USERS[4], text: "RTS январь — откроемся где по вашим прогнозам?", createdAt: "12:50" },
    { id: "f2", author: MOCK_USERS[0], text: "Технически вижу 110–112 как ближайшее сопротивление", createdAt: "12:55" },
    { id: "f3", author: MOCK_USERS[2], text: "Согласен, но на нефти будет зависеть сильно", createdAt: "13:00" },
  ]),
  psychology: makeMessages("psychology", [
    { id: "p1", author: MOCK_USERS[1], text: "Главное правило: не торговать на эмоциях после серии убыточных сделок.", createdAt: "11:00" },
    { id: "p2", author: MOCK_USERS[3], text: "Я ставлю лимит на день — 3 сделки максимум. Помогает сохранять дисциплину.", createdAt: "11:15" },
    { id: "p3", author: MOCK_USERS[5], text: "У меня дневник трейдера сильно помог. Начал видеть паттерны своих ошибок.", createdAt: "11:30" },
  ]),
  "vip-signals": makeMessages("vip-signals", [
    { id: "v1", author: MOCK_USERS[1], text: "🎯 Сигнал: Лонг Si от 88.40, стоп 87.90, цель 89.00. R/R = 1:1.2", createdAt: "14:00" },
    { id: "v2", author: MOCK_USERS[0], text: "Вошёл по 88.42, спасибо!", createdAt: "14:05" },
    { id: "v3", author: MOCK_USERS[3], text: "Тоже в позиции. Жду цели.", createdAt: "14:10" },
    { id: "v4", author: MOCK_USERS[1], text: "Цена идёт в нашу сторону, держим позицию.", createdAt: "14:30" },
    { id: "v5", author: MOCK_USERS[1], text: "🏆 Цель достигнута! +60 пунктов. Закрываем.", createdAt: "14:55" },
  ]),
};
