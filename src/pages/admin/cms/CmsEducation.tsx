import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { cmsGet, cmsCreate, cmsUpdate, cmsToggleVisible, cmsDelete } from "@/lib/adminCms";

const SECTION = "education";
const LEVELS = ["Начинающий", "Средний", "Продвинутый", "Любой"];

interface Item {
  id: number; number: string; title: string; description: string;
  lessons: number; duration: string; level: string; topics: string;
  is_free: boolean; is_visible: boolean;
}

const empty = (): Omit<Item, "id"> => ({
  number: "", title: "", description: "", lessons: 0,
  duration: "", level: "Начинающий", topics: "", is_free: false, is_visible: true,
});

export default function CmsEducation() {
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
    setForm({ number: item.number, title: item.title, description: item.description,
              lessons: item.lessons, duration: item.duration, level: item.level,
              topics: item.topics, is_free: item.is_free, is_visible: item.is_visible });
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
    if (!confirm("Удалить модуль?")) return;
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
            <Icon name="BookOpen" size={20} style={{ color: "#4169FF" }} /> Обучение
          </h1>
        </div>
        <button onClick={openNew} className="neon-btn text-xs px-4 py-2 flex items-center gap-1.5">
          <Icon name="Plus" size={13} /> Добавить модуль
        </button>
      </div>

      {(isNew || editing) && (
        <div className="glass-card p-6 mb-6 border-[#4169FF]/25">
          <div className="text-xs text-white/40 uppercase tracking-widest mb-4">
            {isNew ? "Новый модуль" : "Редактировать"}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Номер</label>
              <input value={form.number} onChange={e => f("number", e.target.value)} placeholder="01"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Уроков</label>
              <input type="number" value={form.lessons} onChange={e => f("lessons", +e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Длительность</label>
              <input value={form.duration} onChange={e => f("duration", e.target.value)} placeholder="4 часа"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Уровень</label>
              <select value={form.level} onChange={e => f("level", e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs text-white/40 mb-1 block">Название *</label>
            <input value={form.title} onChange={e => f("title", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4169FF]/40" />
          </div>
          <div className="mb-3">
            <label className="text-xs text-white/40 mb-1 block">Описание</label>
            <textarea rows={2} value={form.description} onChange={e => f("description", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none resize-none" />
          </div>
          <div className="mb-4">
            <label className="text-xs text-white/40 mb-1 block">Темы (через запятую)</label>
            <input value={form.topics} onChange={e => f("topics", e.target.value)}
              placeholder="Тема 1, Тема 2, Тема 3"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-white/60">
              <input type="checkbox" checked={form.is_free} onChange={e => f("is_free", e.target.checked)}
                className="w-4 h-4 accent-green-500" />
              Бесплатный доступ
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving || !form.title}
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
        <div className="glass-card p-8 text-center text-white/30 text-sm">Модулей пока нет</div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(item => (
            <div key={item.id} className={`glass-card p-4 flex items-start gap-4 ${!item.is_visible ? "opacity-50" : ""}`}>
              <div className="w-9 h-9 rounded-lg bg-[#4169FF]/15 border border-[#4169FF]/25 flex items-center justify-center font-russo text-[#4169FF] text-sm flex-shrink-0">
                {item.number || "—"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-white/85 text-sm">{item.title}</span>
                  {item.is_free
                    ? <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/15 text-green-400">Бесплатно</span>
                    : <span className="text-xs px-1.5 py-0.5 rounded bg-[#FFD700]/10 text-[#FFD700]">VIP</span>}
                  {!item.is_visible && <span className="text-xs text-white/25">скрыто</span>}
                </div>
                <div className="text-xs text-white/30">{item.level} · {item.lessons} уроков · {item.duration}</div>
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
