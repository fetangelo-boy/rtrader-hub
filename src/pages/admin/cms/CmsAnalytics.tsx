import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { cmsGet, cmsCreate, cmsUpdate, cmsToggleVisible, cmsDelete } from "@/lib/adminCms";

const SECTION = "analytics";
const CATS = ["Акции РФ", "Нефть и газ", "Металлы", "Валюта"];
const RISKS = ["низкий", "средний", "высокий"];

interface Item {
  id: number; instrument: string; title: string; category: string;
  direction: string; entry: string; target: string; stop: string;
  risk: string; description: string; is_visible: boolean;
}

const empty = (): Omit<Item, "id"> => ({
  instrument: "", title: "", category: "Акции РФ", direction: "long",
  entry: "", target: "", stop: "", risk: "средний", description: "", is_visible: true,
});

export default function CmsAnalytics() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState(empty());
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const d = await cmsGet(SECTION);
    setItems(d.items || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty()); setEditing(null); setIsNew(true); };
  const openEdit = (item: Item) => {
    setForm({ instrument: item.instrument, title: item.title, category: item.category,
              direction: item.direction, entry: item.entry, target: item.target,
              stop: item.stop, risk: item.risk, description: item.description,
              is_visible: item.is_visible });
    setEditing(item); setIsNew(false);
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
    if (!confirm("Удалить идею?")) return;
    await cmsDelete(SECTION, id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const f = (k: keyof typeof form, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Admin → CMS</div>
          <h1 className="font-russo text-2xl text-white flex items-center gap-2">
            <Icon name="TrendingUp" size={20} style={{ color: "#FFD700" }} /> Аналитика и торговые идеи
          </h1>
        </div>
        <button onClick={openNew} className="neon-btn text-xs px-4 py-2 flex items-center gap-1.5">
          <Icon name="Plus" size={13} /> Добавить идею
        </button>
      </div>

      {(isNew || editing) && (
        <div className="glass-card p-6 mb-6 border-[#FFD700]/25">
          <div className="text-xs text-white/40 uppercase tracking-widest mb-4">
            {isNew ? "Новая торговая идея" : "Редактировать"}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Инструмент *</label>
              <input value={form.instrument} onChange={e => f("instrument", e.target.value)}
                placeholder="SBER"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFD700]/40" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Категория</label>
              <select value={form.category} onChange={e => f("category", e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Направление</label>
              <select value={form.direction} onChange={e => f("direction", e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                <option value="long">LONG</option>
                <option value="short">SHORT</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Риск</label>
              <select value={form.risk} onChange={e => f("risk", e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                {RISKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs text-white/40 mb-1 block">Заголовок *</label>
            <input value={form.title} onChange={e => f("title", e.target.value)}
              placeholder="Сбербанк: пробой уровня 320"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFD700]/40" />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {(["entry", "target", "stop"] as const).map(k => (
              <div key={k}>
                <label className="text-xs text-white/40 mb-1 block capitalize">
                  {k === "entry" ? "Вход" : k === "target" ? "Цель" : "Стоп"}
                </label>
                <input value={form[k]} onChange={e => f(k, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
            ))}
          </div>
          <div className="mb-4">
            <label className="text-xs text-white/40 mb-1 block">Описание</label>
            <textarea rows={2} value={form.description} onChange={e => f("description", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving || !form.instrument || !form.title}
              className="neon-btn text-xs px-5 py-2 disabled:opacity-40">
              {saving ? "Сохраняю..." : "Сохранить"}
            </button>
            <button onClick={closeForm} className="text-xs text-white/40 hover:text-white px-3 py-2">Отмена</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-white/30 text-sm flex items-center gap-2"><Icon name="Loader2" size={14} className="animate-spin" /> Загружаю...</div>
      ) : items.length === 0 ? (
        <div className="glass-card p-8 text-center text-white/30 text-sm">Торговых идей пока нет</div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(item => (
            <div key={item.id} className={`glass-card p-4 flex items-start gap-4 ${!item.is_visible ? "opacity-50" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-russo text-sm text-[#FFD700]">{item.instrument}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${item.direction === "long" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                    {item.direction.toUpperCase()}
                  </span>
                  <span className="text-xs text-white/30">{item.category}</span>
                  {!item.is_visible && <span className="text-xs text-white/25">скрыто</span>}
                </div>
                <div className="font-semibold text-white/85 text-sm truncate">{item.title}</div>
                <div className="text-xs text-white/30 mt-1">
                  Вход: {item.entry} · Цель: {item.target} · Стоп: {item.stop} · Риск: {item.risk}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(item)} className="p-1.5 text-white/30 hover:text-white rounded-lg hover:bg-white/5"><Icon name="Pencil" size={13} /></button>
                <button onClick={() => toggle(item)} className="p-1.5 text-white/30 hover:text-white rounded-lg hover:bg-white/5"><Icon name={item.is_visible ? "Eye" : "EyeOff"} size={13} /></button>
                <button onClick={() => remove(item.id)} className="p-1.5 text-red-400/50 hover:text-red-400 rounded-lg hover:bg-red-500/10"><Icon name="Trash2" size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
