import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getAdminToken } from "@/hooks/useAdminAuth";

const API_URL = "https://functions.poehali.dev/f7bd41c1-8acb-4ad3-8af1-19514ba3f94c";

const SECTION_META: Record<string, { icon: string; accent: string; desc: string }> = {
  community:   { icon: "Users",      accent: "#00E5FF", desc: "Публичный чат, общение" },
  analytics:   { icon: "TrendingUp", accent: "#FFD700", desc: "Торговая аналитика" },
  reflections: { icon: "Brain",      accent: "#9B30FF", desc: "Психология трейдинга" },
  tournaments: { icon: "Trophy",     accent: "#FF8C00", desc: "Конкурсы и соревнования" },
  vip:         { icon: "Crown",      accent: "#FF2D78", desc: "Страница VIP-клуба" },
  education:   { icon: "BookOpen",   accent: "#4169FF", desc: "Обучающие материалы" },
  reviews:     { icon: "Star",       accent: "#FFD700", desc: "Отзывы пользователей" },
};

interface Section {
  key: string;
  label: string;
  is_visible: boolean;
}

function headers() {
  return { "Content-Type": "application/json", "X-Admin-Token": getAdminToken() };
}

export default function AdminSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const r = await fetch(`${API_URL}?action=sections`, { headers: headers() });
    const d = await r.json();
    setSections(d.sections || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 3000); };

  const toggle = async (section: Section) => {
    setToggling(section.key);
    const newVal = !section.is_visible;
    await fetch(`${API_URL}?action=sections`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ key: section.key, is_visible: newVal }),
    });
    setSections(prev => prev.map(s => s.key === section.key ? { ...s, is_visible: newVal } : s));
    flash(`«${section.label}» ${newVal ? "показан" : "скрыт"} в навигации`);
    setToggling(null);
  };

  const visible = sections.filter(s => s.is_visible).length;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Настройки</div>
          <h1 className="font-russo text-2xl text-white">Разделы сайта</h1>
          <p className="text-xs text-white/35 mt-1">
            Скрытый раздел пропадает из навигации сразу. Страница остаётся доступной по прямой ссылке.
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-russo text-neon-yellow">{visible}</div>
          <div className="text-xs text-white/30">из {sections.length} видно</div>
        </div>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400 flex items-center gap-2">
          <Icon name="CheckCircle" size={14} /> {msg}
        </div>
      )}

      {loading ? (
        <div className="text-white/30 text-sm flex items-center gap-2 py-8">
          <Icon name="Loader2" size={14} className="animate-spin" /> Загружаю...
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sections.map(section => {
            const meta = SECTION_META[section.key] || { icon: "Circle", accent: "#fff", desc: "" };
            const isToggling = toggling === section.key;
            return (
              <div
                key={section.key}
                className={`glass-card p-4 flex items-center gap-4 transition-all ${!section.is_visible ? "opacity-60" : ""}`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: meta.accent + "15", border: `1px solid ${meta.accent}30` }}
                >
                  <Icon name={meta.icon} size={18} style={{ color: meta.accent }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{section.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider ${
                      section.is_visible
                        ? "bg-green-500/15 text-green-400"
                        : "bg-white/8 text-white/30"
                    }`}>
                      {section.is_visible ? "ВИДНО" : "СКРЫТО"}
                    </span>
                  </div>
                  <p className="text-xs text-white/35 mt-0.5">{meta.desc}</p>
                </div>

                <button
                  onClick={() => toggle(section)}
                  disabled={isToggling}
                  title={section.is_visible ? "Скрыть из навигации" : "Показать в навигации"}
                  className={`w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 relative ${
                    isToggling ? "opacity-50" : ""
                  } ${
                    section.is_visible
                      ? "bg-neon-yellow"
                      : "bg-white/15"
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${
                    section.is_visible ? "left-6" : "left-0.5"
                  }`} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 px-4 py-3 rounded-xl bg-white/3 border border-white/8 text-xs text-white/30 leading-relaxed">
        <Icon name="Info" size={12} className="inline mr-1.5 -mt-0.5" />
        Изменения применяются мгновенно для всех посетителей. Скрытый раздел остаётся доступным по прямой ссылке — он просто не показывается в меню.
      </div>
    </div>
  );
}
