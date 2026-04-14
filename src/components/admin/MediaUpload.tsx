import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { getAdminToken } from "@/hooks/useAdminAuth";
import VideoGuide from "@/components/admin/VideoGuide";
import func2url from "../../../backend/func2url.json";

const UPLOAD_URL = "https://functions.poehali.dev/b53b7edb-1a17-424c-8ad3-25cc3b256dd0";
const VIDEO_UPLOAD_URL = (func2url as Record<string, string>)["video-upload-url"];

type MediaType = "image" | "audio" | "video" | "link";

interface MediaItem {
  type: MediaType;
  url: string;
  label?: string;
}

interface Props {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
}

const ICON_MAP: Record<MediaType, string> = {
  image: "Image",
  audio: "Music",
  video: "Video",
  link: "Link",
};

const LABEL_MAP: Record<MediaType, string> = {
  image: "Фото",
  audio: "Аудио",
  video: "Видео",
  link: "Ссылка",
};

function detectType(file: File): MediaType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (["jpg","jpeg","png","webp","gif","svg"].includes(ext)) return "image";
  if (["mp3","ogg","wav","m4a","aac","flac"].includes(ext)) return "audio";
  if (["mp4","webm","mov","avi","mkv"].includes(ext)) return "video";
  return "image";
}

function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  const rutube = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/);
  if (rutube) return `https://rutube.ru/play/embed/${rutube[1]}`;
  const vk = url.match(/vk\.com\/video(-?\d+)_(\d+)/);
  if (vk) return `https://vk.com/video_ext.php?oid=${vk[1]}&id=${vk[2]}&hd=2`;
  return null;
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm|mov|mkv|avi)(\?|$)/i.test(url);
}

