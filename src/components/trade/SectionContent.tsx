import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import { PLANS, FEATURES, PAYMENT_DETAILS } from "@/config/subscription";
import func2url from "../../../backend/func2url.json";
import ChatMessageList from "./ChatMessageList";
import ChatMessageInput from "./ChatMessageInput";
import TelegramLinkBlock from "./TelegramLinkBlock";

const CHAT_URL = (func2url as Record<string, string>).chat;
const SUBS_URL = (func2url as Record<string, string>).subscriptions;
const TG_BOT_URL = (func2url as Record<string, string>)["tg-vip-bot"];
const POLL_INTERVAL = 5000;

interface ChatMessage {
  id: number;
  text: string;
  created_at: string;
  nickname: string;
  role: string;
  reply_to_id?: number | null;
  reply_to_nickname?: string | null;
  reply_to_text?: string | null;
  image_url?: string | null;
}

interface ReplyTo {
  id: number;
  nickname: string;
  text: string;
}

export function ChatSection({ sectionId, title, readonly = false }: { sectionId: string; title: string; readonly?: boolean }) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [expandedImg, setExpandedImg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const latestIdRef = useRef<number>(0);

  const canWrite = !readonly || user?.role === "owner" || user?.role === "admin";
  const isAdmin = user?.role === "owner" || user?.role === "admin";

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async (initial = false) => {
    if (!token) return;
    try {
      const res = await fetch(`${CHAT_URL}?action=messages&channel=${sectionId}&limit=60`, {
        headers: { "X-Auth-Token": token },
      });
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      const newMsgs: ChatMessage[] = data.messages || [];
      if (newMsgs.length === 0) { setLoading(false); return; }

      const maxId = Math.max(...newMsgs.map(m => m.id));
      if (maxId >= latestIdRef.current) {
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

  const attachImage = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    attachImage(file);
    e.target.value = "";
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(i => i.type.startsWith("image/"));
    if (!imageItem) return;
    e.preventDefault();
    const file = imageItem.getAsFile();
    if (file) attachImage(file);
  };

  const handleSend = async () => {
    if ((!msg.trim() && !imageFile) || !canWrite || sending) return;
    setSending(true);
    setError("");
    try {
      let uploadedImageUrl: string | null = null;
      if (imageFile) {
        const b64 = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res((reader.result as string).split(",")[1]);
          reader.onerror = rej;
          reader.readAsDataURL(imageFile);
        });
        const upRes = await fetch(`${CHAT_URL}?action=upload_image`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
          body: JSON.stringify({ image_base64: b64, mime: imageFile.type || "image/jpeg" }),
        });
        const upData = await upRes.json();
        if (!upRes.ok) { setError(upData.error || "Ошибка загрузки фото"); return; }
        uploadedImageUrl = upData.url;
      }
      const res = await fetch(`${CHAT_URL}?action=send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
        body: JSON.stringify({ channel: sectionId, text: msg.trim(), reply_to_id: replyTo?.id ?? null, image_url: uploadedImageUrl }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Ошибка отправки");
        return;
      }
      setMsg("");
      setReplyTo(null);
      setImageFile(null);
      setImagePreview(null);
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

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className="font-medium text-sm text-foreground">{title}</span>
        {readonly && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">только чтение</span>
        )}
      </div>

      <ChatMessageList
        messages={messages}
        loading={loading}
        hoveredId={hoveredId}
        canWrite={canWrite}
        isAdmin={isAdmin}
        expandedImg={expandedImg}
        scrollRef={scrollRef}
        bottomRef={bottomRef}
        onHover={setHoveredId}
        onReply={setReplyTo}
        onDelete={handleDelete}
        onExpandImg={setExpandedImg}
      />

      <ChatMessageInput
        msg={msg}
        sending={sending}
        error={error}
        replyTo={replyTo}
        imagePreview={imagePreview}
        readonly={readonly}
        canWrite={canWrite}
        onMsgChange={setMsg}
        onSend={handleSend}
        onCancelReply={() => setReplyTo(null)}
        onClearImage={() => { setImageFile(null); setImagePreview(null); }}
        onImagePick={handleImagePick}
        onPaste={handlePaste}
      />
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

  const [tgLinked, setTgLinked] = useState<boolean | null>(null);
  const [tgLinkLoading, setTgLinkLoading] = useState(false);
  const [tgLinkUrl, setTgLinkUrl] = useState("");
  const [tgCopied, setTgCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${TG_BOT_URL}?action=status`, { headers: { "X-Auth-Token": token } })
      .then(r => r.json())
      .then(d => setTgLinked(d.linked))
      .catch(() => {});
  }, [token]);

  const handleConnectTg = async () => {
    setTgLinkLoading(true);
    setTgLinkUrl("");
    try {
      const r = await fetch(`${TG_BOT_URL}?action=gen_link`, { headers: { "X-Auth-Token": token || "" } });
      const d = await r.json();
      if (d.url) setTgLinkUrl(d.url);
    } finally { setTgLinkLoading(false); }
  };

  const handleCopyTg = () => {
    navigator.clipboard.writeText(tgLinkUrl);
    setTgCopied(true);
    setTimeout(() => setTgCopied(false), 2000);
  };

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

        <TelegramLinkBlock
          tgLinked={tgLinked}
          tgLinkUrl={tgLinkUrl}
          tgLinkLoading={tgLinkLoading}
          tgCopied={tgCopied}
          compact={false}
          onConnect={handleConnectTg}
          onCopy={handleCopyTg}
          onResetUrl={() => setTgLinkUrl("")}
        />
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

        <TelegramLinkBlock
          tgLinked={tgLinked}
          tgLinkUrl={tgLinkUrl}
          tgLinkLoading={tgLinkLoading}
          tgCopied={tgCopied}
          compact={true}
          onConnect={handleConnectTg}
          onCopy={handleCopyTg}
          onResetUrl={() => setTgLinkUrl("")}
        />

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