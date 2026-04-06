export const PAYMENT_DETAILS = {
  cardNumber: "5536 9138 8189 0954",
  recipient: "Зерянский Роман Олегович",
  bank: "Т-Банк",
  comment: "Подписка RTrading",
  instructions: "После оплаты отправьте скриншот чека администратору в Telegram: @zeryansky7, указав ваш email от аккаунта. Доступ открывается вручную в течение нескольких часов.",
  adminTelegram: "@zeryansky7",
};

export const PLANS = [
  {
    id: "week",
    label: "1 неделя",
    days: 7,
    price: 1700,
    per: "1 700 ₽ / нед",
    badge: null as string | null,
  },
  {
    id: "month",
    label: "1 месяц",
    days: 30,
    price: 4000,
    per: "4 000 ₽ / мес",
    badge: null as string | null,
  },
  {
    id: "quarter",
    label: "3 месяца",
    days: 90,
    price: 10300,
    per: "3 433 ₽ / мес",
    badge: "−14%",
  },
  {
    id: "halfyear",
    label: "Полгода",
    days: 180,
    price: 20000,
    per: "3 333 ₽ / мес",
    badge: "−17%",
  },
  {
    id: "loyal",
    label: "Постоянный подписчик",
    days: 30,
    price: 3400,
    per: "3 400 ₽ / мес",
    badge: "−15%",
    adminOnly: true,
  },
];

export const FEATURES = [
  "Ежедневные торговые идеи от автора",
  "Чаты по металлам, нефти, газу, продовольствию",
  "Видео-обзоры рынков",
  "База знаний по трейдингу",
  "Техническая поддержка",
];
