import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import func2url from "../../../backend/func2url.json";

const CHAT_URL = (func2url as Record<string, string>).chat;
const VIDEO_UPLOAD_URL = (func2url as Record<string, string>)["video-upload-url"];
const POLL_INTERVAL = 30000;

type UploadMode = "file" | "link";

interface VideoMessage {
  id: number;
  text: string;
  created_at: string;
  nickname: string;
  role: string;
  video_url: string | null;
  video_title: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Определяет тип источника видео по URL
function detectSource(url: string): "youtube" | "rutube" | "vk" | "telegram" | "vimeo" | "direct" {
  if (/youtu\.be|youtube\.com/i.test(url)) return "youtube";
  if (/rutube\.ru/i.test(url)) return "rutube";
  if (/vk\.com|vkvideo\.ru/i.test(url)) return "vk";
  if (/t\.me|telegram\.me/i.test(url)) return "telegram";
  if (/vimeo\.com/i.test(url)) return "vimeo";
  return "direct";
}

// Конвертирует обычную ссылку в embed-ссылку
function toEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Rutube
  const rutubeMatch = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/);
  if (rutubeMatch) return `https://rutube.ru/play/embed/${rutubeMatch[1]}`;

  // VK Видео
  const vkMatch = url.match(/vk\.com\/video(-?\d+)_(\d+)/);
  if (vkMatch) return `https://vk.com/video_ext.php?oid=${vkMatch[1]}&id=${vkMatch[2]}&hd=2`;

  // VK клип / короткий формат
  const vkClipMatch = url.match(/vk\.com\/clip(-?\d+)_(\d+)/);
  if (vkClipMatch) return `https://vk.com/video_ext.php?oid=${vkClipMatch[1]}&id=${vkClipMatch[2]}&hd=2`;

  return null;
}

