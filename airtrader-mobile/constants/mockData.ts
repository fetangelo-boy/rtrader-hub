export type ChatPreview = {
  id: string;
  title: string;
  members: number;
  lastMessage: string;
};

export type ChatMessage = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

export type MarketCard = {
  id: string;
  title: string;
  value: string;
  change: string;
};

export const chatPreviews: ChatPreview[] = [
  {
    id: 'macro-room',
    title: 'Macro Room',
    members: 142,
    lastMessage: 'USD index cooled down after CPI release.',
  },
  {
    id: 'crypto-desk',
    title: 'Crypto Desk',
    members: 89,
    lastMessage: 'Watching BTC 4H retest at 68.2k.',
  },
  {
    id: 'vip-signals',
    title: 'VIP Signals',
    members: 56,
    lastMessage: 'New gold setup published with tight invalidation.',
  },
];

export const marketCards: MarketCard[] = [
  {
    id: 'btc',
    title: 'BTC/USDT',
    value: '68,240',
    change: '+1.8% (24h)',
  },
  {
    id: 'gold',
    title: 'XAU/USD',
    value: '2,356',
    change: '+0.6% (24h)',
  },
  {
    id: 'dxy',
    title: 'DXY',
    value: '104.2',
    change: '-0.3% (24h)',
  },
];

export const messageSeed: Record<string, ChatMessage[]> = {
  'macro-room': [
    {
      id: 'm1',
      author: 'Elena',
      text: 'US10Y is still heavy. Keep risk light before Powell.',
      createdAt: '09:12',
    },
    {
      id: 'm2',
      author: 'Nik',
      text: 'Agreed. DXY reaction defines next swing for indices.',
      createdAt: '09:15',
    },
  ],
  'crypto-desk': [
    {
      id: 'c1',
      author: 'Artem',
      text: 'Liquidity sweep completed above local highs.',
      createdAt: '10:01',
    },
    {
      id: 'c2',
      author: 'Mila',
      text: 'Waiting for confirmation candle to long.',
      createdAt: '10:03',
    },
  ],
  'vip-signals': [
    {
      id: 'v1',
      author: 'Coach Roman',
      text: 'Gold long: entry 2348, stop 2339, TP1 2364.',
      createdAt: '08:47',
    },
  ],
};
