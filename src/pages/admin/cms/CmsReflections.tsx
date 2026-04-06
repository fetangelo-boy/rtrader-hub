import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { cmsGet, cmsCreate, cmsUpdate, cmsToggleVisible, cmsDelete } from "@/lib/adminCms";

const SECTION = "reflections";
const TAGS = ["Психология", "Дисциплина", "Эмоции"];

interface Item {
  id: number; title: string; tag: string; read_time: string;
  preview: string; is_visible: boolean; sort_order: number;
}

const empty = (): Omit<Item, "id"> => ({
  title: "", tag: "Психология", read_time: "5 мин",
  preview: "", is_visible: true, sort_order: 0,
});

export default function CmsReflections() {
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
    setForm({ title: item.title, tag: item.tag, read_time: item.read_time,
              preview: item.preview, is_visible: item.is_visible, sort_order: item.sort_order });
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
    if (!confirm("Удалить запись?")) return;
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
            <Icon name="Brain" size={20} style={{ color: "#9B30FF" }} /> Рефлексии трейдера
          </h1>
        </div>
        <button onClick={openNew} className="neon-btn text-xs px-4 py-2 flex items-center gap-1.5">
          <Icon name="Plus" size={13} /> Добавить статью
        </button>
      </div>

      {(isNew || editing) && (
        <div className="glass-card p-6 mb-6 border-[#9B30FF]/30">
          <div className="text-xs text-white/40 uppercase tracking-widest mb-4">
            {isNew ? "Новая статья" : "Редактировать"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-xs text-white/40 mb-1 block">Заголовок *</label>
              <input value={form.title} onChange={e => f("title", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#9B30FF]/50" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Тег</label>
              <select value={form.tag} onChange={e => f("tag", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Время чтения</label>
              <input value={form.read_time} onChange={e => f("read_time", e.target.value)}
                placeholder="5 мин"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-white/40 mb-1 block">Превью-текст</label>
              <textarea rows={3} value={form.preview} onChange={e => f("preview", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none resize-none" />
            </div>
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
        <div className="glass-card p-8 text-center text-white/30 text-sm">Статей пока нет — добавь первую</div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(item => (
            <div key={item.id} className={`glass-card p-4 flex items-start gap-4 ${!item.is_visible ? "opacity-50" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#9B30FF]/15 text-[#9B30FF] border border-[#9B30FF]/25">{item.tag}</span>
                  <span className="text-xs text-white/30">{item.read_time}</span>
                  {!item.is_visible && <span className="text-xs text-white/25">скрыто</span>}
                </div>
                <div className="font-semibold text-white/85 text-sm truncate">{item.title}</div>
                {item.preview && <div className="text-xs text-white/35 mt-1 line-clamp-1">{item.preview}</div>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(item)} className="p-1.5 text-white/30 hover:text-white rounded-lg hover:bg-white/5">
                  <Icon name="Pencil" size={13} />
                </button>
                <button onClick={() => toggle(item)} className="p-1.5 text-white/30 hover:text-white rounded-lg hover:bg-white/5">
                  <Icon name={item.is_visible ? "Eye" : "EyeOff"} size={13} />
                </button>
                <button onClick={() => remove(item.id)} className="p-1.5 text-red-400/50 hover:text-red-400 rounded-lg hover:bg-red-500/10">
                  <Icon name="Trash2" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
