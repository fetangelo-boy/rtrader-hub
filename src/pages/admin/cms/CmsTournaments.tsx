import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { cmsGet, cmsCreate, cmsUpdate, cmsToggleVisible, cmsDelete } from "@/lib/adminCms";

const SECTION = "tournaments";
const STATUSES = [
  { value: "active", label: "Идёт сейчас" },
  { value: "upcoming", label: "Скоро" },
  { value: "finished", label: "Завершён" },
];

interface Item {
  id: number; name: string; status: string; start_date: string; end_date: string;
  instrument: string; description: string; prize: string; participants: number;
  winner: string; result: string; is_visible: boolean;
}

const empty = (): Omit<Item, "id"> => ({
  name: "", status: "upcoming", start_date: "", end_date: "",
  instrument: "", description: "", prize: "", participants: 0,
  winner: "", result: "", is_visible: true,
});

export default function CmsTournaments() {
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
    setForm({ name: item.name, status: item.status, start_date: item.start_date,
              end_date: item.end_date, instrument: item.instrument,
              description: item.description, prize: item.prize,
              participants: item.participants, winner: item.winner,
              result: item.result, is_visible: item.is_visible });
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
    if (!confirm("Удалить турнир?")) return;
    await cmsDelete(SECTION, id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const f = (k: keyof typeof form, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));

  const statusLabel = (s: string) => STATUSES.find(x => x.value === s)?.label || s;
  const statusColor = (s: string) =>
    s === "active" ? "text-green-400 bg-green-500/15 border-green-500/25"
    : s === "upcoming" ? "text-[#FFD700] bg-[#FFD700]/10 border-[#FFD700]/25"
    : "text-white/40 bg-white/5 border-white/10";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Admin → CMS</div>
          <h1 className="font-russo text-2xl text-white flex items-center gap-2">
            <Icon name="Trophy" size={20} style={{ color: "#FF8C00" }} /> Конкурсы и турниры
          </h1>
        </div>
        <button onClick={openNew} className="neon-btn text-xs px-4 py-2 flex items-center gap-1.5">
          <Icon name="Plus" size={13} /> Добавить турнир
        </button>
      </div>

      {(isNew || editing) && (
        <div className="glass-card p-6 mb-6 border-[#FF8C00]/25">
          <div className="text-xs text-white/40 uppercase tracking-widest mb-4">
            {isNew ? "Новый турнир" : "Редактировать"}
          </div>
          <div className="mb-3">
            <label className="text-xs text-white/40 mb-1 block">Название *</label>
            <input value={form.name} onChange={e => f("name", e.target.value)}
              placeholder="Январский чемпионат 2025"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF8C00]/40" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Статус</label>
              <select value={form.status} onChange={e => f("status", e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Дата начала</label>
              <input value={form.start_date} onChange={e => f("start_date", e.target.value)} placeholder="2025-01-01"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Дата окончания</label>
              <input value={form.end_date} onChange={e => f("end_date", e.target.value)} placeholder="2025-01-31"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Инструменты</label>
              <input value={form.instrument} onChange={e => f("instrument", e.target.value)}
                placeholder="Все инструменты МБ"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Приз</label>
              <input value={form.prize} onChange={e => f("prize", e.target.value)}
                placeholder="Разбор портфеля от автора"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs text-white/40 mb-1 block">Описание</label>
            <textarea rows={2} value={form.description} onChange={e => f("description", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none resize-none" />
          </div>
          {form.status === "finished" && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Победитель</label>
                <input value={form.winner} onChange={e => f("winner", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Результат победителя</label>
                <input value={form.result} onChange={e => f("result", e.target.value)} placeholder="+52.1%"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving || !form.name}
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
        <div className="glass-card p-8 text-center text-white/30 text-sm">Турниров пока нет</div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(item => (
            <div key={item.id} className={`glass-card p-4 flex items-start gap-4 ${!item.is_visible ? "opacity-50" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-white/85 text-sm">{item.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                  {!item.is_visible && <span className="text-xs text-white/25">скрыто</span>}
                </div>
                <div className="text-xs text-white/30">
                  {item.start_date} — {item.end_date} · {item.instrument}
                  {item.winner && ` · Победитель: ${item.winner} ${item.result}`}
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
