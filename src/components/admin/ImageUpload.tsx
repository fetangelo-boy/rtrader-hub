import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { getAdminToken } from "@/hooks/useAdminAuth";

const UPLOAD_URL = "https://functions.poehali.dev/b53b7edb-1a17-424c-8ad3-25cc3b256dd0";

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"url" | "file">("url");
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string) || "";
        const res = await fetch(UPLOAD_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": getAdminToken(),
          },
          body: JSON.stringify({ image: base64, filename: file.name }),
        });
        const data = await res.json();
        if (data.url) {
          onChange(data.url);
        } else {
          setError("Ошибка загрузки: " + (data.error || "неизвестная"));
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError("Ошибка сети");
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) uploadFile(file);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(i => i.type.startsWith("image/"));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) { e.preventDefault(); uploadFile(file); }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Переключатель */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
        <button type="button" onClick={() => setTab("url")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === "url" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}>
          По ссылке
        </button>
        <button type="button" onClick={() => setTab("file")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === "file" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}>
          Загрузить файл
        </button>
      </div>

      {tab === "url" ? (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://... (прямая ссылка на изображение)"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#9B30FF]/50 transition-colors"
        />
      ) : (
        <div
          ref={dropRef}
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onPaste={onPaste}
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-white/15 hover:border-white/30 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-all text-center"
        >
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          {uploading ? (
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Icon name="Loader2" size={16} className="animate-spin" /> Загружаю...
            </div>
          ) : (
            <>
              <Icon name="ImagePlus" size={24} className="text-white/25" />
              <div className="text-sm text-white/40">
                Перетащи фото, вставь <span className="font-semibold text-white/60">Ctrl+V</span> или кликни
              </div>
              <div className="text-xs text-white/20">JPG, PNG, WebP до 5 МБ</div>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-400 flex items-center gap-1">
          <Icon name="AlertCircle" size={12} /> {error}
        </div>
      )}

      {value && (
        <div className="relative rounded-xl overflow-hidden border border-white/10 h-36 group">
          <img src={value} alt="Превью"
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.opacity = "0.2"; }} />
          <button type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 flex items-center justify-center text-white/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
            <Icon name="X" size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
