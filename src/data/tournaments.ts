export const tournamentsData = {
  title: "Конкурсы и турниры",
  subtitle: "Виртуальная торговля, честный рейтинг, разборы стратегий",
  description:
    "Соревнования на виртуальных счетах — проверяй стратегии без риска реальных денег. Турнирная таблица в реальном времени.",

  current: [
    {
      id: "1",
      name: "Январский чемпионат 2025",
      status: "active" as const,
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      participants: 87,
      prize: "Разбор портфеля от автора",
      instrument: "Все инструменты МБ",
      description: "Месячный чемпионат на виртуальных счетах. Учитывается доходность, просадка и количество сделок.",
      accent: "#FFD700",
    },
    {
      id: "2",
      name: "Недельный спринт #12",
      status: "upcoming" as const,
      startDate: "2025-01-20",
      endDate: "2025-01-26",
      participants: 0,
      prize: "Месяц VIP-клуба",
      instrument: "Фьючерсы на нефть и газ",
      description: "Недельный турнир специально по сырьевым фьючерсам. Для тех, кто торгует BR и NG.",
      accent: "#00E5FF",
    },
  ],

  leaderboard: [
    { rank: 1, name: "Алексей М.", result: "+38.4%", trades: 24, badge: "vip" as const },
    { rank: 2, name: "Виктор О.", result: "+31.2%", trades: 18, badge: "vip" as const },
    { rank: 3, name: "Дмитрий К.", result: "+27.8%", trades: 31, badge: "community" as const },
    { rank: 4, name: "Марина С.", result: "+21.5%", trades: 15, badge: "vip" as const },
    { rank: 5, name: "Павел Н.", result: "+19.1%", trades: 22, badge: "community" as const },
    { rank: 6, name: "Татьяна Р.", result: "+16.4%", trades: 19, badge: "community" as const },
    { rank: 7, name: "Игорь Л.", result: "+14.2%", trades: 28, badge: "community" as const },
    { rank: 8, name: "Ольга В.", result: "+11.8%", trades: 12, badge: "community" as const },
  ],

  past: [
    {
      id: "p1",
      name: "Декабрьский чемпионат 2024",
      winner: "Виктор О.",
      result: "+52.1%",
      participants: 64,
      date: "Декабрь 2024",
    },
    {
      id: "p2",
      name: "Недельный спринт #11",
      winner: "Алексей М.",
      result: "+28.7%",
      participants: 41,
      date: "Январь 2025",
    },
    {
      id: "p3",
      name: "Ноябрьский чемпионат 2024",
      winner: "Дмитрий К.",
      result: "+44.3%",
      participants: 58,
      date: "Ноябрь 2024",
    },
  ],
};
