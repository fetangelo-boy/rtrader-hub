import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getAdminToken } from "@/hooks/useAdminAuth";

const API_URL = "https://functions.poehali.dev/f7bd41c1-8acb-4ad3-8af1-19514ba3f94c";

interface ContentItem {
  id: number;
  section: string;
  key: string;
  value: string;
  label: string;
  updated_at: string;
}

const SECTION_LABELS: Record<string, string> = {
  home: "Главная страница",
  community: "Комьюнити",
  analytics: "Аналитика",
  vip: "VIP-клуб",
  education: "Обучение",
};

export default function AdminContent() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ section: string; key: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const headers = {
    "Content-Type": "application/json",
    "X-Admin-Token": getAdminToken(),
  };

  const fetchContent = async () => {
    setLoading(true);
    const res = await fetch(API_URL, { headers });
    const data = await res.json();
    setItems(data.content || []);
    setLoading(false);
  };

  useEffect(() => { fetchContent(); }, []);

  const startEdit = (item: ContentItem) => {
    setEditing({ section: item.section, key: item.key });
    setEditValue(item.value);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue("");
  };

  const saveEdit = async (item: ContentItem) => {
    setSaving(true);
    await fetch(API_URL, {
      method: "PUT",
      headers,
      body: JSON.stringify({ section: item.section, key: item.key, value: editValue }),
    });
    setItems((prev) =>
      prev.map((i) =>
        i.section === item.section && i.key === item.key
          ? { ...i, value: editValue, updated_at: "только что" }
          : i
      )
    );
    setSavedKey(`${item.section}.${item.key}`);
    setTimeout(() => setSavedKey(null), 2000);
    setSaving(false);
    setEditing(null);
  };

  const grouped = Object.entries(SECTION_LABELS).map(([section, label]) => ({
    section,
    label,
    items: items.filter((i) => i.section === section),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Admin</div>
        <h1 className="font-russo text-2xl text-white">Управление контентом</h1>
        <p className="text-white/35 text-xs mt-1">Редактируй тексты и нажимай «Сохранить» — изменения сохраняются в базе данных.</p>
      </div>

      {loading ? (
        <div className="text-white/30 text-sm flex items-center gap-2">
          <Icon name="Loader2" size={16} className="animate-spin" /> Загружаю...
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(({ section, label, items: sectionItems }) => (
            <div key={section}>
              <div className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-3">{label}</div>
              <div className="flex flex-col gap-3">
                {sectionItems.map((item) => {
                  const isEditing = editing?.section === item.section && editing?.key === item.key;
                  const justSaved = savedKey === `${item.section}.${item.key}`;
                  const isLong = item.value.length > 80;

                  return (
                    <div key={item.id} className="glass-card p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-white/50 font-semibold">{item.label || item.key}</span>
                        <span className="text-xs text-white/20">{item.updated_at}</span>
                      </div>

                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          {isLong ? (
                            <textarea
                              rows={4}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full bg-white/5 border border-[#FFD700]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none resize-none"
                              autoFocus
                            />
                          ) : (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full bg-white/5 border border-[#FFD700]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                              autoFocus
                            />
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveEdit(item)}
                              disabled={saving}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/25 text-xs font-semibold hover:bg-[#FFD700]/25 transition-all disabled:opacity-50"
                            >
                              <Icon name={saving ? "Loader2" : "Check"} size={12} />
                              {saving ? "Сохраняю..." : "Сохранить"}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1.5 rounded-lg text-white/40 text-xs hover:text-white transition-colors"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="flex items-start justify-between gap-3 cursor-pointer group"
                          onClick={() => startEdit(item)}
                        >
                          <p className="text-white/70 text-sm leading-relaxed flex-1 line-clamp-2">{item.value}</p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {justSaved && (
                              <span className="text-xs text-green-400 flex items-center gap-1">
                                <Icon name="Check" size={11} /> Сохранено
                              </span>
                            )}
                            <button className="text-white/20 group-hover:text-[#FFD700] transition-colors">
                              <Icon name="Pencil" size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}