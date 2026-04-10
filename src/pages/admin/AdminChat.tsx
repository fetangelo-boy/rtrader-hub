import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { getAdminToken } from "@/hooks/useAdminAuth";

const ADMIN_URL = "https://functions.poehali.dev/58c8224f-b1da-4e1a-9c7a-09bf808c3c47";

interface ChatMessage {
  id: number;
  text: string;
  nickname: string;
  role: string;
  created_at: string;
  is_hidden: boolean;
  source: "public" | "club";
  channel?: string;
  user_id?: number | null;
  image_url?: string | null;
}

interface BannedNick {
  nickname: string;
  banned_at: string;
  banned_by: string | null;
}

function authHeaders() {
  return { "Content-Type": "application/json", "X-Auth-Token": getAdminToken() };
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return new Date(iso).toLocaleDateString("ru-RU");
}

const ROLE_COLOR: Record<string, string> = {
  admin: "text-cyan-400",
  vip: "text-yellow-400",
  member: "text-white/60",
};

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
  vip: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  member: "bg-white/5 text-white/40 border-white/10",
};

export default function AdminChat() {
  const [source, setSource] = useState<"public" | "club">("public");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [bans, setBans] = useState<BannedNick[]>([]);
  const [tab, setTab] = useState<"messages" | "bans">("messages");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    const params = new URLSearchParams({ action: "chat_messages", source, limit: "150" });
    if (search) params.set("search", search);
    const res = await fetch(`${ADMIN_URL}?${params}`, { headers: authHeaders() });
    const data = await res.json();
    setMessages(data.messages || []);
    setLoading(false);
  }, [source, search]);

  const fetchBans = useCallback(async () => {
    const res = await fetch(`${ADMIN_URL}?action=chat_banned_nicks`, { headers: authHeaders() });
    const data = await res.json();
    setBans(data.bans || []);
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => { if (tab === "bans") fetchBans(); }, [tab, fetchBans]);

  const deleteOne = async (id: number) => {
    await fetch(`${ADMIN_URL}?action=chat_delete`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ message_id: id }),
    });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_hidden: true } : m));
    toast("Сообщение скрыто");
  };

  const deleteBulk = async () => {
    if (!selected.size) return;
    const ids = Array.from(selected);
    const res = await fetch(`${ADMIN_URL}?action=chat_delete_bulk`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ message_ids: ids }),
    });
    const data = await res.json();
    setMessages((prev) => prev.map((m) => selected.has(m.id) ? { ...m, is_hidden: true } : m));
    setSelected(new Set());
    toast(data.message || "Скрыто");
  };

  const banNick = async (nickname: string) => {
    if (!confirm(`Забанить ник «${nickname}»? Все его сообщения будут скрыты.`)) return;
    const res = await fetch(`${ADMIN_URL}?action=chat_ban_nick`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ nickname }),
    });
    const data = await res.json();
    toast(data.message || "Забанен");
    fetchMessages();
    if (tab === "bans") fetchBans();
  };

  const unbanNick = async (nickname: string) => {
    const res = await fetch(`${ADMIN_URL}?action=chat_unban_nick`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ nickname }),
    });
    const data = await res.json();
    toast(data.message || "Разбанен");
    fetchBans();
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const selectAll = () => {
    const visible = filtered.filter((m) => !m.is_hidden);
    setSelected(new Set(visible.map((m) => m.id)));
  };

  const filtered = messages.filter((m) => showHidden || !m.is_hidden);

  return (
    <div className="p-6 flex flex-col gap-5 min-h-full">
      {/* Заголовок */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-russo tracking-wider text-white">Модерация чата</h1>
          <p className="text-xs text-white/30 mt-0.5">Удаление сообщений, бан ников, блокировка спама</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("messages")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${tab === "messages" ? "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20" : "text-white/40 border-white/10 hover:text-white"}`}
          >
            <Icon name="MessageSquare" size={13} className="inline mr-1" />Сообщения
          </button>
          <button
            onClick={() => setTab("bans")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${tab === "bans" ? "bg-red-500/10 text-red-400 border-red-500/20" : "text-white/40 border-white/10 hover:text-white"}`}
          >
            <Icon name="Ban" size={13} className="inline mr-1" />Баны
            {bans.length > 0 && <span className="ml-1 bg-red-500/20 text-red-400 text-[10px] px-1.5 rounded-full">{bans.length}</span>}
          </button>
        </div>
      </div>

      {tab === "messages" && (
        <>
          {/* Фильтры */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1 bg-white/5 border border-white/8 rounded-xl p-1">
              {(["public", "club"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setSource(s); setSearch(""); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${source === s ? "bg-[#FFD700]/15 text-[#FFD700]" : "text-white/40 hover:text-white"}`}
                >
                  {s === "public" ? "Публичный" : "VIP-клуб"}
                </button>
              ))}
            </div>

            <div className="flex-1 min-w-[180px] relative">
              <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchMessages()}
                placeholder="Поиск по тексту или нику..."
                className="w-full bg-white/5 border border-white/8 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-white/20"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer select-none">
              <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} className="accent-yellow-400" />
              Показать скрытые
            </label>

            <button onClick={fetchMessages} className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all" title="Обновить">
              <Icon name="RefreshCw" size={14} />
            </button>
          </div>

          {/* Панель массового действия */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="text-xs text-red-400 font-medium">Выбрано: {selected.size}</span>
              <button onClick={deleteBulk} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-all">
                <Icon name="Trash2" size={12} />Скрыть выбранные
              </button>
              <button onClick={() => setSelected(new Set())} className="text-xs text-white/30 hover:text-white ml-auto transition-colors">
                Снять выделение
              </button>
            </div>
          )}

          {/* Список сообщений */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-white/30 text-sm py-16">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white/25 py-16 gap-2">
              <Icon name="MessageSquareOff" size={32} />
              <span className="text-sm">Сообщений нет</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 px-2 pb-1 text-[11px] text-white/25">
                <button onClick={selectAll} className="hover:text-white/50 transition-colors">Выбрать все</button>
                <span>· {filtered.length} сообщений</span>
              </div>

              {filtered.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                    msg.is_hidden
                      ? "bg-white/2 border-white/5 opacity-40"
                      : selected.has(msg.id)
                      ? "bg-red-500/8 border-red-500/20"
                      : "bg-white/3 border-white/8 hover:bg-white/5"
                  }`}
                >
                  {/* Чекбокс */}
                  <input
                    type="checkbox"
                    disabled={msg.is_hidden}
                    checked={selected.has(msg.id)}
                    onChange={() => toggleSelect(msg.id)}
                    className="mt-0.5 accent-yellow-400 shrink-0 cursor-pointer"
                  />

                  {/* Тело сообщения */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-xs font-bold ${ROLE_COLOR[msg.role] || "text-white/60"}`}>
                        {msg.nickname}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${ROLE_BADGE[msg.role] || ROLE_BADGE.member}`}>
                        {msg.role === "admin" ? "ADMIN" : msg.role === "vip" ? "VIP" : "гость"}
                      </span>
                      {msg.channel && (
                        <span className="text-[10px] text-white/25">#{msg.channel}</span>
                      )}
                      <span className="text-[10px] text-white/25 ml-auto">{timeAgo(msg.created_at)}</span>
                      {msg.is_hidden && (
                        <span className="text-[10px] text-red-400/70 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">скрыто</span>
                      )}
                    </div>
                    <p className="text-sm text-white/80 break-words leading-snug">{msg.text}</p>
                    {msg.image_url && (
                      <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400/70 hover:text-blue-400 mt-1 inline-flex items-center gap-1">
                        <Icon name="Image" size={11} />картинка
                      </a>
                    )}
                  </div>

                  {/* Кнопки действий */}
                  {!msg.is_hidden && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => deleteOne(msg.id)}
                        title="Скрыть сообщение"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Icon name="EyeOff" size={13} />
                      </button>
                      {msg.source === "public" && (
                        <button
                          onClick={() => banNick(msg.nickname)}
                          title={`Забанить ник «${msg.nickname}»`}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-orange-400 hover:bg-orange-500/10 transition-all"
                        >
                          <Icon name="Ban" size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "bans" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/30">Забаненные ники не могут писать в публичный чат. Все их сообщения скрыты.</p>
            <button onClick={fetchBans} className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all" title="Обновить">
              <Icon name="RefreshCw" size={14} />
            </button>
          </div>

          {bans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-white/25">
              <Icon name="ShieldCheck" size={32} />
              <span className="text-sm">Забаненных ников нет</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {bans.map((ban) => (
                <div key={ban.nickname} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/15">
                  <Icon name="Ban" size={15} className="text-red-400/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-red-400">{ban.nickname}</span>
                    <p className="text-[11px] text-white/25 mt-0.5">
                      {timeAgo(ban.banned_at)}{ban.banned_by ? ` · администратор ${ban.banned_by}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => unbanNick(ban.nickname)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-green-400 hover:border-green-400/30 hover:bg-green-400/5 transition-all"
                  >
                    Разбанить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm border border-white/15 text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2">
          <Icon name="CheckCircle" size={15} className="text-green-400 shrink-0" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}