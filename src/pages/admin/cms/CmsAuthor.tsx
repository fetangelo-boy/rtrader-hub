import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { cmsGet, cmsUpdate } from "@/lib/adminCms";

const SECTION = "author";

interface AuthorData {
  id: number; heading: string; body: string; tags: string;
}

export default function CmsAuthor() {
  const [data, setData] = useState<AuthorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ heading: "", body: "", tags: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    const d = await cmsGet(SECTION);
    if (d.item) {
      setData(d.item);
      setForm({ heading: d.item.heading || "", body: d.item.body || "", tags: d.item.tags || "" });
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    if (data) await cmsUpdate(SECTION, data.id, form);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const f = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Admin → CMS</div>
        <h1 className="font-russo text-2xl text-white flex items-center gap-2">
          <Icon name="User" size={20} style={{ color: "#00E5FF" }} /> Об авторе
        </h1>
        <p className="text-white/35 text-xs mt-1">Раздел «Об авторе» на главной странице</p>
      </div>

      {loading ? (
        <div className="text-white/30 text-sm flex items-center gap-2"><Icon name="Loader2" size={14} className="animate-spin" /> Загружаю...</div>
      ) : (
        <div className="glass-card p-6 max-w-2xl">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Заголовок</label>
              <input value={form.heading} onChange={e => f("heading", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5FF]/40 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Основной текст</label>
              <textarea rows={5} value={form.body} onChange={e => f("body", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5FF]/40 transition-colors resize-none" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Теги (через запятую)</label>
              <input value={form.tags} onChange={e => f("tags", e.target.value)}
                placeholder="7 лет на рынке, МосБиржа, Фьючерсы"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5FF]/40 transition-colors" />
              <p className="text-xs text-white/25 mt-1">Теги отображаются под текстом в виде бейджей</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={save} disabled={saving}
                className="neon-btn text-sm px-6 py-2 disabled:opacity-40">
                {saving ? "Сохраняю..." : "Сохранить"}
              </button>
              {saved && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <Icon name="Check" size={12} /> Сохранено
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
