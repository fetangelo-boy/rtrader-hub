import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { cmsGet, cmsCreate, cmsUpdate, cmsToggleVisible, cmsDelete } from "@/lib/adminCms";
import ImageUpload from "@/components/admin/ImageUpload";

const SECTION = "analytics";
const CATS = ["Акции РФ", "Нефть и газ", "Металлы", "Валюта", "Криптовалюта"];
const RISKS = ["низкий", "средний", "высокий"];


interface MediaItem { type: "image" | "audio" | "video" | "link"; url: string; label?: string; }

interface Item {
  id: number; type: string; instrument: string; title: string; category: string;
  direction: string; entry: string; target: string; stop: string; risk: string;
  description: string; body: string; tags: string; video_url: string;
  image_url: string; media_items: MediaItem[]; is_visible: boolean; sort_order: number;
}

const emptySignal = (): Omit<Item, "id"> => ({
  type: "signal", instrument: "", title: "", category: "Акции РФ",
  direction: "long", entry: "", target: "", stop: "", risk: "средний",
  description: "", body: "", tags: "", video_url: "", image_url: "", media_items: [], is_visible: true, sort_order: 0,
});

const emptyReview = (): Omit<Item, "id"> => ({
  type: "review", instrument: "", title: "", category: "Акции РФ",
  direction: "long", entry: "", target: "", stop: "", risk: "средний",
  description: "", body: "", tags: "", video_url: "", image_url: "", media_items: [], is_visible: true, sort_order: 0,
});