function sourceBadge(url: string) {
  const src = detectSource(url);
  const map: Record<string, { label: string; color: string }> = {
    youtube:  { label: "YouTube",  color: "bg-red-600/20 text-red-400" },
    rutube:   { label: "Rutube",   color: "bg-blue-600/20 text-blue-400" },
    vk:       { label: "VK Видео", color: "bg-blue-500/20 text-blue-300" },
    telegram: { label: "Telegram", color: "bg-sky-500/20 text-sky-400" },
    vimeo:    { label: "Vimeo",    color: "bg-cyan-500/20 text-cyan-400" },
    direct:   { label: "Файл",     color: "bg-muted text-muted-foreground" },
  };
  const { label, color } = map[src] || map.direct;
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${color}`}>{label}</span>
  );
}

function VideoPlayer({ url }: { url: string }) {
  const embedUrl = toEmbedUrl(url);
  const src = detectSource(url);

  if (src === "telegram") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-muted/30 rounded-xl p-6 text-center">
        <Icon name="Send" size={36} className="text-sky-400" />
        <p className="text-sm text-foreground font-medium">Видео из Telegram</p>
        <p className="text-xs text-muted-foreground max-w-xs">Telegram не поддерживает встроенное воспроизведение. Откройте видео по ссылке.</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-500/20 text-sky-400 text-sm hover:bg-sky-500/30 transition-colors"
        >
          <Icon name="ExternalLink" size={14} />
          Открыть в Telegram
        </a>
      </div>
    );
  }

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        className="w-full h-full rounded-xl"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        frameBorder="0"
      />
    );
  }

  // Прямой файл
  return (
    <video
      key={url}
      src={url}
      controls
      className="w-full h-full rounded-xl"
      preload="metadata"
    />
  );
}

export default function VideoSection() {
  const { user, token } = useAuth();
  const [videos, setVideos] = useState<VideoMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>("link");
  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === "owner" || user?.role === "admin";

  const fetchVideos = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${CHAT_URL}?action=messages&channel=video&limit=100`, {
        headers: { "X-Auth-Token": token },
      });
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      const all: VideoMessage[] = data.messages || [];
      const withVideo = all.filter(m => m.video_url);
      const sorted = [...withVideo].reverse();
      setVideos(sorted);
      setActiveId(prev => prev ?? (sorted[0]?.id ?? null));
    } catch (_e) {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);
  useEffect(() => {
    const t = setInterval(fetchVideos, POLL_INTERVAL);
    return () => clearInterval(t);
  }, [fetchVideos]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 200 * 1024 * 1024) { setUploadError("Максимальный размер файла — 200 МБ"); return; }
    setVideoFile(f);
    setUploadError("");
    if (!titleInput) setTitleInput(f.name.replace(/\.[^.]+$/, ""));
    e.target.value = "";
  };

  const resetForm = () => {
    setVideoFile(null);
    setLinkInput("");
    setTitleInput("");
    setDescInput("");
    setUploadError("");
    setUploadProgress(0);
    setShowUploadForm(false);
  };

  const handlePublish = async () => {
    if (!token) return;
    if (!titleInput.trim()) { setUploadError("Введите название видео"); return; }

    setUploading(true);
    setUploadError("");

    try {
      let finalVideoUrl = "";

      if (uploadMode === "link") {
        const trimmed = linkInput.trim();
        if (!trimmed) { setUploadError("Вставьте ссылку на видео"); setUploading(false); return; }
        finalVideoUrl = trimmed;
        setUploadProgress(80);
      } else {
        if (!videoFile) { setUploadError("Выберите файл"); setUploading(false); return; }
        setUploadProgress(5);

        const mime = videoFile.type || "video/mp4";

        const presignRes = await fetch(
          `${VIDEO_UPLOAD_URL}?action=presign&filename=${encodeURIComponent(videoFile.name)}&mime=${encodeURIComponent(mime)}&token=${encodeURIComponent(token!)}`
        );
        if (!presignRes.ok) {
          const d = await presignRes.json().catch(() => ({}));
          throw new Error(d.error || `Ошибка ${presignRes.status}`);
        }
        const { upload_url, cdn_url } = await presignRes.json();

        finalVideoUrl = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", upload_url);
          xhr.setRequestHeader("Content-Type", mime);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setUploadProgress(5 + Math.round((e.loaded / e.total) * 90));
          };
          xhr.onload = () => {
            if (xhr.status < 300) resolve(cdn_url);
            else reject(new Error(`Ошибка загрузки в хранилище: ${xhr.status}`));
          };
          xhr.onerror = () => reject(new Error("Ошибка сети"));
          xhr.send(videoFile);
        });
        setUploadProgress(95);
      }

      const sendRes = await fetch(`${CHAT_URL}?action=send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({
          channel: "video",
          text: descInput.trim(),
          video_url: finalVideoUrl,
          video_title: titleInput.trim(),
        }),
      });
      if (!sendRes.ok) { setUploadError("Ошибка сохранения"); return; }
      setUploadProgress(100);
      resetForm();
      await fetchVideos();
    } catch {
      setUploadError("Ошибка публикации");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token || !isAdmin) return;
    if (!window.confirm("Удалить это видео?")) return;
    await fetch(`${CHAT_URL}?action=delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token },
      body: JSON.stringify({ message_id: id }),
    });
    setVideos(prev => prev.filter(v => v.id !== id));
    setActiveId(prev => prev === id ? (videos.find(v => v.id !== id)?.id ?? null) : prev);
  };

  const activeVideo = videos.find(v => v.id === activeId);

  return (
    <div className="flex flex-col h-full">
      {/* Шапка */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">Видео-обзоры</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">только чтение</span>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setShowUploadForm(v => !v); setUploadError(""); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Icon name={showUploadForm ? "X" : "Plus"} size={13} />
            {showUploadForm ? "Закрыть" : "Добавить видео"}
          </button>
        )}
      </div>

      {/* Форма добавления */}
      {isAdmin && showUploadForm && (
        <div className="border-b border-border bg-card/60 p-4 space-y-3 flex-shrink-0">
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
            <button
              onClick={() => setUploadMode("link")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${uploadMode === "link" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon name="Link" size={12} />
              Ссылка
            </button>
            <button
              onClick={() => setUploadMode("file")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${uploadMode === "file" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon name="Upload" size={12} />
              Файл
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Название видео *"
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder="Описание (необязательно)"
              value={descInput}
              onChange={e => setDescInput(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {uploadMode === "link" ? (
            <div className="space-y-1.5">
              <input
                type="url"
                placeholder="Ссылка на YouTube, Rutube, VK Видео, Vimeo, Telegram..."
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
              <p className="text-[11px] text-muted-foreground">
                Поддерживаются: YouTube, Rutube, VK Видео, Vimeo, Telegram · Для Telegram видео откроется по ссылке
              </p>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                videoFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <Icon name={videoFile ? "CheckCircle" : "Film"} size={22} className={videoFile ? "text-primary" : "text-muted-foreground"} />
              <span className="text-xs text-muted-foreground text-center">
                {videoFile ? videoFile.name : "Нажмите или перетащите видео (MP4, WebM, MKV, MOV · до 200 МБ)"}
              </span>
              <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,.mkv" className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {uploading && uploadMode === "file" && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Загрузка...</span><span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

          <div className="flex gap-2">
            <button
              onClick={handlePublish}
              disabled={uploading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading
                ? <><div className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />Публикую...</>
                : <><Icon name="Send" size={14} />Опубликовать</>
              }
            </button>
            <button onClick={resetForm} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Контент */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Icon name="PlayCircle" size={40} />
          <span className="text-sm">Видео-обзоров пока нет</span>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Плеер */}
          <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3 min-w-0">
            {activeVideo && (
              <>
                <div className="relative bg-black rounded-xl overflow-hidden flex-shrink-0" style={{ aspectRatio: "16/9" }}>
                  <VideoPlayer url={activeVideo.video_url!} />
                </div>
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-semibold text-foreground">{activeVideo.video_title || "Без названия"}</h2>
                    {sourceBadge(activeVideo.video_url!)}
                  </div>
                  {activeVideo.text && (
                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{activeVideo.text}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">{formatDate(activeVideo.created_at)}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">{activeVideo.nickname}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Список */}
          <div className="w-64 flex-shrink-0 border-l border-border overflow-y-auto">
            <div className="p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Все обзоры</p>
              <div className="space-y-1.5">
                {videos.map(v => (
                  <div
                    key={v.id}
                    onClick={() => setActiveId(v.id)}
                    className={`group flex gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                      activeId === v.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <div className="w-20 h-12 bg-muted rounded flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                      {detectSource(v.video_url!) === "direct" ? (
                        <video src={v.video_url!} className="w-full h-full object-cover" preload="metadata" muted />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Icon name="Play" size={18} className="text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icon name="Play" size={14} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
                        {v.video_title || "Без названия"}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {sourceBadge(v.video_url!)}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{formatDate(v.created_at)}</p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(v.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all flex-shrink-0 self-start mt-0.5"
                        title="Удалить"
                      >
                        <Icon name="Trash2" size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}