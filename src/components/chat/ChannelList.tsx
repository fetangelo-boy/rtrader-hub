import { cn } from "@/lib/utils";
import Icon from "@/components/ui/icon";
import type { Channel } from "@/types/chat";

interface Props {
  channels: Channel[];
  activeId: string | null;
  onSelect: (channel: Channel) => void;
}

const CATEGORY_LABELS: Record<Channel["category"], string> = {
  trading: "Торговля",
  general: "Общее",
  vip: "VIP",
};

const categoryOrder: Channel["category"][] = ["trading", "general", "vip"];

export default function ChannelList({ channels, activeId, onSelect }: Props) {
  const grouped = categoryOrder.reduce<Record<string, Channel[]>>((acc, cat) => {
    acc[cat] = channels.filter((c) => c.category === cat);
    return acc;
  }, {} as Record<string, Channel[]>);

  return (
    <div className="flex flex-col h-full overflow-y-auto py-2">
      {categoryOrder.map((cat) => {
        const group = grouped[cat];
        if (!group?.length) return null;
        return (
          <div key={cat} className="mb-2">
            <p className="px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white/30 select-none">
              {CATEGORY_LABELS[cat]}
            </p>
            {group.map((ch) => (
              <button
                key={ch.id}
                onClick={() => onSelect(ch)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg mx-1 text-sm transition-all",
                  "text-white/60 hover:text-white hover:bg-white/5",
                  activeId === ch.id && "bg-white/10 text-white"
                )}
              >
                <Icon name={ch.icon as never} size={15} className="shrink-0 opacity-70" />
                <span className="flex-1 text-left truncate"># {ch.name}</span>
                {ch.unreadCount > 0 && (
                  <span className="bg-neon-yellow text-black text-xs font-bold rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center">
                    {ch.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}