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
  const [linkInput, setLinkInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string) || "";
        const res = await fetch(UPLOAD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Admin-Token": getAdminToken() },
          body: JSON.stringify({ image: base64, filename: file.name }),
        });
        const data = await res.json();
        if (data.url) {
          onChange(data.url);
          setLinkInput("");
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

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) uploadFile(file);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const imageItem = Array.from(e.clipboardData.items).find(i => i.type.startsWith("image/"));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) { e.preventDefault(); uploadFile(file); }
    }
  };

  const applyLink = () => {
    const url = linkInput.trim();
    if (url) { onChange(url); setLinkInput(""); }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Зона загрузки файла */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onPaste={onPaste}
        onClick={() => !uploading && fileRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-all text-center ${
          isDragging ? "border-white/40 bg-white/5" : "border-white/15 hover:border-white/30"
        } ${uploading ? "cursor-default pointer-events-none" : ""}`}
      >
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
        {uploading ? (
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Icon name="Loader2" size={16} className="animate-spin" /> Загружаю...
          </div>
        ) : (
          <>
            <Icon name="ImagePlus" size={22} className="text-white/25" />
            <div className="text-sm text-white/40">
              Перетащи, вставь <span className="font-semibold text-white/55">Ctrl+V</span> или нажми
            </div>
            <div className="text-xs text-white/20">JPG, PNG, WebP до 5 МБ</div>
          </>
        )}
      </div>

      {/* Ссылка */}
      <div className="flex gap-2">
        <input
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyLink()}
          placeholder="Или вставь ссылку на изображение..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors"
        />
        <button type="button" onClick={applyLink} disabled={!linkInput.trim()}
          className="px-3 py-2 rounded-xl bg-white/8 border border-white/10 text-xs text-white/60 hover:text-white hover:bg-white/12 transition-all disabled:opacity-30">
          <Icon name="Plus" size={14} />
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-400 flex items-center gap-1">
          <Icon name="AlertCircle" size={12} /> {error}
        </div>
      )}

      {value && (
        <div className="relative rounded-xl overflow-hidden border border-white/10 h-36 group">
          <img src={value} alt="Превью" className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.opacity = "0.2"; }} />
          <button type="button" onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 flex items-center justify-center text-white/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
            <Icon name="X" size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