function MediaPreview({ item, onRemove }: { item: MediaItem; onRemove: () => void }) {
  const embedUrl = item.type === "video" ? toEmbedUrl(item.url) : null;
  const direct = item.type === "video" && isDirectVideo(item.url);

  return (
    <div className="relative group flex flex-col gap-1.5 bg-white/5 border border-white/10 rounded-xl p-2.5">
      <div className="flex items-center gap-2 mb-1">
        <Icon name={ICON_MAP[item.type]} size={13} className="text-white/40 shrink-0" />
        <span className="text-xs text-white/40 font-medium">{LABEL_MAP[item.type]}</span>
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto w-5 h-5 rounded-md bg-black/40 flex items-center justify-center text-white/30 hover:text-red-400 transition-colors"
        >
          <Icon name="X" size={11} />
        </button>
      </div>

      {item.type === "image" && (
        <div className="w-full h-28 rounded-lg overflow-hidden bg-black/30">
          <img src={item.url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {item.type === "audio" && (
        <audio controls className="w-full h-9" style={{ filter: "invert(1) hue-rotate(180deg)" }}>
          <source src={item.url} />
        </audio>
      )}

      {item.type === "video" && (
        direct ? (
          <video controls className="w-full rounded-lg max-h-36 bg-black/30">
            <source src={item.url} />
          </video>
        ) : embedUrl ? (
          <iframe src={embedUrl} className="w-full rounded-lg" style={{ height: 140 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen frameBorder="0" />
        ) : (
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#FFD700]/70 hover:text-[#FFD700] truncate transition-colors">
            <Icon name="ExternalLink" size={12} /> {item.url}
          </a>
        )
      )}

      {item.type === "link" && (
        <a href={item.url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-[#FFD700]/70 hover:text-[#FFD700] truncate transition-colors">
          {item.label || item.url}
        </a>
      )}
    </div>
  );
}

export default function MediaUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [error, setError] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addItem = (item: MediaItem) => onChange([...value, item]);
  const removeItem = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  const uploadFile = async (file: File) => {
    const type = detectType(file);
    setUploading(true);
    setError("");
    setVideoProgress(0);

    if (type === "video") {
      try {
        const mime = file.type || "video/mp4";
        const token = getAdminToken();
        const presignRes = await fetch(
          `${VIDEO_UPLOAD_URL}?action=presign&filename=${encodeURIComponent(file.name)}&mime=${encodeURIComponent(mime)}&token=${encodeURIComponent(token)}`
        );
        if (!presignRes.ok) {
          const d = await presignRes.json().catch(() => ({}));
          throw new Error(d.error || `Ошибка ${presignRes.status}`);
        }
        const { upload_url, cdn_url } = await presignRes.json();
        const cdnUrl = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", upload_url);
          xhr.setRequestHeader("Content-Type", mime);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setVideoProgress(Math.round((e.loaded / e.total) * 98));
          };
          xhr.onload = () => {
            if (xhr.status < 300) resolve(cdn_url);
            else reject(new Error(`Ошибка загрузки: ${xhr.status}`));
          };
          xhr.onerror = () => reject(new Error("Ошибка сети"));
          xhr.send(file);
        });
        setVideoProgress(100);
        addItem({ type: "video", url: cdnUrl });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Ошибка загрузки");
      } finally {
        setUploading(false);
        setTimeout(() => setVideoProgress(0), 1000);
      }
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string) || "";
        const res = await fetch(UPLOAD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Admin-Token": getAdminToken() },
          body: JSON.stringify({ file: base64, filename: file.name }),
        });
        const data = await res.json();
        if (data.url) {
          addItem({ type, url: data.url });
        } else {
          setError("Ошибка: " + (data.error || "неизвестная"));
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError("Ошибка сети");
      setUploading(false);
    }
  };

  const addLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    const isVideo = toEmbedUrl(url) || isDirectVideo(url);
    addItem({ type: isVideo ? "video" : "link", url });
    setLinkUrl("");
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Превью добавленных материалов */}
      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          {value.map((item, i) => (
            <MediaPreview key={i} item={item} onRemove={() => removeItem(i)} />
          ))}
        </div>
      )}

      {/* Зона загрузки файла */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-all text-center ${
          isDragging ? "border-[#FFD700]/60 bg-[#FFD700]/5" : "border-white/15 hover:border-white/30"
        } ${uploading ? "cursor-default pointer-events-none" : ""}`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*,audio/*,video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,.mp4,.webm,.mov,.avi,.mkv,.mp3,.ogg,.wav,.m4a"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
        />
        {uploading ? (
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-white/60 justify-center">
              <Icon name="Loader2" size={14} className="animate-spin" />
              {videoProgress > 0 ? `Загружаю... ${videoProgress}%` : "Загружаю..."}
            </div>
            {videoProgress > 0 && (
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#FFD700]/60 rounded-full transition-all duration-200" style={{ width: `${videoProgress}%` }} />
              </div>
            )}
          </div>
        ) : (
          <>
            <Icon name="Upload" size={20} className="text-white/30" />
            <div className="text-sm text-white/50">Перетащи или нажми — фото, видео, аудио</div>
            <div className="text-xs text-white/25">JPG, PNG, MP4, MKV, MP3 и другие</div>
          </>
        )}
      </div>

      {/* Ссылка */}
      <div className="flex gap-2">
        <input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addLink()}
          placeholder="Ссылка — YouTube, Rutube, VK, или любой URL..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors"
        />
        <button
          type="button"
          onClick={addLink}
          disabled={!linkUrl.trim()}
          className="px-3 py-2 rounded-xl bg-white/8 border border-white/10 text-xs text-white/60 hover:text-white hover:bg-white/12 transition-all disabled:opacity-30"
        >
          <Icon name="Plus" size={14} />
        </button>
      </div>

      <VideoGuide />

      {error && (
        <div className="text-xs text-red-400 flex items-center gap-1">
          <Icon name="AlertCircle" size={12} /> {error}
        </div>
      )}
    </div>
  );
}