export default function CmsAnalytics() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState(emptySignal());
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newType, setNewType] = useState<"signal" | "review">("signal");

  const load = async () => {
    setLoading(true);
    const d = await cmsGet(SECTION);
    setItems(d.items || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = (type: "signal" | "review") => {
    setNewType(type);
    setForm(type === "signal" ? emptySignal() : emptyReview());
    setEditing(null); setIsNew(true); window.scrollTo(0, 0);
  };
  const openEdit = (item: Item) => {
    setForm({
      type: item.type || "signal", instrument: item.instrument, title: item.title,
      category: item.category, direction: item.direction, entry: item.entry,
      target: item.target, stop: item.stop, risk: item.risk,
      description: item.description, body: item.body || "",
      tags: item.tags || "", video_url: item.video_url || "",
      image_url: item.image_url || "",
      media_items: Array.isArray(item.media_items) ? item.media_items : [],
      is_visible: item.is_visible, sort_order: item.sort_order,
    });
    setEditing(item); setIsNew(false); window.scrollTo(0, 0);
  };
  const closeForm = () => { setEditing(null); setIsNew(false); };

  const save = async () => {
    setSaving(true);
    if (isNew) await cmsCreate(SECTION, form);
    else if (editing) await cmsUpdate(SECTION, editing.id, form);
    await load(); setSaving(false); closeForm();
  };

  const toggle = async (item: Item) => {
    await cmsToggleVisible(SECTION, item.id, !item.is_visible);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_visible: !i.is_visible } : i));
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить запись?")) return;
    await cmsDelete(SECTION, id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const f = (k: keyof typeof form, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));
  const currentType = form.type || "signal";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Admin → CMS</div>
          <h1 className="font-russo text-2xl text-white flex items-center gap-2">
            <Icon name="TrendingUp" size={20} style={{ color: "#FFD700" }} /> Аналитика
          </h1>
        </div>
        {!isNew && !editing && (
          <div className="flex gap-2">
            <button onClick={() => openNew("signal")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-green-500/30 bg-green-500/8 text-green-400 text-xs font-semibold hover:bg-green-500/15 transition-all">
              <Icon name="Plus" size={13} /> Торговый сигнал
            </button>
            <button onClick={() => openNew("review")}
              className="neon-btn text-xs px-4 py-2 flex items-center gap-1.5">
              <Icon name="Plus" size={13} /> Обзор
            </button>
          </div>
        )}
      </div>

      {(isNew || editing) && (
        <div className={`glass-card p-6 mb-6 ${currentType === "signal" ? "border-green-500/20" : "border-[#FFD700]/25"}`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="text-xs text-white/40 uppercase tracking-widest">
                {currentType === "signal" ? "Торговый сигнал" : "Обзор / Аналитика"}
              </div>
              {!editing && (
                <div className="flex gap-1 p-0.5 bg-white/5 rounded-lg">
                  {(["signal", "review"] as const).map(t => (
                    <button key={t} type="button"
                      onClick={() => { f("type", t); }}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${form.type === t ? "bg-white/10 text-white" : "text-white/30 hover:text-white"}`}>
                      {t === "signal" ? "Сигнал" : "Обзор"}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={closeForm} className="text-white/30 hover:text-white transition-colors">
              <Icon name="X" size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Заголовок */}
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Заголовок *</label>
              <input value={form.title} onChange={e => f("title", e.target.value)}
                placeholder={currentType === "signal" ? "Сбербанк: пробой 320" : "Обзор рынка на неделю"}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700]/40 transition-colors" />
            </div>

            {/* Поля сигнала */}
            {currentType === "signal" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Тикер *</label>
                    <input value={form.instrument} onChange={e => f("instrument", e.target.value)}
                      placeholder="SBER"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Категория</label>
                    <select value={form.category} onChange={e => f("category", e.target.value)}
                      className="w-full bg-[#0a0a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                      {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Направление</label>
                    <div className="flex gap-1 p-0.5 bg-white/5 rounded-xl h-10">
                      {["long", "short"].map(d => (
                        <button key={d} type="button" onClick={() => f("direction", d)}
                          className={`flex-1 rounded-lg text-xs font-bold transition-all ${
                            form.direction === d
                              ? d === "long" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                              : "text-white/30 hover:text-white"
                          }`}>
                          {d.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Риск</label>
                    <select value={form.risk} onChange={e => f("risk", e.target.value)}
                      className="w-full bg-[#0a0a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                      {RISKS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(["entry", "target", "stop"] as const).map(k => (
                    <div key={k}>
                      <label className="text-xs text-white/40 mb-1.5 block">
                        {k === "entry" ? "Вход" : k === "target" ? "Цель" : "Стоп"}
                      </label>
                      <input value={form[k]} onChange={e => f(k, e.target.value)}
                        placeholder="320.50"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-colors" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Краткое обоснование</label>
                  <textarea rows={3} value={form.description} onChange={e => f("description", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none resize-y" />
                </div>
              </>
            )}

            {/* Поля обзора */}
            {currentType === "review" && (
              <>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">
                    Ссылка на видео
                    <span className="text-white/20 ml-2">— YouTube, Rutube, VK</span>
                  </label>
                  <input value={form.video_url} onChange={e => f("video_url", e.target.value)}
                    placeholder="https://rutube.ru/video/..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700]/40 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Текст (необязательно)</label>
                  <textarea rows={4} value={form.body} onChange={e => f("body", e.target.value)}
                    placeholder="Краткое описание обзора..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none resize-none" />
                </div>
              </>
            )}

            {/* Изображение — только для сигналов */}
            {currentType === "signal" && (
              <div>
                <label className="text-xs text-white/40 mb-2 block">График / скриншот</label>
                <ImageUpload value={form.image_url} onChange={v => f("image_url", v)} />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 border-t border-white/8">
              <button onClick={save} disabled={saving || !form.title}
                className="neon-btn text-sm px-6 py-2.5 disabled:opacity-40">
                {saving ? "Сохраняю..." : "Сохранить"}
              </button>
              <button onClick={closeForm} className="text-sm text-white/40 hover:text-white px-3 py-2 transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-white/30 text-sm flex items-center gap-2 py-8">
          <Icon name="Loader2" size={14} className="animate-spin" /> Загружаю...
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-10 text-center text-white/30 text-sm">Записей пока нет</div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(item => {
            const isSignal = (item.type || "signal") === "signal";
            const tagList = (item.tags || "").split(",").map(t => t.trim()).filter(Boolean);
            return (
              <div key={item.id}
                className={`glass-card p-4 flex items-start gap-4 transition-all ${!item.is_visible ? "opacity-40" : ""}`}>
                {item.image_url && (
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isSignal ? "bg-green-500/15 text-green-400" : "bg-[#FFD700]/15 text-[#FFD700]"}`}>
                      {isSignal ? "СИГНАЛ" : "ОБЗОР"}
                    </span>
                    {isSignal && item.instrument && (
                      <span className="font-russo text-sm text-[#FFD700]">{item.instrument}</span>
                    )}
                    {isSignal && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${item.direction === "long" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                        {item.direction?.toUpperCase()}
                      </span>
                    )}
                    {tagList.map(t => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded-md bg-white/5 text-white/40">{t}</span>
                    ))}
                    {!item.is_visible && <span className="text-xs text-white/25 italic">скрыто</span>}
                  </div>
                  <div className="font-semibold text-white/85 text-sm">{item.title}</div>
                  {isSignal && (
                    <div className="text-xs text-white/30 mt-0.5">
                      Вход: {item.entry} · Цель: {item.target} · Стоп: {item.stop} · Риск: {item.risk}
                    </div>
                  )}
                  {!isSignal && item.body && (
                    <div className="text-xs text-white/30 mt-0.5 line-clamp-1">{item.body}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(item)} className="p-1.5 text-white/30 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                    <Icon name="Pencil" size={13} />
                  </button>
                  <button onClick={() => toggle(item)} className={`p-1.5 rounded-lg transition-all ${item.is_visible ? "text-green-400/70 hover:text-green-400" : "text-white/25 hover:text-white"}`}>
                    <Icon name={item.is_visible ? "Eye" : "EyeOff"} size={13} />
                  </button>
                  <button onClick={() => remove(item.id)} className="p-1.5 text-red-400/40 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all">
                    <Icon name="Trash2" size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}