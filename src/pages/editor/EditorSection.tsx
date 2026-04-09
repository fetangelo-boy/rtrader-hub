import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { editorCmsGet, editorCmsCreate, editorCmsUpdate, editorCmsToggleVisible, editorCmsDelete } from "@/lib/editorCms";
import ImageUpload from "@/components/admin/ImageUpload";

interface SectionConfig {
  id: string;
  label: string;
  icon: string;
  accentColor: string;
  path: string;
  titlePlaceholder: string;
  previewPlaceholder: string;
  bodyPlaceholder: string;
  tags: string[];
  extraFields?: React.ReactNode;
}

interface Item {
  id: number;
  title: string;
  tag: string;
  tags: string;
  read_time: string;
  preview: string;
  body: string;
  image_url: string;
  is_visible: boolean;
  sort_order: number;
  [key: string]: unknown;
}

const emptyItem = (tags: string[]): Omit<Item, "id"> => ({
  title: "", tag: tags[0] || "", tags: "", read_time: "5 мин",
  preview: "", body: "", image_url: "", is_visible: true, sort_order: 0,
});

export default function EditorSection({ cfg }: { cfg: SectionConfig }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<Omit<Item, "id">>(emptyItem(cfg.tags));
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const d = await editorCmsGet(cfg.id);
    setItems(d.items || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [cfg.id]);

  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 3000); };

  const openNew = () => {
    setForm(emptyItem(cfg.tags));
    setEditing(null); setIsNew(true); window.scrollTo(0, 0);
  };
  const openEdit = (item: Item) => {
    setForm({
      title: item.title, tag: item.tag, tags: item.tags || "",
      read_time: item.read_time || "5 мин", preview: item.preview || "",
      body: item.body || "", image_url: item.image_url || "",
      is_visible: item.is_visible, sort_order: item.sort_order,
    });
    setEditing(item); setIsNew(false); window.scrollTo(0, 0);
  };
  const closeForm = () => { setEditing(null); setIsNew(false); };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    if (isNew) await editorCmsCreate(cfg.id, form);
    else if (editing) await editorCmsUpdate(cfg.id, editing.id, form);
    await load(); setSaving(false); closeForm();
    flash(isNew ? "Создано!" : "Сохранено!");
  };

  const toggle = async (item: Item) => {
    await editorCmsToggleVisible(cfg.id, item.id, !item.is_visible);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_visible: !i.is_visible } : i));
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить безвозвратно?")) return;
    await editorCmsDelete(cfg.id, id);
    setItems(prev => prev.filter(i => i.id !== id));
    flash("Удалено");
  };

  const f = (k: string, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Редактор</div>
          <h1 className="font-russo text-2xl text-white flex items-center gap-2">
            <Icon name={cfg.icon} size={20} style={{ color: cfg.accentColor }} />
            {cfg.label}
          </h1>
          <p className="text-xs text-white/30 mt-1">
            Публикуется на <span style={{ color: cfg.accentColor + "99" }}>{cfg.path}</span>
          </p>
        </div>
        {!isNew && !editing && (
          <button onClick={openNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
            style={{ color: cfg.accentColor, borderColor: cfg.accentColor + "40", background: cfg.accentColor + "10" }}>
            <Icon name="Plus" size={14} /> Новая публикация
          </button>
        )}
      </div>

      {msg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400 flex items-center gap-2">
          <Icon name="CheckCircle" size={14} /> {msg}
        </div>
      )}

      {/* Форма */}
      {(isNew || editing) && (
        <div className="glass-card p-6 mb-6" style={{ borderColor: cfg.accentColor + "30" }}>
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs text-white/40 uppercase tracking-widest">
              {isNew ? "Новая публикация" : "Редактировать"}
            </span>
            <button onClick={closeForm} className="text-white/30 hover:text-white transition-colors">
              <Icon name="X" size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Заголовок *</label>
              <input value={form.title} onChange={e => f("title", e.target.value)}
                placeholder={cfg.titlePlaceholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-colors"
                style={{ outlineColor: cfg.accentColor }} />
            </div>

            {cfg.tags.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Тег</label>
                  <select value={form.tag} onChange={e => f("tag", e.target.value)}
                    className="w-full bg-[#0a0a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                    {cfg.tags.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Время чтения</label>
                  <input value={form.read_time} onChange={e => f("read_time", e.target.value)}
                    placeholder="5 мин"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-colors" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-white/40 mb-1.5 block">
                Краткое превью <span className="text-white/20">— отображается на карточке</span>
              </label>
              <textarea rows={3} value={form.preview} onChange={e => f("preview", e.target.value)}
                placeholder={cfg.previewPlaceholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none resize-y transition-colors" />
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1.5 block">
                Полный текст <span className="text-white/20">— открывается при клике «Читать»</span>
              </label>
              <textarea rows={12} value={form.body} onChange={e => f("body", e.target.value)}
                placeholder={cfg.bodyPlaceholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none resize-y min-h-[200px] transition-colors" />
            </div>

            <div>
              <label className="text-xs text-white/40 mb-2 block">Изображение-обложка</label>
              <ImageUpload value={form.image_url} onChange={v => f("image_url", v)} />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_visible}
                  onChange={e => f("is_visible", e.target.checked)}
                  className="w-4 h-4 rounded" />
                <span className="text-sm text-white/60">Опубликовать сразу</span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-white/8">
              <button onClick={save} disabled={saving || !form.title.trim()}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{ color: cfg.accentColor, border: `1px solid ${cfg.accentColor}40`, background: cfg.accentColor + "15" }}>
                {saving ? "Сохраняю..." : "Сохранить"}
              </button>
              <button onClick={closeForm} className="text-sm text-white/40 hover:text-white px-3 py-2 transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Список */}
      {loading ? (
        <div className="text-white/30 text-sm flex items-center gap-2 py-8">
          <Icon name="Loader2" size={14} className="animate-spin" /> Загружаю...
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Icon name="FileText" size={32} className="text-white/15 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Публикаций пока нет</p>
          <button onClick={openNew} className="mt-4 text-sm text-white/50 hover:text-white transition-colors underline underline-offset-2">
            Создать первую
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(item => (
            <div key={item.id}
              className={`glass-card p-4 flex items-center gap-4 transition-all ${!item.is_visible ? "opacity-50" : ""}`}>
              {item.image_url && (
                <img src={item.image_url as string} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white truncate">{item.title}</span>
                  {item.tag && (
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ color: cfg.accentColor, background: cfg.accentColor + "15" }}>
                      {item.tag}
                    </span>
                  )}
                  {!item.is_visible && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/30 flex-shrink-0">скрыто</span>
                  )}
                </div>
                {item.preview && (
                  <p className="text-xs text-white/35 truncate">{item.preview as string}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button title={item.is_visible ? "Скрыть" : "Показать"} onClick={() => toggle(item)}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                    item.is_visible
                      ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                      : "bg-white/5 border-white/10 text-white/30 hover:text-green-400"
                  }`}>
                  <Icon name={item.is_visible ? "Eye" : "EyeOff"} size={13} />
                </button>
                <button title="Редактировать" onClick={() => openEdit(item)}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/40 flex items-center justify-center hover:text-white hover:bg-white/10 transition-all">
                  <Icon name="Pencil" size={13} />
                </button>
                <button title="Удалить" onClick={() => remove(item.id)}
                  className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all">
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
