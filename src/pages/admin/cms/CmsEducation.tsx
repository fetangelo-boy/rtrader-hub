import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { getAdminToken } from "@/hooks/useAdminAuth";
import { cmsGet, cmsCreate, cmsUpdate, cmsToggleVisible, cmsDelete } from "@/lib/adminCms";
import func2url from "../../../../backend/func2url.json";

const SECTION = "education";
const VIDEO_UPLOAD_URL = (func2url as Record<string, string>)["video-upload-url"];
const IMAGE_UPLOAD_URL = "https://functions.poehali.dev/b53b7edb-1a17-424c-8ad3-25cc3b256dd0";

interface Item {
  id: number;
  title: string;
  description: string;
  body: string;
  video_url: string;
  image_url: string;
  is_free: boolean;
  is_visible: boolean;
  sort_order: number;
  level: string;
  // legacy fields kept for API compatibility
  number: string;
  duration: string;
  lessons: number;
  topics: string;
  tags: string;
  media_items: unknown[];
}

const empty = (): Omit<Item, "id"> => ({
  title: "", description: "", body: "", video_url: "", image_url: "",
  is_free: false, is_visible: true, sort_order: 0, level: "Любой",
  number: "", duration: "", lessons: 0, topics: "", tags: "", media_items: [],
});

function VideoUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [mode, setMode] = useState<"link" | "file">(value && !value.startsWith("blob") ? "link" : "link");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [sizeWarning, setSizeWarning] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setSizeWarning("");
    if (file.size > 500 * 1024 * 1024) {
      setError("Файл слишком большой (макс. 500 МБ). Лучше загрузи на YouTube/VK и вставь ссылку");
      return;
    }
    if (file.size > 80 * 1024 * 1024) {
      setSizeWarning(`Большой файл (${Math.round(file.size / 1024 / 1024)} МБ) — загрузка займёт несколько минут`);
    }
    setUploading(true);
    setError("");
    setProgress(0);
    try {
      const token = getAdminToken();
      // Конвертируем в base64 и шлём как JSON — обходит CORS preflight по Content-Type
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = (e) => res((e.target?.result as string) || "");
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const mime = file.type || "video/mp4";
      const cdnUrl = await new Promise<string>((resolve, reject) => {
        const url = `${VIDEO_UPLOAD_URL}?filename=${encodeURIComponent(file.name)}&mime=${encodeURIComponent(mime)}`;
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("X-Auth-Token", token);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 95));
        };
        xhr.onload = () => {
          if (xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.url || data.cdn_url) resolve(data.url || data.cdn_url);
              else reject(new Error(data.error || "Нет URL в ответе"));
            } catch { reject(new Error("Ошибка ответа сервера")); }
          } else {
            try { reject(new Error(JSON.parse(xhr.responseText).error || `Ошибка ${xhr.status}`)); }
            catch { reject(new Error(`Ошибка ${xhr.status}`)); }
          }
        };
        xhr.onerror = () => reject(new Error(`Ошибка сети (${xhr.status})`));
        xhr.send(JSON.stringify({ filename: file.name, mime, file_b64: base64 }));
      });
      setProgress(100);
      onChange(cdnUrl);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
        {(["link", "file"] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === m ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}>
            {m === "link" ? "По ссылке" : "С компьютера"}
          </button>
        ))}
      </div>

      {mode === "link" ? (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://youtube.com/... или VK Video, Rutube, прямая ссылка на .mp4"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#38BDF8]/50 transition-colors"
        />
      ) : (
        <div>
          <input ref={fileRef} type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.avi,.mkv"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
          />
          {uploading ? (
            <div className="w-full border border-white/10 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Icon name="Loader2" size={14} className="animate-spin" />
                Загружаю видео... {progress}%
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#38BDF8] transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-white/15 hover:border-[#38BDF8]/40 rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-all text-center">
              <Icon name="Upload" size={22} className="text-white/25" />
              <div className="text-sm text-white/40">Кликни или перетащи видеофайл сюда</div>
              <div className="text-xs text-white/20">MP4, MOV, MKV, WebM — любой размер</div>
            </div>
          )}
        </div>
      )}

      {sizeWarning && (
        <div className="text-xs text-yellow-400 flex items-center gap-1">
          <Icon name="AlertTriangle" size={12} /> {sizeWarning}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-400 flex items-center gap-1">
          <Icon name="AlertCircle" size={12} /> {error}
        </div>
      )}

      {value && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded-xl">
          <Icon name="CheckCircle2" size={13} className="text-[#38BDF8] shrink-0" />
          <span className="text-xs text-[#38BDF8] truncate flex-1">{value}</span>
          <button type="button" onClick={() => onChange("")} className="text-white/30 hover:text-red-400 transition-colors shrink-0">
            <Icon name="X" size={12} />
          </button>
        </div>
      )}

      <div className="flex items-start gap-2 px-3 py-2.5 bg-white/3 border border-white/8 rounded-xl">
        <Icon name="Lightbulb" size={13} className="text-yellow-400/70 shrink-0 mt-0.5" />
        <div className="text-xs text-white/35 leading-relaxed">
          Для видео больше 100 МБ рекомендуем загрузить на{" "}
          <span className="text-white/55">YouTube</span> или{" "}
          <span className="text-white/55">VK Video</span> и вставить ссылку — так видео загрузится быстрее и будет воспроизводиться без задержек
        </div>
      </div>
    </div>
  );
}

function PhotoUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string) || "";
        const res = await fetch(IMAGE_UPLOAD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Admin-Token": getAdminToken() },
          body: JSON.stringify({ image: base64, filename: file.name }),
        });
        const data = await res.json();
        if (data.url) onChange(data.url);
        else setError("Ошибка: " + (data.error || "неизвестная"));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError("Ошибка сети");
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) uploadFile(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 h-32 group">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 flex items-center justify-center text-white/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
            <Icon name="X" size={13} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          className="w-full border-2 border-dashed border-white/15 hover:border-white/30 rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-all text-center">
          {uploading ? (
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Icon name="Loader2" size={16} className="animate-spin" /> Загружаю...
            </div>
          ) : (
            <>
              <Icon name="ImagePlus" size={22} className="text-white/25" />
              <div className="text-sm text-white/40">Кликни или перетащи фото графика</div>
              <div className="text-xs text-white/20">JPG, PNG, WebP</div>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-400 flex items-center gap-1">
          <Icon name="AlertCircle" size={12} /> {error}
        </div>
      )}
    </div>
  );
}

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

  const openNew = () => { setForm(empty()); setEditing(null); setIsNew(true); window.scrollTo(0, 0); };
  const openEdit = (item: Item) => {
    setForm({
      title: item.title, description: item.description || "",
      body: item.body || "", video_url: item.video_url || "",
      image_url: item.image_url || "", is_free: item.is_free,
      is_visible: item.is_visible, sort_order: item.sort_order, level: item.level || "Любой",
      number: item.number || "", duration: item.duration || "", lessons: item.lessons || 0,
      topics: item.topics || "", tags: item.tags || "", media_items: item.media_items || [],
    });
    setEditing(item); setIsNew(false); window.scrollTo(0, 0);
  };
  const closeForm = () => { setEditing(null); setIsNew(false); };

  const save = async () => {
    if (!form.title.trim()) return;
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
    if (!confirm("Удалить материал?")) return;
    await cmsDelete(SECTION, id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const f = (k: keyof typeof form, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Admin → CMS</div>
          <h1 className="font-russo text-2xl text-white flex items-center gap-2">
            <Icon name="BookOpen" size={20} style={{ color: "#38BDF8" }} /> Обучение
          </h1>
        </div>
        {!isNew && !editing && (
          <button onClick={openNew} className="neon-btn text-xs px-4 py-2 flex items-center gap-1.5">
            <Icon name="Plus" size={13} /> Добавить материал
          </button>
        )}
      </div>

      {(isNew || editing) && (
        <div className="glass-card p-6 mb-6 border-[#38BDF8]/20">
          <div className="flex items-center justify-between mb-5">
            <div className="font-russo text-sm text-white">
              {isNew ? "Новый материал" : "Редактировать"}
            </div>
            <button onClick={closeForm} className="text-white/30 hover:text-white transition-colors">
              <Icon name="X" size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-5">
            {/* Заголовок */}
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Заголовок *</label>
              <input value={form.title} onChange={e => f("title", e.target.value)}
                placeholder="Название урока или обзора"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#38BDF8]/40 transition-colors" />
            </div>

            {/* Видео */}
            <div>
              <label className="text-xs text-white/40 mb-1.5 block flex items-center gap-1.5">
                <Icon name="Video" size={12} className="text-[#38BDF8]" />
                Видеообзор
              </label>
              <VideoUpload value={form.video_url} onChange={v => f("video_url", v)} />
            </div>

            {/* Текст */}
            <div>
              <label className="text-xs text-white/40 mb-1.5 block flex items-center gap-1.5">
                <Icon name="FileText" size={12} className="text-[#38BDF8]" />
                Текст обзора / лекции
              </label>
              <textarea rows={8} value={form.body} onChange={e => f("body", e.target.value)}
                placeholder="Текст материала. Ссылки https://... становятся кликабельными автоматически"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#38BDF8]/40 resize-y min-h-[140px] transition-colors" />
            </div>

            {/* Фото графика */}
            <div>
              <label className="text-xs text-white/40 mb-1.5 block flex items-center gap-1.5">
                <Icon name="BarChart2" size={12} className="text-[#38BDF8]" />
                Фото графика / обложка
              </label>
              <PhotoUpload value={form.image_url} onChange={v => f("image_url", v)} />
            </div>

            {/* Краткое описание для карточки */}
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">
                Краткое описание
                <span className="text-white/20 ml-2">— показывается в списке на сайте</span>
              </label>
              <textarea rows={2} value={form.description} onChange={e => f("description", e.target.value)}
                placeholder="Анонс (1–2 предложения)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none resize-none focus:border-[#38BDF8]/40 transition-colors" />
            </div>

            {/* Настройки */}
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_free} onChange={e => f("is_free", e.target.checked)}
                  className="w-4 h-4 accent-[#38BDF8] rounded" />
                <span className="text-sm text-white/60">Бесплатный (без VIP)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_visible} onChange={e => f("is_visible", e.target.checked)}
                  className="w-4 h-4 accent-[#38BDF8] rounded" />
                <span className="text-sm text-white/60">Виден на сайте</span>
              </label>
            </div>

            {/* Кнопки */}
            <div className="flex gap-3 pt-2 border-t border-white/5">
              <button onClick={save} disabled={saving || !form.title.trim()}
                className="neon-btn px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50">
                {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Save" size={14} />}
                {saving ? "Сохраняю..." : "Сохранить"}
              </button>
              <button onClick={closeForm} className="px-4 py-2.5 text-sm text-white/40 hover:text-white transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Список материалов */}
      {loading ? (
        <div className="text-white/30 text-sm flex items-center gap-2 py-8">
          <Icon name="Loader2" size={14} className="animate-spin" /> Загружаю...
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Icon name="BookOpen" size={32} className="text-white/10 mx-auto mb-3" />
          <div className="text-white/30 text-sm">Материалов пока нет</div>
          <button onClick={openNew} className="mt-4 text-xs text-[#38BDF8] hover:text-[#38BDF8]/80 transition-colors">
            + Добавить первый
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <div key={item.id}
              className={`glass-card p-4 flex gap-4 items-start ${!item.is_visible ? "opacity-50" : ""}`}>
              {/* Превью фото */}
              {item.image_url ? (
                <img src={item.image_url} alt="" className="w-16 h-16 object-cover rounded-xl shrink-0 border border-white/10" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon name="BookOpen" size={20} className="text-white/15" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-medium text-sm text-white truncate">{item.title}</div>
                  {!item.is_visible && (
                    <span className="text-[10px] text-white/30 border border-white/10 px-1.5 py-0.5 rounded shrink-0">скрыт</span>
                  )}
                  {item.is_free && (
                    <span className="text-[10px] text-green-400 border border-green-400/20 px-1.5 py-0.5 rounded shrink-0">бесплатно</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/30">
                  {item.video_url && <span className="flex items-center gap-1"><Icon name="Video" size={10} /> видео</span>}
                  {item.body && <span className="flex items-center gap-1"><Icon name="FileText" size={10} /> текст</span>}
                  {item.image_url && <span className="flex items-center gap-1"><Icon name="Image" size={10} /> фото</span>}
                </div>
                {item.description && (
                  <div className="text-xs text-white/25 mt-1 line-clamp-1">{item.description}</div>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggle(item)} title={item.is_visible ? "Скрыть" : "Показать"}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white transition-colors">
                  <Icon name={item.is_visible ? "Eye" : "EyeOff"} size={14} />
                </button>
                <button onClick={() => openEdit(item)} title="Редактировать"
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white transition-colors">
                  <Icon name="Pencil" size={14} />
                </button>
                <button onClick={() => remove(item.id)} title="Удалить"
                  className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors">
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}