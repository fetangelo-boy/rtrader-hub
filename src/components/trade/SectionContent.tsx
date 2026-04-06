import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { RoleBadge, UserAvatar } from "./Shared";
import { useAuth } from "@/context/AuthContext";
import { PLANS, FEATURES, PAYMENT_DETAILS } from "@/config/subscription";
import func2url from "../../../backend/func2url.json";

const CHAT_URL = (func2url as Record<string, string>).chat;
const SUBS_URL = (func2url as Record<string, string>).subscriptions;
const POLL_INTERVAL = 5000;

interface ChatMessage {
  id: number;
  text: string;
  created_at: string;
  nickname: string;
  role: string;
}

export function ChatSection({ sectionId, title, readonly = false }: { sectionId: string; title: string; readonly?: boolean }) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const latestIdRef = useRef<number>(0);

  const canWrite = !readonly || user?.role === "owner" || user?.role === "admin";

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async (initial = false) => {
    if (!token) return;
    try {
      const res = await fetch(`${CHAT_URL}?action=messages&channel=${sectionId}&limit=60`, {
        headers: { "X-Auth-Token": token },
      });
      if (!res.ok) return;
      const data = await res.json();
      const newMsgs: ChatMessage[] = data.messages || [];
      if (newMsgs.length === 0) { setLoading(false); return; }

      const maxId = Math.max(...newMsgs.map(m => m.id));
      if (maxId > latestIdRef.current) {
        latestIdRef.current = maxId;
        setMessages(newMsgs);
        if (initial || isAtBottomRef.current) {
          setTimeout(scrollToBottom, 0);
        }
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [token, sectionId]);

  useEffect(() => {
    setMessages([]);
    latestIdRef.current = 0;
    setLoading(true);
    fetchMessages(true);
  }, [fetchMessages]);

  useEffect(() => {
    const interval = setInterval(() => fetchMessages(), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const handleScroll = () => {
      isAtBottomRef.current = scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 10;
    };
    scroll.addEventListener("scroll", handleScroll);
    return () => scroll.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSend = async () => {
    if (!msg.trim() || !canWrite || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`${CHAT_URL}?action=send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
        body: JSON.stringify({ channel: sectionId, text: msg.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Ошибка отправки");
        return;
      }
      setMsg("");
      await fetchMessages();
    } catch {
      setError("Ошибка отправки");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    await fetch(`${CHAT_URL}?action=delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token },
      body: JSON.stringify({ message_id: id }),
    });
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  };

  const groupedMessages = messages.reduce((acc, m) => {
    const date = m.created_at.slice(0, 10);
    if (!acc[date]) acc[date] = [];
    acc[date].push(m);
    return acc;
  }, {} as Record<string, ChatMessage[]>);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className="font-medium text-sm text-foreground">{title}</span>
        {readonly && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">только чтение</span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Icon name="MessageSquare" size={32} />
            <span className="text-sm">Сообщений пока нет</span>
          </div>
        )}
        {!loading && Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground px-2">{formatDate(msgs[0].created_at)}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {msgs.map(m => (
              <div key={m.id} className="flex items-start gap-2 py-1 group hover:bg-muted/30 rounded px-1 -mx-1">
                <UserAvatar name={m.nickname} role={m.role} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-medium text-foreground">{m.nickname}</span>
                    <RoleBadge role={m.role} />
                    <span className="text-[10px] text-muted-foreground">{formatTime(m.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground/90 break-words whitespace-pre-wrap">{m.text}</p>
                </div>
                {(user?.role === "owner" || user?.role === "admin") && (
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Icon name="Trash2" size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {canWrite && (
        <div className="p-3 border-t border-border">
          {error && <p className="text-xs text-destructive mb-1">{error}</p>}
          <div className="flex items-end gap-2">
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Написать сообщение..."
              rows={1}
              className="flex-1 bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleSend}
              disabled={sending || !msg.trim()}
              className="p-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Icon name="Send" size={16} />
            </button>
          </div>
        </div>
      )}

      {!canWrite && readonly && (
        <div className="p-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">Этот канал только для чтения</p>
        </div>
      )}
    </div>
  );
}

export function SubscribeSection() {
  const { token, refreshSubscription } = useAuth();
  const [step, setStep] = useState<"plans" | "pay" | "sent">("plans");
  const [selectedPlan, setSelectedPlan] = useState("quarter");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const plan = PLANS.find(p => p.id === selectedPlan)!;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceipt(file);
    const reader = new FileReader();
    reader.onload = () => setReceiptPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!receipt) { setError("Загрузи чек об оплате"); return; }
    setError("");
    setLoading(true);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res((reader.result as string).split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(receipt);
      });
      const resp = await fetch(`${SUBS_URL}?action=request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
        body: JSON.stringify({
          plan: selectedPlan,
          receipt_base64: b64,
          receipt_mime: receipt.type || "image/jpeg",
        }),
      });
      const d = await resp.json();
      if (!resp.ok) { setError(d.error || "Ошибка отправки"); return; }
      setStep("sent");
      refreshSubscription();
    } catch {
      setError("Ошибка отправки");
    } finally {
      setLoading(false);
    }
  };

  if (step === "sent") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon name="CheckCircle" size={32} className="text-primary" />
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground">Заявка отправлена</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Ваш чек получен. Администратор проверит оплату и откроет доступ в течение нескольких часов.
          По вопросам: {PAYMENT_DETAILS.adminTelegram}
        </p>
      </div>
    );
  }

  if (step === "pay") {
    return (
      <div className="flex flex-col h-full overflow-y-auto p-4 gap-4 max-w-md mx-auto w-full">
        <button onClick={() => setStep("plans")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <Icon name="ChevronLeft" size={16} /> Назад
        </button>
        <h3 className="font-semibold text-foreground">Оплата: {plan.label}</h3>

        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{plan.price.toLocaleString()} ₽</p>
            <p className="text-xs text-muted-foreground">{plan.per}</p>
          </div>
          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Банк</span>
              <span className="text-foreground font-medium">{PAYMENT_DETAILS.bank}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Получатель</span>
              <span className="text-foreground font-medium">{PAYMENT_DETAILS.recipient}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Номер карты</span>
              <span className="font-mono font-medium text-primary">{PAYMENT_DETAILS.cardNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Сумма</span>
              <span className="text-foreground font-bold">{plan.price.toLocaleString()} ₽</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Комментарий</span>
              <span className="text-foreground">{PAYMENT_DETAILS.comment}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{PAYMENT_DETAILS.instructions}</p>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Загрузите скриншот чека</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
          >
            {receiptPreview ? (
              <img src={receiptPreview} alt="чек" className="max-h-40 mx-auto rounded" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Icon name="Upload" size={24} />
                <span>Нажмите для загрузки</span>
              </div>
            )}
          </button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !receipt}
          className="w-full py-3 rounded bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Отправка..." : "Отправить заявку"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-4">
      <div className="text-center py-2">
        <h3 className="font-display text-lg font-semibold text-foreground uppercase tracking-wide">Подписка RTrading CLUB</h3>
        <p className="text-sm text-muted-foreground mt-1">Выберите тариф</p>
      </div>

      <div className="grid gap-3 max-w-md mx-auto w-full">
        {PLANS.filter(p => !("adminOnly" in p && p.adminOnly)).map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPlan(p.id)}
            className={`w-full border rounded-lg p-4 text-left transition-colors ${
              selectedPlan === p.id
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{p.label}</span>
                  {p.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">{p.badge}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{p.per}</p>
              </div>
              <p className="text-xl font-bold text-primary">{p.price.toLocaleString()} ₽</p>
            </div>
          </button>
        ))}
      </div>

      <div className="max-w-md mx-auto w-full space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Что входит:</p>
        {FEATURES.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
            <Icon name="Check" size={14} className="text-primary flex-shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>

      <div className="max-w-md mx-auto w-full">
        <button
          onClick={() => setStep("pay")}
          className="w-full py-3 rounded bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          Оплатить {PLANS.find(p => p.id === selectedPlan)?.price.toLocaleString()} ₽
        </button>
      </div>
    </div>
  );
}
